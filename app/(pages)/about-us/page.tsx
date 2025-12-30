import React, { Suspense } from "react";
import { FaHandshake, FaShieldAlt } from "react-icons/fa";

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

interface CoreValue {
  icon: IconComponent;
  title: string;
  description: string;
}

interface CompanyData {
  name: string;
  about: string;
  marketplace: string;
  coreValues: CoreValue[];
}
const COMPANY_DATA: CompanyData = {
  name: "Afrovending Online Marketplace",
  about:
    "At Afrovending Online Marketplace, we are more than just a marketplace; we are a bridge connecting African culture, entrepreneurship, and community to the heart of Canada. Our platform brings together African vendors, service providers, and consumers, creating a vibrant digital space where authentic African products, services, and cultural goods are celebrated and made easily accessible. Whether you’re looking to reconnect with the flavors, styles, and traditions of Africa or discover new offerings from passionate African entrepreneurs, Afrovending Online Marketplace makes it simple, seamless, and enjoyable.",
  marketplace:
    "Our marketplace is designed with ease, vibrancy, and connection at its core; helping users not only shop but also engage with a thriving community of African businesses. At Afrovending Online Marketplace, we believe in fostering economic growth, cultural pride, and shared experiences, one purchase at a time",

  coreValues: [
    {
      icon: FaHandshake,
      title: "Empowement",
      description:
        "Empowering African entrepreneurs by giving them a platform to showcase their creativity, grow their businesses, and reach wider audiences.",
    },
    {
      icon: FaShieldAlt,
      title: "Diaspora",
      description:
        " Serving the African diaspora by providing access to goods and services that reflect their heritage and identity.",
    },
    {
      icon: FaShieldAlt,
      title: "Cultural",
      description:
        "Promoting cultural exchange by making authentic African experiences available to both Africans in Canada and cultural enthusiasts who appreciate Africa's diversity and richness",
    },
  ],
};

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

        <section className="py-12">
          <div className="grid gap-12">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
                Our Commitments
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {COMPANY_DATA.coreValues.map((value, index) => (
                  <ValueCard key={index} value={value} />
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 px-6 bg-white rounded-xl shadow-lg mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-red-100 pb-2">
            Our Marketplace
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {COMPANY_DATA.marketplace}
          </p>
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
