"use client";

import React, { useEffect, useState } from "react";
import { COMPANY_CONTACT_INFO } from "@/setting";
import { getPolicy } from "@/lib/api/contact";
import { formatHumanReadableDate } from "@/utils/formatDate";

// Define an interface for the API response
interface PolicyData {
  title: string;
  updated_at: string;
  content: string; // Assuming the API returns HTML or pre-formatted text
}

const PrivacyPolicyPage: React.FC = () => {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const data = await getPolicy("privacy");
        setPolicy(data);
      } catch (err) {
        setError("Failed to load privacy policy. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 animate-pulse">
        Loading Privacy Policy...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 text-center">
          {policy?.title || "Privacy Policy"}
        </h1>
        <p className="text-gray-700 text-sm sm:text-base mb-6">
          Effective Date: {formatHumanReadableDate(policy?.updated_at ?? '')}
        </p>
        <div
          className="prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: policy?.content ?? "" }}
        />
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
