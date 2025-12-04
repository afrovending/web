"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "../../../lib/api_/login";
import toast from "react-hot-toast";
import { SubmitButton } from "../../components/commons/SubmitButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

type LoginErrorResponse = {
    message?: string;
    status?: string;
    error_detail?: string;
};

export default function ChangePassword() {
    const router = useRouter();
    const [new_password, setNewPassword] = useState("");
    const [current_password, setCurrentPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("new_password", new_password);
        formData.append("current_password", current_password);

        try {
            setLoading(true);
            const result = await changePassword(formData);
            toast.success(result.message);
            router.push("/");
        } catch (err) {
            const error = err as { response?: { data?: LoginErrorResponse } };
            const errorDetail =
                error.response?.data?.error_detail ||
                error.response?.data?.message ||
                "Password change failed";
            toast.error(errorDetail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Change Password
            </h1>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8 text-gray-800">
                {/* Current password */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Temporary Password
                    </label>
                    <div className="relative">
                        <input
                            type={showCurrent ? "text" : "password"}
                            value={current_password}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current Password"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent((prev) => !prev)}
                            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                            {showCurrent ? (
                                <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                                <EyeIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* New password */}
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

                <SubmitButton label="Change Password" loading={loading} />
            </form>
        </>
    );
}
