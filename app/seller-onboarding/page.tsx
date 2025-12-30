"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingLayout from "./components/OnboardingLayout";
import StepShopInfo from "./components/StepShopInfo";
import StepSubscription from "./components/StepSubscription";
import { getMyShop } from "@/lib/api/seller/shop";

const STEPS = [
  { id: 1, label: "Shop Information" },
  { id: 2, label: "Shop Subscription" },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStep = Number(searchParams.get("step")) || 1;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [shopId, setShopId] = useState<number | null>(null);
  const [isLoadingShop, setIsLoadingShop] = useState(false);

  useEffect(() => {
    const fetchShopOnReturn = async () => {
      if (currentStep > 1 && !shopId) {
        setIsLoadingShop(true);
        try {
          const res = await getMyShop();
          if (res?.data?.stripe_connect_id) {
            setShopId(res.data.id);
            router.replace("/dashboard/shop-management");
          }
        } catch (error) {
          console.error("Could not recover shop ID", error);
        } finally {
          setIsLoadingShop(false);
        }
      }
    };

    fetchShopOnReturn();
  }, [currentStep, shopId]);

  const handleNextStep = (data?: any) => {
    if (data?.shopId) {
      setShopId(data.shopId);
    }

    if (currentStep === STEPS.length) {
      router.push("/dashboard");
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const renderStepComponent = () => {
    if (isLoadingShop) {
      return <div className="p-10 text-center">Loading shop details...</div>;
    }

    switch (currentStep) {
      case 1:
        return <StepShopInfo onNext={handleNextStep} />;
      case 2:
        return <StepSubscription onNext={handleNextStep} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout steps={STEPS} currentStep={currentStep}>
      {renderStepComponent()}
    </OnboardingLayout>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
