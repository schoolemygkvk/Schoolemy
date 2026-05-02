
export const PROFILE_PICTURE_UPDATED_EVENT = "schoolemy:profile-picture-updated";


export function resolveProfilePictureSrc(img) {
  if (!img) return null;
  const trimmed = String(img).trim();
  if (trimmed.startsWith("data:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.length < 50) return null;
  return `data:image/jpeg;base64,${trimmed}`;
}

export function getDisplayInitials(name) {
  if (!name) return null;
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
