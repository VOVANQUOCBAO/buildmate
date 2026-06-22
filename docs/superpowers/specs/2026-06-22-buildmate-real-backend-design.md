# BuildMate ASG — Hoàn thiện sản phẩm thật có backend (Design Spec)

- **Ngày**: 2026-06-22
- **Hướng đã chọn**: C — Đầy đủ + deploy + Claude bật
- **Trạng thái**: Đã duyệt design, chuẩn bị lập kế hoạch triển khai (writing-plans)

---

## 1. Mục tiêu & Definition of Done

Biến BuildMate ASG từ "demo shell có env+mock fallback" thành **sản phẩm chạy thật**, không còn mock ở các đường chính:

- [ ] Auth + DB Supabase thật, đã provision và **verify end-to-end**:
      đăng ký → trigger seed profile → onboarding lưu DB → dashboard đọc DB →
      saved actions bền vững qua reload → đăng xuất.
- [ ] **Claude AI layer thật** tại `/api/explain` (grounded theo điểm số), tự fallback khi thiếu key.
- [ ] **`journey_progress`** hoàn thiện theo đúng pattern `saved_actions` (đọc/ghi + UI + fallback localStorage).
- [ ] **Deploy production lên Vercel**, redirect URL Supabase trỏ về domain prod.
- [ ] `npm run lint` + `npm run build` sạch; README phản ánh trạng thái thật.

**Ngoài phạm vi (lần này):** Google/GitHub OAuth (code đã sẵn, bật sau khi tạo OAuth app); on-chain credentials; các feature ở `next-steps.md` mục #7–#10.

---

## 2. Hiện trạng (đã khảo sát)

**Đã hoàn chỉnh:**
- Kiến trúc env-switch + graceful fallback: `lib/supabase/config.ts` (`isSupabaseConfigured`).
- Auth UI `app/auth/page.tsx`: password (signup/signin), magic link (OTP), OAuth (Google/GitHub); `app/auth/callback`, `app/auth/signout`.
- DB layer `lib/supabase/user-data.ts`: `getCurrentUser`, `getDbProfile`, `upsertDbProfile`, `listSavedActions`, `toggleSavedAction` — tất cả mock-safe.
- API: `/api/profile` (GET + PUT→`upsertDbProfile`), `/api/saved-actions` (GET/POST), `/api/dashboard` (precedence: query profile > DB profile > fixture).
- Client: `app/onboarding/page.tsx` lưu profile qua `/api/profile`; `lib/saved-actions-store.ts`.
- Migration `supabase/migrations/0001_init.sql`: bảng `profiles`, `saved_actions`, `journey_progress` + RLS + trigger `handle_new_user`.
- `.env.example` tài liệu hóa mọi biến môi trường.

**Còn dở (2 mảnh code chức năng):**
1. **Claude AI layer**: `/api/explain/route.ts` vẫn là template chuỗi tĩnh; SDK `@anthropic-ai/sdk` đã cài, env var đã có tài liệu, nhưng **không có dòng nào gọi Claude**.
2. **`journey_progress`**: chỉ có bảng + RLS trong migration; **không** có hàm đọc/ghi trong `user-data.ts`, `/api/journey` chỉ trả fixtures tĩnh, UI chưa có nút đổi trạng thái.

**Chưa làm (vận hành):** chưa có `.env.local` → app mới chỉ chạy mock mode; chưa chạy migration trên project thật; chưa deploy.

---

## 3. Kiến trúc

Giữ nguyên pattern **env-switch + graceful fallback**. Nguyên tắc bất biến:
> Mọi thứ thêm vào phải tự degrade khi thiếu env, để `npm run dev` luôn chạy được kể cả không có backend.

- Real mode bật khi `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` có mặt.
- Claude bật khi `ANTHROPIC_API_KEY` có mặt; vắng → template deterministic.
- **Không dùng `service_role` key** ở bất kỳ đâu (app dựa trên anon key + user session + RLS). Service_role đã bị lộ trong quá trình trao đổi → **phải rotate**.

---

## 4. Phân rã công việc theo phase

Mỗi phase kết thúc bằng một **checkpoint dừng-hỏi** (theo style làm việc của user) và một bước verify (`kiem-tra-truoc-khi-xong`).

### P1 — Supabase live (local)
- Tạo `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL=https://cgkxyattkccfugvjgokt.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  - (KHÔNG đặt service_role.)
- Chạy migration `0001_init.sql` lên project thật (Supabase SQL editor hoặc `supabase db push`).
- Bật auth: email/password + magic link (chạy out-of-the-box). Cấu hình confirm email theo nhu cầu demo.
- **Verify end-to-end (local):** signup → kiểm tra row `profiles` được trigger tạo → `/onboarding` lưu → reload thấy "Personalized from onboarding" đọc từ DB → bookmark 1 recommendation, reload vẫn còn → signout về mock/demo.
- **Cổng cần user:** chạy SQL trên dashboard; bật providers.

### P2 — Claude AI layer
- Tạo `lib/ai/explain.ts`:
  - Đọc `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (mặc định **Claude Haiku 4.5**).
  - Input: recommendation (title, score, lý do điểm/`engineVersion`, detail, nextSteps) + profile (goal, currentSkills, targetSkills/skill gaps).
  - Prompt: yêu cầu Claude **giải thích & cá nhân hóa kết quả engine đã chấm**, KHÔNG tự bịa khuyến nghị mới (tránh "generic chatbot" — đúng tiêu chí giải).
  - Output có cấu trúc: `{ explanation: string, nextSteps: string[] }`.
  - Thiếu key hoặc lỗi gọi API → trả về template deterministic hiện tại (không vỡ).
- `/api/explain/route.ts` chuyển sang async, gọi `lib/ai/explain.ts`.
- Tra `claude-api` skill để lấy model id + cú pháp `@anthropic-ai/sdk` chuẩn khi code.
- **Cổng cần user (G1):** cắm `ANTHROPIC_API_KEY` để bật; tới khi có thì chạy fallback.
- **Verify:** không key → vẫn ra giải thích template; có key → ra giải thích grounded, không bịa.

### P3 — journey_progress (mirror saved_actions 1:1)
- `lib/supabase/user-data.ts`: thêm `listJourneyProgress()`, `setJourneyStatus(phase, status)` — mock-safe.
- `app/api/journey-progress/route.ts`: GET (list) + POST (set), 401 khi chưa auth (client fallback localStorage).
- Client store + nút đổi trạng thái trong `components/journey-timeline.tsx`; fallback localStorage khi mock mode.
- Status hợp lệ: `not_started | in_progress | done | blocked`.
- RLS đã có sẵn → không sửa migration (trừ khi thiếu cột).
- **Verify:** đổi trạng thái 1 phase khi đã đăng nhập → reload còn nguyên (DB); khi mock → còn nguyên (localStorage).

### P4 — Deploy Vercel
- `vercel` deploy; set env prod: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=<domain prod>`, `ANTHROPIC_API_KEY` (nếu đã có), `ANTHROPIC_MODEL` (tùy chọn).
- Supabase dashboard: thêm domain prod vào **Site URL** + **Redirect URLs** (`<domain>/auth/callback`).
- **Cổng cần user (G2):** `! vercel login` (tương tác); cập nhật redirect URL trên Supabase.
- **Verify trên prod:** signup/login → onboarding lưu DB → saved actions bền vững → AI explain (fallback hoặc thật).

### P5 — Chốt
- `npm run lint` + `npm run build` sạch.
- Cập nhật `README.md` + `docs/` phản ánh trạng thái backend thật (bỏ "mock-only").
- Dọn dẹp file thừa nếu có (vd `proxy.ts` nếu không dùng).

---

## 5. Quyết định đã chốt (có thể đổi)

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Auth bật ngay | email/password + magic link | Chạy liền, không cần OAuth app ngoài |
| Google/GitHub OAuth | Hoãn | Code đã sẵn; cần tạo OAuth app riêng |
| service_role key | Không dùng + rotate | App dựa RLS + anon key; key đã lộ |
| Deploy platform | Vercel | Chuẩn cho Next.js 16 + Supabase |
| Claude model mặc định | Haiku 4.5 (override qua `ANTHROPIC_MODEL`) | Rẻ/nhanh cho tác vụ explanation |
| journey_progress | Hoàn thiện (P3) | Bảng đã có; làm schema trung thực + thêm giá trị thật |

---

## 6. Rủi ro & lưu ý

- **Lộ secret**: service_role đã xuất hiện trong chat → rotate trước khi go-live.
- **Phụ thuộc credential**: P2 (AI bật) chờ Anthropic key; P4 chờ Vercel login. Hai cổng này không chặn các phase khác nhờ fallback.
- **Index/build cache**: có `.next/` cũ — verify trên build sạch.
- **Git**: thư mục hiện chưa chắc là git repo; nếu chưa, cân nhắc `git init` để commit spec + theo dõi thay đổi.

---

## 7. Bước tiếp theo

Chuyển sang skill **viet-ke-hoach (writing-plans)** để biến spec này thành kế hoạch triển khai chi tiết theo từng phase (P1→P5), mỗi phase có bước verify và checkpoint.
