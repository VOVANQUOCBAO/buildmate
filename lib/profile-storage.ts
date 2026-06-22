import type { BuilderProfile } from "@/lib/types";

export const BUILDMATE_PROFILE_STORAGE_KEY = "buildmate-asg.builder-profile";

export function encodeProfile(profile: BuilderProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export function decodeProfile(value: string | null): BuilderProfile | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<BuilderProfile>;
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.goal !== "string" ||
      !Array.isArray(parsed.currentSkills) ||
      !Array.isArray(parsed.targetSkills)
    ) {
      return null;
    }

    return {
      name: parsed.name,
      role: parsed.role,
      goal: parsed.goal,
      currentSkills: parsed.currentSkills.filter((skill): skill is string => typeof skill === "string"),
      targetSkills: parsed.targetSkills.filter((skill): skill is string => typeof skill === "string")
    };
  } catch {
    return null;
  }
}
