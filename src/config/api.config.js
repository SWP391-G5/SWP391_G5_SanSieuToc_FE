export const API_CONFIG = {
  ENDPOINTS: {
    AUTH: {
      ADMIN_LOGIN: '/api/auth/admin/login',
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
  },
};
