
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  // Trim whitespace
  const trimmedEmail = email.trim();

  // Basic length check
  if (trimmedEmail.length > 254 || trimmedEmail.length < 5) return false;


  const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmedEmail)) return false;

  // Additional validations
  const [localPart, domain] = trimmedEmail.split("@");

  // Check for consecutive dots
  if (localPart.includes("..") || domain.includes("..")) return false;

  // Check if starts or ends with dot
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;

  // Domain must have at least 2 parts
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;

  // TLD must be at least 2 characters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || /[0-9]/.test(tld)) return false;

  // Local part length check (max 64 characters)
  if (localPart.length > 64) return false;

  return true;
};

export const isValidPassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};


export const isValidMobile = (mobile) => {
  const mobileRegex = /^\+?[1-9]\d{1,3}\d{9}$/;
  return mobileRegex.test(mobile);
};
