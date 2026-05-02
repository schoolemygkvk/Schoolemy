
export function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || typeof s !== "string") {
    throw new Error(
      "JWT_SECRET is required. Set it in the environment before signing or verifying tokens.",
    );
  }
  return s;
}
