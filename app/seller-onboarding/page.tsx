"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingLayout from "./components/OnboardingLayout";
import StepBankInfo from "./components/StepBankInfo";
import StepShopInfo from "./components/StepShopInfo";
import StepSubscription from "./components/StepSubscription";
import { getMyShop } from "@/lib/api/seller/shop";

const STEPS = [
  { id: 1, label: "Shop Info" },
  { id: 3, label: "Bank Info" },
  { id: 4, label: "Shop Sub" },
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
          if (res?.data?.id) {
            setShopId(res.data.id);
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
        return <StepBankInfo onNext={handleNextStep} />;
      case 3:
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
  return <OnboardingContent />;
}

// export default function OnboardingPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex h-screen items-center justify-center">
//           Loading...
//         </div>
//       }
//     >
//       <OnboardingContent />
//     </Suspense>
//   );
// }
