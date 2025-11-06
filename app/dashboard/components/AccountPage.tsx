"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import User from "@/interfaces/user";

export default function AccountPage() {
    const [user, setUser] = useState<User>();

    useEffect(() => {
        // Load user data from localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) return null;

    return (
        <>
            <main className="px-6 py-10 bg-gray-50 min-h-screen">
                <div className="max-w-5xl mx-auto">
                    {/* Greeting */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Hello, {user.name || "User"} 👋
                        </h2>
                        <p className="text-gray-600 mt-2">
                            From your account dashboard, you can easily check your{" "}
                            <span className="text-green-600 font-medium">Recent Orders</span>, manage your{" "}
                            <span className="text-green-600 font-medium">Shipping</span> and{" "}
                            <span className="text-green-600 font-medium">Billing Addresses</span>, and edit your{" "}
                            <span className="text-green-600 font-medium">Account Details</span>.
                        </p>
                    </div>

                    {/* Info Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                                <Image
                                    src={user.profile_photo || "/favicon.icon"}
                                    alt={user.name}
                                    width={96}
                                    height={96}
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                            <p className="text-gray-500 text-sm">Customer</p>
                            <Link
                                href="/account/edit-profile"
                                className="mt-3 text-green-600 font-medium hover:underline"
                            >
                                Edit Profile
                            </Link>
                        </div>

                        {/* Shipping Address Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <p className="text-gray-400 text-sm mb-2">Shipping Address</p>
                            <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">{user.address || "No address added yet"}</p>
                            <p className="text-gray-600 text-sm">{user.email}</p>
                            <p className="text-gray-600 text-sm">{user.phone || "N/A"}</p>
                            <Link
                                href="/account/address"
                                className="mt-3 inline-block text-green-600 font-medium hover:underline"
                            >
                                Edit Address
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
