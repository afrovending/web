"use client";

import contactUs from "@/lib/api/contact";
import { COMPANY_CONTACT_INFO } from "@/setting";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBuilding,
  FaPhoneAlt,
  FaPaperPlane,
  FaWhatsapp,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [puzzle, setPuzzle] = useState<string>("");
  const [expectedAnswer, setExpectedAnswer] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");

  // Generate a random puzzle question
  useEffect(() => {
    const random = Math.random();
    if (random < 0.5) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      setPuzzle(`What is ${a} + ${b}?`);
      setExpectedAnswer((a + b).toString());
    } else {
      const words = [
        ["sky", "blue"],
        ["grass", "green"],
        ["snow", "white"],
        ["coal", "black"],
        ["lemon", "yellow"],
        ["cherry", "red"],
        ["ocean", "blue"],
        ["cloud", "white"],
        ["rose", "red"],
        ["sand", "brown"],
        ["night", "black"],
        ["apple", "red"],
        ["banana", "yellow"],
        ["tree", "green"],
        ["milk", "white"],
        ["fire", "orange"],
        ["sun", "yellow"],
        ["grape", "purple"],
        ["mud", "brown"],
        ["chocolate", "brown"],
        ["carrot", "orange"],
        ["peach", "pink"],
        ["frog", "green"],
        ["lavender", "purple"],
        ["ice", "white"],
      ];

      const [item, color] = words[Math.floor(Math.random() * words.length)];
      const questionFormats = [
        `What color is the ${item}?`,
        `The ${item} is usually what color?`,
        `Fill in: The color of ${item} is _____.`,
        `Which color is the ${item}?`,
      ];
      setPuzzle(
        questionFormats[Math.floor(Math.random() * questionFormats.length)]
      );
      setExpectedAnswer(color);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate puzzle before submission
    if (userAnswer.trim().toLowerCase() !== expectedAnswer.toLowerCase()) {
      toast.error("Incorrect puzzle answer. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await contactUs(formData);

      if (response.success) {
        toast.success("Message sent successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
        setUserAnswer("");
      } else {
        toast.error(response.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-8 rounded-xl shadow-2xl border border-gray-100 text-gray-700"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Send Us a Message
      </h3>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Your Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="input"
        />
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="input"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Phone
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="input"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Subject
        </label>
        <input
          type="text"
          name="subject"
          id="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="input"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message
        </label>
        <textarea
          name="message"
          id="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          maxLength={255}
          className="input"
        />
      </div>

      {/* Puzzle validation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Security Question
        </label>
        <p className="text-gray-600 mb-2">{puzzle}</p>
        <input
          type="text"
          name="puzzle"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          required
          disabled={isSubmitting}
          placeholder="Your answer"
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full flex justify-center items-center"
      >
        {isSubmitting ? (
          <div className="flex justify-center items-center gap-2">
            <ClipLoader size={20} color="#fff" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-2">
            <FaPaperPlane className="w-5 h-5" />
            <span>Submit Message</span>
          </div>
        )}
      </button>
    </form>
  );
};

const ContactUsPage: React.FC = () => {
  return (
    <div className=" bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="text-center py-16 bg-white rounded-xl shadow-lg mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Contact{" "}
            <span className="text-green-600">
              {COMPANY_CONTACT_INFO.companyName}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto">
            {COMPANY_CONTACT_INFO.companyDescription}
          </p>
        </header>

        {/* Contact Content Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Info Sidebar (2/3) */}
          <div className="lg:col-span-1 space-y-8 p-6 lg:p-0">
            <div className="bg-green-50 p-6 rounded-xl shadow-md border-l-4 border-green-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-gray-600 mb-6">
                Connect with our team directly via phone or email for specific
                inquiries.
              </p>

              {/* Phone */}
              <div className="flex items-start mb-4">
                <FaWhatsapp className="w-6 h-6 text-green-500 mt-1 shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-900">
                    WhatsApp Us
                  </p>
                  <p className="text-gray-700 hover:text-green-600 transition-colors">
                    <Link href="https://wa.me/2348129022334">
                      Send us a message
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
