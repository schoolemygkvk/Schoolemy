import crypto from 'crypto';
import CONFIG from '../config/constants.js';

export const generateOtp = () => {
    const otp = crypto.randomInt(CONFIG.TUTOR_ID_RANDOM_RANGE.min, CONFIG.TUTOR_ID_RANDOM_RANGE.max).toString();
    const otpExpiresAt = new Date(Date.now() + CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);
    return { otp, otpExpiresAt };
};
