'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import LeftSideImage from '../components/LeftSideImage';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { loginUser } from '@/lib/api/auth/login';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.email || !formData.password) {
            toast.error('Please enter both email and password.');
            return;
        }

        setLoading(true);

        try {
            const response = await loginUser({
                email: formData.email,
                password: formData.password,
            });

            if (response?.status === 'success' && response?.user) {
                toast.success('🎉 Login successful!');
                localStorage.setItem('user', JSON.stringify(response.user));
                router.push('/dashboard');
            } else {
                toast.error(response?.message || 'Invalid login credentials.');
            }

        } catch (err) {
            console.error('❌ Login failed:', err);

            const error = err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };
                };
            };

            const apiErrors = error.response?.data?.errors;
            if (apiErrors) {
                const firstErrorKey = Object.keys(apiErrors)[0];
                const firstErrorMsg = apiErrors[firstErrorKey]?.[0];
                toast.error(firstErrorMsg || 'Something went wrong. Please try again.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Network error. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 text-gray-800">
            {/* Left Side Image */}
            <LeftSideImage />

            {/* Right Side - Login Form */}
            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-8 py-10">
                <div className="max-w-md w-full">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back 👋</h1>
                    <p className="text-gray-500 mb-6">Log in to continue to your account</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                            placeholder="Email Address"
                            className="w-full border border-gray-300 rounded-md px-4 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 "
                            required
                        />

                        <div className="relative">
                            <input
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="w-full border border-gray-300 rounded-md px-4 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-700 hover:text-green-600 cursor-pointer"
                            >
                                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                            </button>
                        </div>


                        <div className="text-right">
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-green-600 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-full transition disabled:opacity-60 flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <ClipLoader size={20} color="#fff" />
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                "Login"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-gray-300" />
                        <span className="mx-3 text-gray-500 text-sm">Or continue with</span>
                        <hr className="flex-grow border-gray-300" />
                    </div>

                    {/* Google Sign-In */}
                    <GoogleSignInButton />

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/register" className="text-green-600 font-medium hover:underline cursor-pointer">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
