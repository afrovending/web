'use client';

import Image from 'next/image';

export default function LeftSideImage() {
  return (
    <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-50 relative">
      <Image
        src="/images/login-hero.jpg"
        alt="Signup visual"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}
