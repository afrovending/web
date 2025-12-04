"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; 

type ErrorResponse = {
    message?: string;
    status?: string;
    error_detail?: string;
};

export default function ForgetPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("email", email);

        try {
            setLoading(true);
            const result = await forgetPassword(formData);
            sessionStorage.setItem("resetEmail", email);

            toast.success(
                result.message || "Password reset link sent to your email."
            );
            router.replace("/auth/confirm-reset-code");
        } catch (err) {
            const error = err as { response?: { data?: ErrorResponse } };
            const errorDetail =
                error.response?.data?.error_detail ||
                error.response?.data?.message ||
                "Invalide email address. Please try again.";
            toast.error(errorDetail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Forgot Password
            </h1>
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-8 text-gray-800"
            >
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none"
                        required
                    />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <SubmitButton label="Send Reset Link" loading={loading} />

                    <CancelButton
                        label="Back to Login"
                        onClick={() => router.push("/auth/login")}
                    />
                </div>
            </form>
        </>
    );
}
