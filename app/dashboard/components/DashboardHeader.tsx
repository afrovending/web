"use client";

import Image from "next/image";
import Link from "next/link";

interface DashboardHeaderProps {
  title: string;
  breadcrumb: { label: string; href?: string }[];
  backgroundImage?: string;
}

export default function DashboardHeader({
  title,
  breadcrumb,
  backgroundImage = "/images/hero.jpg", 
}: DashboardHeaderProps) {
  return (
    <div className="relative w-full h-48 flex items-center bg-gray-100 overflow-hidden">
      {/* Background Image */}
      <Image
        src={backgroundImage}
        alt="Dashboard Banner"
        fill
        priority
        className="object-cover object-center opacity-90"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Text Content */}
      <div className="relative z-10 container mx-auto px-6">
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>

        <nav className="text-white/80 text-sm flex items-center space-x-2">
          {breadcrumb.map((item, idx) => (
            <span key={idx} className="flex items-center">
              {item.href ? (
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {idx < breadcrumb.length - 1 && <span className="mx-2">›</span>}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
