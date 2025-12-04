import React, { Suspense } from "react";
import {
  FaBuilding,
  FaShoppingCart,
  FaCalendarAlt,
  FaTint,
  FaUtensils,
  FaBullseye,
  FaPaperPlane,
  FaHandshake,
  FaShieldAlt,
  FaLightbulb,
  FaLeaf,
} from "react-icons/fa";

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

interface CoreValue {
  icon: IconComponent;
  title: string;
  description: string;
}

interface Business {
  name: string;
  icon: IconComponent;
  description: string;
  features?: string[];
}

interface CompanyData {
  name: string;
  tagline: string;
  about: string;
  mission: string;
  vision: string;
  coreValues: CoreValue[];
  businesses: Business[];
  strategicEdge: string[];
}
const COMPANY_DATA: CompanyData = {
  name: "Afrovending Online Marketplace",
  tagline: "Your Everyday Convenience Partner.",
  about:
    "Afrovending Online Marketplace is a fast-growing consumer-focused brand providing essential food products, beverages, groceries, and lifestyle services across United Kingdom. Built on quality, affordability, and convenience, we make everyday living easier for families, individuals, and businesses. From doorstep delivery to premium catering services, Afrovending is redefining modern food accessibility with trust and excellence.",
  mission:
    "To deliver high-quality food products and services with unmatched convenience, ensuring every household has access to safe, affordable, and reliable essentials.",
  vision:
    "To become United Kingdom most trusted food and lifestyle service provider through innovation, sustainability, and exceptional customer experience.",
  coreValues: [
    {
      icon: FaHandshake,
      title: "Customer First",
      description:
        "Every decision, service, and product revolves around our customers.",
    },
    {
      icon: FaShieldAlt,
      title: "Integrity",
      description:
        "We uphold transparency, honesty, and strong ethical standards in all operations.",
    },
    {
      icon: FaLightbulb,
      title: "Innovation",
      description:
        "Using technology and creative solutions to simplify how people access food and services.",
    },
    // {
    //   icon: FaLeaf,
    //   title: "Sustainability",
    //   description:
    //     "Promoting eco-friendly practices and supporting community well-being.",
    // },
    // {
    //   icon: FaBullseye,
    //   title: "Quality",
    //   description:
    //     "Premium products, hygienic handling, and exceptional customer service.",
    // },
  ],
  businesses: [
    {
      name: "Afrovending FoodsSUPERMARKET",
      icon: FaShoppingCart,
      description:
        "A modern and affordable supermarket providing groceries, beverages, home essentials, organic produce, and FMCG products. Our supermarket supports local suppliers and guarantees fresh, verified, and quality-assured items.",
      features: [
        "Fresh produce and affordable essentials",
        "Fast delivery within major towns",
        "Secure payment and customer-friendly shopping experience",
      ],
    },
    {
      name: "Afrovending EVENTS & CATERING",
      icon: FaCalendarAlt,
      description:
        "Premium catering services for weddings, birthdays, corporate events, house parties, private dining, and large outdoor celebrations. We combine African and continental cuisines to create memorable experiences.",
      features: [
        "Professional chefs and trained serving team",
        "Customized menus for all events",
        "On-site and off-site catering options",
      ],
    },
    {
      name: "Afrovending SERVICES",
      icon: FaUtensils,
      description:
        "Afrovending Services offers lifestyle support solutions including home cleaning, laundry, private chef, and event support. Our professional team ensures convenience, reliability, and quality service for homes and businesses alike.",
      features: [
        "Trained and verified service professionals",
        "Flexible packages for homes and events",
        "Fast response and customer-friendly pricing",
      ],
    },
  ],
  strategicEdge: [
    "Tech-Driven: Streamlined ordering and delivery powered by modern logistics systems.",
    "Quality Assurance: Verified suppliers and strict hygiene standards across all operations.",
    "Community Focus: Supporting local farmers, vendors, and small businesses.",
    "Multisector Strength: Food supply, catering, water production, and lifestyle services all under one brand.",
    "Fast Delivery: Efficient customer-centric processes that ensure reliability and trust.",
  ],
};

// Type the component props explicitly
const BusinessCard: React.FC<{ business: Business }> = ({ business }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border border-gray-100">
    <business.icon className="w-10 h-10 text-red-600 mb-4 bg-red-50 p-2 rounded-lg" />
    <h3 className="text-xl font-bold text-gray-900 mb-3">{business.name}</h3>
    <p className="text-gray-600 mb-4 text-sm">{business.description}</p>

    {business.features && (
      <ul className="space-y-2 text-sm text-gray-700">
        {/* Type the array map parameters */}
        {business.features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-4 h-4 text-[#1B412C] mr-2 mt-1 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    )}
  </div>
);

// Type the component props explicitly
const ValueCard: React.FC<{ value: CoreValue }> = ({ value }) => (
  <div className="flex flex-col items-center text-center p-6 bg-red-50 rounded-lg shadow-inner">
    <value.icon className="w-8 h-8 text-red-700 mb-3" />
    <h4 className="font-semibold text-lg text-gray-900 mb-1">{value.title}</h4>
    <p className="text-sm text-gray-600">{value.description}</p>
  </div>
);

const AboutPageContent: React.FC = () => {
  return (
    <div className=" bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center py-16 bg-white rounded-xl shadow-lg mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            About <span className="text-red-600">{COMPANY_DATA.name}</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-6">
            {COMPANY_DATA.tagline}
          </p>
          <div className="max-w-4xl mx-auto p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
            <p className="text-md text-gray-800 italic">
              &quot;Afrovending Online Marketplace is a modern, people-focused
              food and service marketplace created to make everyday living
              simpler, faster, and more convenient.&quot;
            </p>
          </div>
        </header>

        {/* Core Narrative */}
        <section className="py-12 px-6 bg-white rounded-xl shadow-lg mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-red-100 pb-2">
            Our Story
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {COMPANY_DATA.about}
          </p>
        </section>

        {/* Vision and Mission */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Vision Card */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#1B412C]">
            <div className="flex items-center text-red-600 mb-4">
              <FaBullseye className="w-6 h-6 mr-3" />
              <h3 className="text-2xl font-bold">OUR VISION</h3>
            </div>
            <p className="text-gray-700">{COMPANY_DATA.vision}</p>
          </div>

          {/* Mission Card */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#1B412C]">
            <div className="flex items-center text-red-600 mb-4">
              <FaPaperPlane className="w-6 h-6 mr-3" />
              <h3 className="text-2xl font-bold">OUR MISSION</h3>
            </div>
            <p className="text-gray-700">{COMPANY_DATA.mission}</p>
          </div>
        </section>

        {/* Our Businesses / Industry Sectors */}
        <section className="py-12">
          <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-10">
            Our Businesses
          </h2>
          <p className="text-center text-lg text-gray-600 max-w-3xl mx-auto mb-12">
            Your all in one easy-to-use platform
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {COMPANY_DATA.businesses.map((business, index) => (
              <BusinessCard key={index} business={business} />
            ))}
          </div>
        </section>

        {/* Core Values and Strategic Edge */}
        <section className="py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Core Values Block */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
                Our Core Values
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {COMPANY_DATA.coreValues.map((value, index) => (
                  <ValueCard key={index} value={value} />
                ))}
              </div>
            </div>

            {/* Strategic Edge Block */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
                Our Strategic Edge
              </h2>
              <ul className="space-y-4 text-gray-700">
                {COMPANY_DATA.strategicEdge.map((edge, index) => (
                  <li key={index} className="flex items-start">
                    <FaShieldAlt className="w-5 h-5 text-[#1B412C] mr-3 mt-1 shrink-0" />
                    <span className="text-sm sm:text-base">{edge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
const AboutPage = () => (
  <Suspense
    fallback={
      <div className="p-8 text-center text-lg text-gray-600">
        Loading company profile...
      </div>
    }
  >
    <AboutPageContent />
  </Suspense>
);

export default AboutPage;
