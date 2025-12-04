"use client";

import React from "react";
import { FaTruck, FaMapMarkerAlt, FaShieldAlt, FaClock } from "react-icons/fa";
import { COMPANY_CONTACT_INFO } from "@/setting";

const ShippingPage: React.FC = () => {
  return (
    <div className="bg-gray-50 p-6 sm:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="text-center py-16 bg-white rounded-xl shadow-lg mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Shipping & Delivery
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            At Afrovending Online Marketplace, we take pride in ensuring that
            your orders, whether groceries, food, or services, are delivered
            safely, on time, and transparently. Our shipping and tracking
            system, powered by EasyPost, guarantees accurate and efficient
            delivery to your doorstep.
          </p>
        </header>

        {/* Shipping Features */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col justify-center p-6 bg-white rounded-xl shadow-lg border-l-4 border-red-600">
            <div className="flex items-center mb-4 text-red-600">
              <FaTruck className="w-6 h-6 mr-3" />
              <h2 className="text-2xl font-bold">Reliable Shipping</h2>
            </div>
            <p className="text-gray-700">
              Every product from Afrovending Online Marketplace is carefully
              packed and shipped with trusted carriers through EasyPost. We
              monitor every shipment to ensure it reaches you securely and
              promptly.
            </p>
          </div>

          <div className="flex flex-col justify-center p-6 bg-white rounded-xl shadow-lg border-l-4 border-red-600">
            <div className="flex items-center mb-4 text-red-600">
              <FaMapMarkerAlt className="w-6 h-6 mr-3" />
              <h2 className="text-2xl font-bold">Real-Time Tracking</h2>
            </div>
            <p className="text-gray-700">
              Once your order is shipped, you receive a tracking number. Track
              your shipment live and know exactly where your package is at any
              time. For services bookings, our platform ensures transparent
              tracking from request to fulfillment.
            </p>
          </div>

          <div className="flex flex-col justify-center p-6 bg-white rounded-xl shadow-lg border-l-4 border-red-600">
            <div className="flex items-center mb-4 text-red-600">
              <FaShieldAlt className="w-6 h-6 mr-3" />
              <h2 className="text-2xl font-bold">Safe & Secure Delivery</h2>
            </div>
            <p className="text-gray-700">
              Your safety and satisfaction are our top priorities. All shipments
              are insured, handled with care, and verified at every stage. Our
              EasyPost integration ensures the right package reaches the right
              customer every time.
            </p>
          </div>

          <div className="flex flex-col justify-center p-6 bg-white rounded-xl shadow-lg border-l-4 border-red-600">
            <div className="flex items-center mb-4 text-red-600">
              <FaClock className="w-6 h-6 mr-3" />
              <h2 className="text-2xl font-bold">Efficient & Timely</h2>
            </div>
            <p className="text-gray-700">
              Afrovending Online Marketplace values your time. Our logistics and
              service delivery system is optimized for efficiency, minimizing
              delays, and ensuring that groceries, food orders, or service
              bookings are delivered on schedule.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 px-6 bg-white rounded-xl shadow-lg mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-red-100 pb-2">
            How Our Shipping Works
          </h2>
          <ol className="list-decimal list-inside space-y-4 text-gray-700">
            <li>
              <strong>Order Placement:</strong> Select your products or
              services, add to cart, and complete checkout securely.
            </li>
            <li>
              <strong>Shipment Confirmation:</strong> Once your order is
              confirmed, EasyPost generates a shipment label for the selected
              carrier.
            </li>
            <li>
              <strong>Real-Time Tracking:</strong> Receive your tracking number
              to monitor your delivery in real-time on the Afrovending platform.
            </li>
            <li>
              <strong>Delivery Verification:</strong> Our system confirms
              delivery, ensuring accuracy and customer satisfaction.
            </li>
            <li>
              <strong>Customer Feedback:</strong> Share your experience to help
              us maintain high-quality delivery service.
            </li>
          </ol>
        </section>

        {/* Contact Section */}
        <section className="py-12 px-6 bg-red-50 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Need Assistance?
          </h2>
          <p className="text-gray-700 mb-4">
            If you have questions about your order, shipment, or service
            booking, our customer support team is here to help. Reach out to us
            anytime.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Email:</strong> {COMPANY_CONTACT_INFO.email}
            </li>
            <li>
              <strong>Phone:</strong> {COMPANY_CONTACT_INFO.phone}
            </li>
            <li>
              <strong>Warehouse Address:</strong> {COMPANY_CONTACT_INFO.address}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default ShippingPage;
