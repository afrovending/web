"use client";

import Image from "next/image";
import StepIndicator from "./StepIndicator";

type StepDefinition = {
  id: number;
  label: string;
};

interface LayoutProps {
  children: React.ReactNode;
  currentStep: number;
  steps: StepDefinition[];
}

export default function OnboardingLayout({
  children,
  currentStep,
  steps,
}: LayoutProps) {
  return (
    <div className="bg-red-50">
      <div className="w-full mb-2">
        <Image
          src="/store-bg.jpg"
          alt="Afrovending Banner"
          width={1920}
          height={160}
          className="w-full h-40 object-cover"
          priority
        />
      </div>
      <div className="container mx-auto py-2 max-w-6xl p-2">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Seller Onboarding
        </h1>

        <StepIndicator
          steps={steps}
          activeStep={currentStep}
          setActiveStep={() => {}}
        />

        <div className="mt-10 bg-white p-6 rounded-xl shadow-sm border">
          {children}
        </div>
      </div>
    </div>
  );
}
