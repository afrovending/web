'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftSideImage from '../components/LeftSideImage';
import GoogleSignInButton from '../components/GoogleSignInButton';
import naijaStateLocalGov from 'naija-state-local-government';
import { registerUser, ApiErrorResponse } from '@/lib/api/auth/register';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();

  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    street: '',
    city: '',
    state: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setStates(naijaStateLocalGov.states());
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = e.target.value;
    setSelectedState(state);
    const result = naijaStateLocalGov.lgas(state);
    setLgas(result?.lgas || []);
    setFormData((prev) => ({ ...prev, state }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData, state: selectedState };

    try {
      await registerUser(payload);
      // Store the email in sessionStorage
      sessionStorage.setItem('pendingEmail', payload.email);
      toast.success('🎉 Account created successfully!. Verify email to continue');
      router.push('/auth/verify-email');
    } catch (err) {
      const error = err as { response?: { data?: ApiErrorResponse } };
      const apiErrors = error.response?.data?.errors;

      if (apiErrors) {
        const firstKey = Object.keys(apiErrors)[0];
        toast.error(apiErrors[firstKey]?.[0] ?? 'Validation error occurred.');
      } else {
        toast.error(error.response?.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 text-gray-800">
      <LeftSideImage />

      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-8 py-10">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500 mb-6">Join us and start shopping smarter!</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="First name"
                className={inputFieldClass}
                required
              />
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className={inputFieldClass}
                required
              />
            </div>

            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="Email address"
              className={inputFieldClass}
              required
            />

            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              placeholder="Phone number"
              className={inputFieldClass}
            />

            <div className="relative">
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={`${inputFieldClass} pr-12`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700 hover:text-green-600 cursor-pointer"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <input
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Street address"
              className={inputFieldClass}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={selectedState}
                onChange={handleStateChange}
                className={inputFieldClass}
                required
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={inputFieldClass}
                required
                disabled={!selectedState}
              >
                <option value="">
                  {selectedState ? 'Select City/LGA' : 'Select a State first'}
                </option>
                {lgas.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" required className="accent-green-600 w-4 h-4 cursor-pointer" />
              <p>
                I agree to the{' '}
                <Link href="/terms" className="text-green-600 hover:underline">
                  Terms
                </Link>{' '}
                &{' '}
                <Link href="/privacy" className="text-green-600 hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-full transition disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <ClipLoader size={18} color="#fff" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-3 text-gray-500 text-sm">Or continue with</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <GoogleSignInButton />

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/** ✅ Shared input field style */
const inputFieldClass =
  "w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 transition placeholder-gray-400 hover:border-green-400";
