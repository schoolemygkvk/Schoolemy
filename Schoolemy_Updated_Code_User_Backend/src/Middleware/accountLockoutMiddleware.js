// SECURITY CHECKLIST: Account lockout after failed login attempts
import User from "../Models/User-Model/User-Model.js";
import { logger } from "../Utils/logger.js";

const FAILED_LOGIN_ATTEMPTS_LIMIT = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds


export const checkAccountLockout = async (req, res, next) => {
  try {
    const { email, mobile } = req.body;
    const mobileNumber = mobile ? parseInt(mobile.replace(/[^\d]/g, ""), 10) : null;
    const query = email ? { email } : { mobile: mobileNumber };

    const user = await User.findOne(query).lean();

    if (user && user.accountLockedUntil) {
      const now = new Date();
      if (now < new Date(user.accountLockedUntil)) {
        const remainingTime = Math.ceil(
          (new Date(user.accountLockedUntil) - now) / 1000 / 60,
        );
        logger.warn(`Account locked: ${email || mobile} - ${remainingTime} minutes remaining`);
        return res.status(429).json({
          success: false,
          message: `Account is locked due to too many failed login attempts. Try again in ${remainingTime} minutes.`,
          code: "ACCOUNT_LOCKED",
          remainingTime,
        });
      } else {
        // Lockout period expired, reset the counter
        await User.updateOne(query, {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        });
      }
    }

    next();
  } catch (error) {
    logger.error("Account lockout check error:", error);
    next();
  }
};


export const recordFailedLoginAttempt = async (email, mobile) => {
  try {
    const mobileNumber = mobile ? parseInt(mobile.replace(/[^\d]/g, ""), 10) : null;
    const query = email ? { email } : { mobile: mobileNumber };

    const user = await User.findOne(query);
    if (!user) return;

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    if (user.failedLoginAttempts >= FAILED_LOGIN_ATTEMPTS_LIMIT) {
      user.accountLockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
      logger.warn(
        `Account locked: ${email || mobile} after ${FAILED_LOGIN_ATTEMPTS_LIMIT} failed attempts`,
      );
    }

    await user.save();
  } catch (error) {
    logger.error("Failed to record login attempt:", error);
  }
};


export const resetFailedLoginAttempts = async (email, mobile) => {
  try {
    const mobileNumber = mobile ? parseInt(mobile.replace(/[^\d]/g, ""), 10) : null;
    const query = email ? { email } : { mobile: mobileNumber };

    await User.updateOne(query, {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    });
  } catch (error) {
    logger.error("Failed to reset login attempts:", error);
  }
};

export default {
  checkAccountLockout,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
};
