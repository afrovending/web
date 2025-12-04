"use client";

import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "What products can I find at Afrovending FoodsSUPERMARKET?",
    answer:
      "You can find fresh groceries, beverages, home essentials, organic produce, and FMCG products. We ensure quality, verified, and fresh items from trusted local suppliers.",
  },
  {
    question: "How do I place an order for Afrovending Foodsdelivery?",
    answer:
      "Orders can be placed through our Afrovending platform. Simply select your items, add to cart, and complete checkout. Delivery is available within major towns.",
  },
  {
    question: "What services does Afrovending EVENTS & CATERING offer?",
    answer:
      "We provide premium catering for weddings, birthdays, corporate events, private dining, and large outdoor celebrations. Menus can be customized to suit your event needs.",
  },
  {
    question: "Can I hire Afrovending SERVICES for home tasks?",
    answer:
      "Yes, Afrovending Services offers home cleaning, laundry, private chef, and other lifestyle support solutions. All service professionals are trained and verified for reliability.",
  },
  {
    question: "How do I contact Afrovending for support?",
    answer:
      "You can contact us via our email, phone, or contact form on the Afrovending website. Our team is ready to assist you with any questions or concerns.",
  },
  {
    question: "Does Afrovending offer bulk orders or corporate packages?",
    answer:
      "Yes, both our supermarket and catering services can handle bulk orders and corporate packages. Please contact us directly to discuss your specific requirements.",
  },
];

const FAQPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="bg-gray-50 p-6 sm:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h1>

        <div className="space-y-4">
          {FAQ_DATA.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                onClick={() => handleToggle(index)}
              >
                <span className="text-lg font-medium text-gray-900">
                  {item.question}
                </span>
                {activeIndex === index ? (
                  <FaChevronUp className="w-5 h-5 text-red-600" />
                ) : (
                  <FaChevronDown className="w-5 h-5 text-red-600" />
                )}
              </button>
              <div
                className={`transition-max-height duration-300 ease-in-out overflow-hidden ${
                  activeIndex === index ? "max-h-96 p-6" : "max-h-0 p-0"
                }`}
              >
                <p className="text-gray-700">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
