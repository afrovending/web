'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSideImage from '../components/LeftSideImage';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import { verifyOtp } from '@/lib/api/auth/reset';

export default function VerifyEmailOtpPage() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('pendingEmail');
        if (storedEmail) {
            setEmail(storedEmail);
        } else {
            router.push('/auth/signup');
        }
    }, [router]);

    const handleOtpSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error('OTP must be 6 digits.');
            return;
        }
        setLoading(true);

        try {
            const response = await verifyOtp({ otp, email });

            if (response?.status === 'success') {
                toast.success('✅ OTP verified successfully!');
                sessionStorage.removeItem('pendingEmail');
                setTimeout(() => router.push('/auth/login'), 1500);
            } else {
                toast.error(response?.message || 'Invalid or expired OTP.');
            }
        } catch (error) {
            console.error('❌ OTP verification failed:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 text-gray-800">
            <LeftSideImage />

            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-8 py-10">
                <div className="max-w-md w-full">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-gray-500 mb-6">
                        Enter the 6-digit verification code sent to your email address.
                    </p>

                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <input
                            name="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            className="w-full border border-gray-300 rounded-md px-4 py-4 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full cursor-pointer flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-full transition disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <ClipLoader size={18} color="#fff" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                'Verify OTP'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Didn’t receive the code?{' '}
                        <button
                            type="button"
                            className="text-green-600 font-medium hover:underline"
                            onClick={() => toast.success('📩 OTP resent to your email.')}
                        >
                            Resend OTP
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
