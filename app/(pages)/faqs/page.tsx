"use client";

import { getFaq } from "@/lib/api/contact";
import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface FAQItem {
  id?: number;
  question: string;
  answer: string;
  status: string;
  type: string;
}

const FAQPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const data = await getFaq("system");
        const activeFaqs = data.filter(
          (item: FAQItem) => item.status === "active"
        );
        setFaqs(activeFaqs);
      } catch (err) {
        setError("Failed to load FAQs. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const handleToggle = (index: number) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="animate-pulse text-lg text-gray-500">
          Loading FAQs...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 sm:p-12 font-sans min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h1>

        {faqs.length === 0 ? (
          <p className="text-center text-gray-500">
            No FAQs available at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {faqs.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none hover:bg-gray-50 transition-colors"
                  onClick={() => handleToggle(index)}
                >
                  <span className="text-lg font-medium text-gray-900">
                    {item.question}
                  </span>
                  {activeIndex === index ? (
                    <FaChevronUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <FaChevronDown className="w-5 h-5 text-green-600" />
                  )}
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    activeIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-6 pt-0">
                    <p className="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQPage;
