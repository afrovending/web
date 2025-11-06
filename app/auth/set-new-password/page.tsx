'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import LeftSideImage from '../components/LeftSideImage';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { verifyOtp, resetPassword } from '@/lib/api/auth/reset';
import { ClipLoader } from 'react-spinners';

export default function Setnew_passwordPage() {
  const router = useRouter();

  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [new_password, setnew_password] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp({ otp, email: sessionStorage.getItem('pendingEmail') as string });
      if (response.status = 'success') {
        toast.success('OTP verified! You can now set your new password.');
        setStep('password');
      } else {
        toast.error('Invalid or expired OTP.');
      }
    } catch (err) {
      toast.error('Verification failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 — Set new password
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (new_password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({ new_password, email: sessionStorage.getItem('pendingEmail') as string });
      if (response.status === 'success') {
        toast.success('Password reset successfully! Redirecting...');
        sessionStorage.removeItem('pendingEmail');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        toast.error('Failed to reset password. Try again.');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 text-gray-800">
      {/* Left side image */}
      <LeftSideImage />

      {/* Right side form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-8 py-10">
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            {step === 'otp' ? 'Verify OTP ' : 'Set New Password '}
          </h1>
          <p className="text-gray-500 mb-6">
            {step === 'otp'
              ? 'Enter the 6-digit verification code sent to your email.'
              : 'Enter your new password below to complete the reset process.'}
          </p>

          {step === 'otp' ? (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-gray-300 rounded-md px-4 py-4 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-full transition disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  name="new_password"
                  value={new_password}
                  onChange={(e) => setnew_password(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter New Password"
                  className="w-full border border-gray-300 rounded-md px-4 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600"
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-full transition disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <ClipLoader size={18} color="#fff" />
                    <span>Updating...</span>
                  </>
                ) : (
                  'Set New Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
