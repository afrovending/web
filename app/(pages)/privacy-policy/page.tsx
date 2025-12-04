"use client";

import React, { Suspense } from "react";
import { COMPANY_CONTACT_INFO } from "@/setting";

const PrivacyPolicyContent: React.FC = () => {
  return (
    <div className=" bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 text-center">
          Privacy Policy
        </h1>
        <p className="text-gray-700 text-sm sm:text-base mb-6">
          Effective Date: April 1, 2024
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            1. Introduction
          </h2>
          <p className="text-gray-700">
            Afrovending Online Marketplace values your privacy and is committed
            to protecting your personal information. This Privacy Policy
            explains how we collect, use, and safeguard your data when you use
            our website, services, and platform integrations, including Stripe,
            Google OAuth, and EasyPost.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            2. Information We Collect
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              Personal identifiers: Name, email address, phone number, and
              billing/shipping address.
            </li>
            <li>
              Account data: Login credentials, OAuth information (Google
              Sign-In), and preferences.
            </li>
            <li>
              Transaction data: Payment information via Stripe (credit/debit
              card tokens, payment confirmations).
            </li>
            <li>
              Shipping data: Delivery address, tracking numbers, and EasyPost
              shipment details.
            </li>
            <li>
              Usage data: IP address, device type, browser info, and browsing
              patterns on our platform.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>To process transactions and payments securely via Stripe.</li>
            <li>
              To manage orders, shipments, and service bookings using EasyPost.
            </li>
            <li>
              To allow Google OAuth login and simplify account creation
              securely.
            </li>
            <li>
              To provide customer support, updates, and notifications about
              services.
            </li>
            <li>
              To improve our website, products, and user experience through
              analytics.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            4. Data Sharing & Third Parties
          </h2>
          <p className="text-gray-700">
            We may share your information with trusted third parties strictly
            for service delivery:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Stripe for payment processing and financial compliance.</li>
            <li>Google for OAuth login authentication.</li>
            <li>
              EasyPost for shipping, label generation, and tracking delivery.
            </li>
            <li>Our service partners to fulfill orders and bookings.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            5. Cookies & Tracking
          </h2>
          <p className="text-gray-700">
            Our website uses cookies and tracking technologies to improve user
            experience, analytics, and marketing:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              Necessary cookies: Required for account login, session management,
              and payment security.
            </li>
            <li>
              Performance cookies: Collect anonymous data to analyze site usage
              and improve performance.
            </li>
            <li>
              Marketing cookies: Used to personalize offers and communications
              with user consent.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            6. Your Rights (GDPR & UK)
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Access your personal data and obtain a copy.</li>
            <li>Request corrections to inaccurate or incomplete data.</li>
            <li>Request deletion of your personal data where permitted.</li>
            <li>Restrict or object to certain data processing activities.</li>
            <li>
              Withdraw consent for specific processing activities at any time.
            </li>
            <li>
              Data portability: Request your personal data in a portable format.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            7. Data Security
          </h2>
          <p className="text-gray-700">
            Afrovending implements industry-standard security measures including
            encryption, secure authentication, access control, monitoring, and
            audits to safeguard personal information.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            8. Retention
          </h2>
          <p className="text-gray-700">
            We retain your personal data only as long as necessary for the
            services you use, compliance with legal obligations, or legitimate
            business purposes.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            9. Contact Us
          </h2>
          <p className="text-gray-700">
            If you have questions about this Privacy Policy or wish to exercise
            your rights, please contact us:
            <br /> Email: {COMPANY_CONTACT_INFO.email}
            <br /> Phone: {COMPANY_CONTACT_INFO.phone}
            <br /> Address: {COMPANY_CONTACT_INFO.address}
          </p>
        </section>

        <p className="text-gray-600 mt-8 text-center text-sm">
          By using our Services, you consent to this Privacy Policy.
        </p>
      </div>
    </div>
  );
};

const PrivacyPolicyPage: React.FC = () => (
  <Suspense
    fallback={
      <div className="p-8 text-center text-lg text-gray-600">
        Loading Privacy Policy...
      </div>
    }
  >
    <PrivacyPolicyContent />
  </Suspense>
);

export default PrivacyPolicyPage;
