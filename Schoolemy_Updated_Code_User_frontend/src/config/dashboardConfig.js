/**
 * Dashboard Configuration File
 *
 * Centralized configuration for all dashboard hardcoded values
 * Includes: colors, limits, tax rates, defaults, etc.
 */

// ==================== FILE UPLOAD LIMITS ====================
export const FILE_UPLOAD_CONFIG = {
  MAX_PROFILE_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB for profile images
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024,     // 10MB for documents
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,       // 500MB for videos
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.ms-excel'],
};

// ==================== PAGINATION CONFIG ====================
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 5,
  DEFAULT_EXAM_PAGE_SIZE: 10,
  DEFAULT_MATERIALS_PAGE_SIZE: 8,
  DEFAULT_COURSES_PAGE_SIZE: 12,
};

// ==================== TAX & FINANCIAL CONFIG ====================
// ⚠️ CRITICAL: These should ideally come from backend API
// For now centralized here to be easily configurable
export const TAX_CONFIG = {
  CGST_RATE: 0.09,        // 9% CGST (Central GST)
  SGST_RATE: 0.09,        // 9% SGST (State GST)
  TOTAL_GST_RATE: 0.18,   // 18% Total GST
  TRANSACTION_FEE_RATE: 0.02, // 2% Transaction Fee
};

// Calculate derived tax values
export const getTaxBreakdown = (baseAmount) => {
  const cgst = baseAmount * TAX_CONFIG.CGST_RATE;
  const sgst = baseAmount * TAX_CONFIG.SGST_RATE;
  const totalGST = cgst + sgst;
  const transactionFee = (baseAmount + totalGST) * TAX_CONFIG.TRANSACTION_FEE_RATE;

  return {
    baseAmount,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    transactionFee: Math.round(transactionFee * 100) / 100,
    totalAmount: Math.round((baseAmount + totalGST + transactionFee) * 100) / 100,
  };
};

// ==================== EMI CONFIG ====================
export const EMI_CONFIG = {
  MAX_ATTEMPTS: 3,           // Maximum EMI reattempts
  DEFAULT_MONTHS: 3,         // Default EMI duration
  MIN_INSTALLMENT_AMOUNT: 1000, // Minimum per installment
  SUPPORTED_DURATIONS: [1, 3, 6, 12], // Supported EMI months
};

// ==================== RESPONSIVE BREAKPOINTS ====================
export const RESPONSIVE_BREAKPOINTS = {
  CARD_MIN_WIDTH_SMALL: '250px',
  CARD_MIN_WIDTH_MEDIUM: '280px',
  CARD_MIN_WIDTH_LARGE: '300px',
  MOBILE_BREAKPOINT: '768px',
  TABLET_BREAKPOINT: '1024px',
  DESKTOP_BREAKPOINT: '1280px',
};

// ==================== DASHBOARD CARD CONFIG ====================
export const DASHBOARD_CARDS = [
  {
    id: 'lesson-status',
    title: 'Lesson Status',
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  },
  {
    id: 'exam',
    title: 'Exam',
    color: '#DC2626',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
  },
  {
    id: 'course-meets',
    title: 'Course Meets',
    color: '#7C2D12',
    gradient: 'linear-gradient(135deg, #7C2D12 0%, #431407 100%)',
  },
  {
    id: 'fees',
    title: 'Fees',
    color: '#BE185D',
    gradient: 'linear-gradient(135deg, #BE185D 0%, #831843 100%)',
  },
  {
    id: 'invoices',
    title: 'Invoices',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  },
  {
    id: 'profile',
    title: 'Profile',
    color: '#1E40AF',
    gradient: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
  },
  {
    id: 'complaints',
    title: 'Complaints',
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
  },
];

// ==================== THEME COLORS ====================
export const THEME_COLORS = {
  // Primary Colors
  PRIMARY: '#4F46E5',
  PRIMARY_LIGHT: '#818CF8',
  PRIMARY_DARK: '#4338CA',

  // Status Colors
  SUCCESS: '#059669',
  WARNING: '#F59E0B',
  ERROR: '#DC2626',
  INFO: '#0891B2',

  // Neutral Colors
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',

  // Gradients
  GRADIENT_BLUE: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  GRADIENT_GREEN: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
  GRADIENT_ORANGE: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
  GRADIENT_RED: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)',
};

// ==================== DEFAULT FALLBACK VALUES ====================
export const FALLBACK_VALUES = {
  USER_NAME: 'Student',
  COURSE_LEVEL: 'INTERMEDIATE',
  INSTRUCTOR_NAME: 'Expert Instructor',
  COURSE_RATING: 4.5,  // ⚠️ Should be removed - fetch from API
  ENROLLMENT_COUNT: 1200, // ⚠️ Should be removed - fetch from API
  AVATAR_COLOR: '#6366f1',
  PLACEHOLDER_IMAGE: 'https://via.placeholder.com/400x200?text=Course+Thumbnail',
};

// ==================== API CONFIG ====================
export const API_CONFIG = {
  REQUEST_TIMEOUT: 30000,  // 30 seconds
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,       // 1 second
};

export default {
  FILE_UPLOAD_CONFIG,
  PAGINATION_CONFIG,
  TAX_CONFIG,
  EMI_CONFIG,
  RESPONSIVE_BREAKPOINTS,
  DASHBOARD_CARDS,
  THEME_COLORS,
  FALLBACK_VALUES,
  API_CONFIG,
  getTaxBreakdown,
};
