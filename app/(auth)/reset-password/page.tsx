"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "../../../lib/api_/login";
import toast from "react-hot-toast";
import { SubmitButton } from "../../components/commons/SubmitButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

type ResetErrorResponse = {
    message?: string;
    status?: string;
    error_detail?: string;
};

export default function ResetPassword() {
    const router = useRouter();
    const [new_password, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");

    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        const savedEmail = sessionStorage.getItem("resetEmail");
        if (savedEmail) {
            setEmail(savedEmail);
        } else {
            router.replace("/forget-password");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("email", email);
        formData.append("new_password", new_password);

        try {
            setLoading(true);
            const result = await resetPassword(formData);

            toast.success(result.message || "Password reset successful");
            sessionStorage.removeItem("resetEmail");
            router.replace("/auth/login");
        } catch (err) {
            const error = err as { response?: { data?: ResetErrorResponse } };
            const errorDetail =
                error.response?.data?.error_detail ||
                error.response?.data?.message ||
                "Password reset failed";
            toast.error(errorDetail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Reset Password
            </h1>

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-8 text-gray-800"
            >
                {/* Email (readonly) */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100 cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showNew ? "text" : "password"}
                            value={new_password}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew((prev) => !prev)}
                            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                            {showNew ? (
                                <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                                <EyeIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <SubmitButton label="Reset Password" loading={loading} />
            </form>
        </>
    );
}
