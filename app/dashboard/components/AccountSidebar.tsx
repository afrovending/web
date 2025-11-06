"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FaTachometerAlt,
    FaShoppingBag,
    FaHeart,
    FaMapMarkerAlt,  
    FaGift, 
    FaQuestionCircle,
    FaSignOutAlt,
} from "react-icons/fa";

const menuItems = [
    { name: "Account Overview", href: "/dashboard", icon: FaTachometerAlt },
    { name: "Orders", href: "/dashboard/orders", icon: FaShoppingBag },
    { name: "Wishlist", href: "/dashboard/wishlist", icon: FaHeart },
    { name: "Address", href: "/dashboard/address", icon: FaMapMarkerAlt },
    { name: "Refer & Earn", href: "/dashboard/refer", icon: FaGift },
    { name: "Customer Support", href: "/dashboard/support", icon: FaQuestionCircle },
];

export default function AccountSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-gray-100 p-5 h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto shadow-sm rounded-xl">
            <nav className="space-y-2">
                {menuItems.map(({ name, href, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-green-100 text-green-700 font-semibold"
                                    : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                                }`}
                        >
                            <Icon size={18} />
                            <span>{name}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={() => {
                        console.log("Logout clicked");
                    }}
                    className="flex items-center space-x-3 text-red-600 mt-6 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 w-full"
                >
                    <FaSignOutAlt size={18} />
                    <span>Log out</span>
                </button>
            </nav>
        </aside>
    );
}
