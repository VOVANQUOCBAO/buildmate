// One-shot end-to-end auth+DB+RLS test against the live Supabase project.
const SUPA = "https://ndkwqtpndychtpxghlzc.supabase.co";
const KEY = "sb_publishable_nNaH0bdEZLD_hzVd5TRt4A_nz0h24px";
const email = `judge.demo+${Date.now()}@gmail.com`;
const password = "JudgeDemo123!";

const h = (token) => ({
  apikey: KEY,
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

console.log("Test account:", email);

// 1) signup
const su = await (await fetch(`${SUPA}/auth/v1/signup`, {
  method: "POST",
  headers: h(),
  body: JSON.stringify({ email, password, data: { name: "Judge Demo" } })
})).json();
console.log("1) SIGNUP -> user:", su.id || su.user?.id, "| session:", !!su.access_token);

// 2) login
const li = await (await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: h(),
  body: JSON.stringify({ email, password })
})).json();
const token = li.access_token;
const uid = li.user?.id;
console.log("2) LOGIN  ->", token ? `OK uid=${uid}` : `FAIL ${li.error_description || li.msg}`);
if (!token) process.exit(1);

// 3) read own profile (created by trigger, returned only if RLS lets owner read)
const prof = await (await fetch(`${SUPA}/rest/v1/profiles?select=id,name,role`, { headers: h(token) })).json();
console.log("3) PROFILE-> rows:", prof.length, prof[0] ? JSON.stringify(prof[0]) : "");

// 4) write journey_progress
const ins = await (await fetch(`${SUPA}/rest/v1/journey_progress`, {
  method: "POST",
  headers: { ...h(token), Prefer: "return=representation" },
  body: JSON.stringify({ user_id: uid, phase: "shipping", status: "in_progress" })
})).json();
console.log("4) INSERT -> ", JSON.stringify(ins));

// 5) read back
const back = await (await fetch(`${SUPA}/rest/v1/journey_progress?select=phase,status`, { headers: h(token) })).json();
console.log("5) READBACK->", JSON.stringify(back));

// 6) RLS isolation: another user must NOT see this row
const email2 = `judge.other+${Date.now()}@gmail.com`;
await fetch(`${SUPA}/auth/v1/signup`, { method: "POST", headers: h(), body: JSON.stringify({ email: email2, password }) });
const li2 = await (await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
  method: "POST", headers: h(), body: JSON.stringify({ email: email2, password })
})).json();
if (li2.access_token) {
  const other = await (await fetch(`${SUPA}/rest/v1/journey_progress?select=phase,status`, { headers: h(li2.access_token) })).json();
  console.log("6) RLS    -> other user sees", other.length, "rows (must be 0)");
}
