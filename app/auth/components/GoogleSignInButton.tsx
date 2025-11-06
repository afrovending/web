'use client';

import { FcGoogle } from 'react-icons/fc';

export default function GoogleSignInButton() {
  const handleGoogleSignIn = () => {
    // TODO: integrate with your auth provider (NextAuth or Firebase)
    console.log("Google Sign-In clicked");
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full border border-gray-300 rounded-full py-2.5 flex items-center justify-center gap-2 hover:bg-gray-100 transition"
    >
      <FcGoogle size={22} />
      <span className="text-gray-700 font-medium">Google</span>
    </button>
  );
}
