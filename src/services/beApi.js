// Backward-compat module.
// Prefer importing from:
// - src/services/authService.js
// - src/services/profileService.js
// - src/services/axios.js

import authService from './authService';
import profileService from './profileService';

export { setAuthToken } from './axios';

// =========================
// Auth APIs
// =========================
export const loginAdmin = (payload) => authService.loginAdmin(payload);
export const loginUser = (payload) => authService.loginUser(payload);
export const registerCustomer = (payload) => authService.registerCustomer(payload);
export const verifyEmailUser = (payload) => authService.verifyEmailUser(payload);
export const resendVerificationUser = (payload) => authService.resendVerificationUser(payload);
export const forgotPasswordAdmin = (payload) => authService.forgotPasswordAdmin(payload);
export const forgotPasswordUser = (payload) => authService.forgotPasswordUser(payload);

// =========================
// Profile APIs
// =========================
export const getMyProfile = () => profileService.getMyProfile();
export const updateMyProfile = (payload) => profileService.updateMyProfile(payload);
export const changeMyPassword = (payload) => profileService.changeMyPassword(payload);
export const requestEmailChange = (newEmail) => profileService.requestEmailChange(newEmail);
export const verifyEmailChange = (payload) => profileService.verifyEmailChange(payload);
