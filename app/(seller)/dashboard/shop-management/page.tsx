"use client";

import StepShopInfo from "@/app/seller-onboarding/components/StepShopInfo";
import { StepProps } from "@/interfaces/StepProps";
 
export default function PreviewShop({ onNext, ...props }: StepProps) {
  return (
    <div className="preview-container"> 
      <StepShopInfo onNext={onNext} {...props} />
    </div>
  );
}
