

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;


const getCashfreeHeaders = () => {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error(
      "Cashfree API credentials not configured. Ensure CASHFREE_APP_ID and CASHFREE_SECRET_KEY are set in .env",
    );
  }

  return {
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
    "x-api-version": "2023-08-01", // Required by Cashfree v3 API
    "Content-Type": "application/json",
  };
};


export const validateCashfreeConfig = () => {
  const required = {
    CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY,
    CASHFREE_BASE_URL,
  };

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      throw new Error(
        `Cashfree configuration error: ${key} is not set. Check your .env file.`,
      );
    }
  }
};

export { CASHFREE_BASE_URL, CASHFREE_APP_ID, CASHFREE_SECRET_KEY, getCashfreeHeaders };
