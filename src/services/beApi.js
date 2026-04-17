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
export const getMyProfile = (accountType) => profileService.getMyProfile(accountType);
export const updateMyProfile = (payload, accountType) => profileService.updateMyProfile(payload, accountType);
export const changeMyPassword = (payload, accountType) => profileService.changeMyPassword(payload, accountType);
export const requestEmailChange = (newEmail, accountType) =>
  profileService.requestEmailChange(newEmail, accountType);
export const verifyEmailChange = (payload, accountType) =>
  profileService.verifyEmailChange(payload, accountType);
