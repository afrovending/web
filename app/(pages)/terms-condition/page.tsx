// app/terms-and-conditions/page.tsx
"use client";

import React, { Suspense } from "react";
import { COMPANY_CONTACT_INFO } from "@/setting";

const TermsContent: React.FC = () => {
  return (
    <div className=" bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 text-center">
          Terms and Conditions
        </h1>
        <p className="text-gray-700 text-sm sm:text-base mb-6">
          Effective Date: April 1, 2024
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">1. General</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              Eligibility: You must be at least 18 years old to use our
              Services.
            </li>
            <li>
              Account Registration: Some Services require creating an account.
              You are responsible for providing accurate information and keeping
              your credentials secure.
            </li>
            <li>
              Changes to Terms: Ayokah may update these Terms at any time.
              Continued use constitutes acceptance.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">2. Services</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              Products & Services: Ayokah offers groceries, meals, household
              items, event catering, and service bookings. Availability and
              pricing may change without notice.
            </li>
            <li>
              Service Bookings: Bookings are subject to availability and
              confirmation via email or account dashboard.
            </li>
            <li>
              Shipping: Ayokah uses EasyPost to manage shipping, generate
              labels, and track deliveries. Customers are responsible for
              accurate addresses.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">3. Payments</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              Payments are securely processed via Stripe or other authorized
              gateways.
            </li>
            <li>
              Payment information is encrypted and not stored on our servers.
            </li>
            <li>Refunds and cancellations are subject to our Refund Policy.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            4. Privacy and Data Protection
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              We collect only necessary information for Services, including
              name, email, phone, billing/shipping address, and service usage.
            </li>
            <li>Google OAuth is used only for account creation and login.</li>
            <li>
              Your data is used solely for order fulfillment, communication, and
              improving customer experience.
            </li>
            <li>
              We implement encryption, access controls, and monitoring to
              protect your data.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            5. User Obligations
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>You agree to provide accurate and complete information.</li>
            <li>
              Prohibited Conduct includes fraudulent transactions, unauthorized
              access, disruptive activity, or illegal content.
            </li>
            <li>You are responsible for all activity on your account.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            6. Intellectual Property
          </h2>
          <p className="text-gray-700">
            All content, branding, logos, designs, and materials are owned by
            Afrovending Online Marketplace. You may access content only for
            personal, non-commercial purposes.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            7. Disclaimers & Limitations
          </h2>
          <p className="text-gray-700">
            Services are provided “as is.” Ayokah is not liable for delays,
            damages, or losses from shipping or third-party errors. Liability is
            limited to the amount paid for the Services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            8. Third-Party Services
          </h2>
          <p className="text-gray-700">
            Stripe, EasyPost, and Google OAuth are third-party services.
            Compliance with their terms is your responsibility.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            9. Dispute Resolution
          </h2>
          <p className="text-gray-700">
            These Terms are governed by UK law. Disputes will be resolved
            through negotiation, then mediation or arbitration if necessary.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            10. Contact Us
          </h2>
          <p className="text-gray-700">
            Email: {COMPANY_CONTACT_INFO.email} <br />
            Phone: {COMPANY_CONTACT_INFO.phone} <br />
            Address: {COMPANY_CONTACT_INFO.address}
          </p>
        </section>

        <p className="text-gray-600 mt-8 text-center text-sm">
          By using our Services, you acknowledge that you have read, understood,
          and agreed to these Terms and Conditions.
        </p>
      </div>
    </div>
  );
};

const TermsPage: React.FC = () => (
  <Suspense
    fallback={
      <div className="p-8 text-center text-lg text-gray-600">
        Loading Terms and Conditions...
      </div>
    }
  >
    <TermsContent />
  </Suspense>
);

export default TermsPage;
