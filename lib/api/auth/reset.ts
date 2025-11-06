import api from "../axios";

export interface ResetLinkPayload {
  email: string;
}

export interface VerifyOtpPayload {
  otp: string;
  email: string;
}

export interface ResetPasswordPayload {
  new_password: string;
  email: string;
}

/**
 * ✅ Request password reset link (sends OTP or reset link to email)
 */
export async function resetPasswordLink(data: ResetLinkPayload) {
  const res = await api.post("/forgot-password", data);
  return res.data;
}

/**
 * ✅ Verify OTP from user email
 */
export async function verifyOtp(data: VerifyOtpPayload) {
  const res = await api.post("/verify-email", data);
  return res.data;
}

/**
 * ✅ Set new password after OTP verification
 */
export async function resetPassword(data: ResetPasswordPayload) {
  const res = await api.post("/reset-password", {
    ...data,
    device_name: navigator.userAgent,
  });
  return res.data;
}
