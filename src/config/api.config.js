export const API_CONFIG = {
  ENDPOINTS: {
    AUTH: {
      ADMIN_LOGIN: '/api/auth/admin/login',
      ADMIN_VERIFY_EMAIL: '/api/auth/admin/verify-email',
      ADMIN_RESEND_VERIFICATION: '/api/auth/admin/resend-verification',
      USER_LOGIN: '/api/auth/user/login',
      USER_REGISTER: '/api/auth/user/register',
      USER_VERIFY_EMAIL: '/api/auth/user/verify-email',
      USER_RESEND_VERIFICATION: '/api/auth/user/resend-verification',
      ADMIN_FORGOT_PASSWORD: '/api/auth/admin/forgot-password',
      USER_FORGOT_PASSWORD: '/api/auth/user/forgot-password',
    },
    PROFILE: {
      GET_ME: '/api/user/profile',
      UPDATE_ME: '/api/user/profile',
      CHANGE_PASSWORD: '/api/user/profile/password',
      UPLOAD_AVATAR: '/api/user/profile/avatar',
      EMAIL_CHANGE_REQUEST: '/api/user/profile/email/request',
      EMAIL_CHANGE_VERIFY: '/api/user/profile/email/verify',
    },
    PROFILE_ADMIN: {
      GET_ME: '/api/admin/profile',
      UPDATE_ME: '/api/admin/profile',
      CHANGE_PASSWORD: '/api/admin/profile/password',
      UPLOAD_AVATAR: '/api/admin/profile/avatar',
      EMAIL_CHANGE_REQUEST: '/api/admin/profile/email/request',
      EMAIL_CHANGE_VERIFY: '/api/admin/profile/email/verify',
    },
    WISHLIST: {
      GET_MY: '/api/user/wishlist',
      ADD: '/api/user/wishlist',
      REMOVE: '/api/user/wishlist',
      MERGE: '/api/user/wishlist/merge',
    },
    MANAGER: {
      // Posts
      POSTS: '/api/manager/posts',
      POST_BY_ID: (id) => `/api/manager/posts/${id}`,
      POST_APPROVE: (id) => `/api/manager/posts/${id}/approve`,
      POST_REJECT: (id) => `/api/manager/posts/${id}/reject`,
      // Banners & Ads (MarketingResource type='banner')
      BANNERS: '/api/manager/banners',
      BANNER_BY_ID: (id) => `/api/manager/banners/${id}`,
      // Privacy
      PRIVACY: '/api/manager/privacy',
      PRIVACY_BY_ID: (id) => `/api/manager/privacy/${id}`,
      // Feedback
      FEEDBACK: '/api/manager/feedback',
      FEEDBACK_SUMMARY: '/api/manager/feedback/summary',
      // Statistics
      STATISTICS_SUMMARY: '/api/manager/statistics/summary',
      STATISTICS_BOOKINGS_TREND: '/api/manager/statistics/bookings-trend',
      STATISTICS_REVENUE_TREND: '/api/manager/statistics/revenue-trend',
      STATISTICS_HOT_FIELDS: '/api/manager/statistics/hot-fields',
      // Scope (assigned owners)
      SCOPE_OWNERS: '/api/manager/scope/owners',
    },
    BOOKING: {
      GET_MY_BOOKINGS: '/api/bookings/my',
      CREATE: '/api/bookings',
      CANCEL: '/api/bookings/cancel',
      FEEDBACK_ELIGIBILITY: (bookingId) => `/api/bookings/${bookingId}/feedback-eligibility`,
      FEEDBACK_FIELD_ELIGIBILITY: (fieldId) => `/api/bookings/feedback-eligibility/field/${fieldId}`,
      FEEDBACK_CREATE: '/api/bookings/feedback',
      FEEDBACK_UPDATE: (feedbackId) => `/api/bookings/feedback/${feedbackId}`,
      FEEDBACK_DELETE: (feedbackId) => `/api/bookings/feedback/${feedbackId}`,
    },
    WALLET: {
      TOP_UP: '/api/wallets/topup',
      GET_BALANCE: '/api/wallets/balance',
      GET_TRANSACTIONS: '/api/wallets/transactions',
    },
    SERVICE: {
      GET_BY_BOOKING_DETAIL: '/api/services/booking-detail',
      GET_MY_HISTORY: '/api/services/my',
      BOOK: '/api/services',
    },
    UPLOADS: {
      UPLOAD_IMAGES: '/api/uploads/images',
    },
  },
};