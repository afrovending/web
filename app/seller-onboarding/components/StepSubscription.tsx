"use client";

import { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { listSubscriptions } from "@/lib/api/seller/subscription";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import { subscriptionCheckout } from "@/lib/api/seller/shop";
import { FiExternalLink } from "react-icons/fi";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_price: number;
  features: string[];
  stripe_plan_id: string;
  stripe_price_id: string;
  payment_link_url: string;
}

type StepProps = { onNext?: (data?: any) => void };

export default function StepSubscription({ onNext }: StepProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const subscriptionPlans = await listSubscriptions();
        setPlans(subscriptionPlans);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching plans.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Add router hooks
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Check for Cancelation on Mount
  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast.error(
        "Payment was canceled. You can try again when you are ready.",
        {
          duration: 5000,
          position: "top-center",
        }
      );

      // Optional: Clean the URL so a refresh doesn't show the error again
      router.replace("/seller-onboarding");
    }
  }, [searchParams, router]);

  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    setIsRedirecting(true);
    try {
      const res = await subscriptionCheckout(priceId);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      toast.error("Failed to initialize checkout.");
      setIsRedirecting(false);
    }
  };

  const getPlanStyles = (name: string) => {
    const lowerName = name.toLowerCase();

    // Highlight Standard as the "Popular" choice
    if (lowerName.includes("standard")) {
      return {
        container:
          "border-green-600 shadow-green-200 scale-105 z-10 ring-1 ring-green-600", // Added scale to make it pop
        title: "text-green-700",
        button: "text-white bg-green-700 hover:bg-green-800",
      };
    }

    // Darker style for Premium
    if (lowerName.includes("premium")) {
      return {
        container: "border-gray-300 hover:border-gray-400",
        title: "text-gray-900",
        button: "text-white bg-black hover:bg-gray-800",
      };
    }

    // Default for Basic
    return {
      container: "border-gray-300 hover:border-gray-400",
      title: "text-gray-900",
      button: "text-gray-700 bg-gray-100 hover:bg-gray-200",
    };
  };

  const renderLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton height={400} borderRadius={12} count={3} className="h-full" />
    </div>
  );

  const renderError = () => (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      <p className="font-medium">Error loading subscriptions</p>
      <p className="text-sm">{error}</p>
    </div>
  );

  return (
    <>
      <div className="border border-green-100 p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FaMoneyBill1Wave className="text-green-800 text-xl mr-2" size={24} />
          Business Subscription
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          Select the plan that best fits your business needs. You will be
          redirected to a secure Stripe payment gateway.
        </p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-4">
            {plans.map((plan) => {
              const styles = getPlanStyles(plan.name);

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col p-6 rounded-xl border-2 shadow-lg transition-all duration-300 ${styles.container}`}
                >
                  {/* Plan Header */}
                  <div className="text-center pb-4 border-b border-gray-100">
                    <h3 className={`text-2xl font-extrabold ${styles.title}`}>
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-gray-500 text-sm">
                      Best for{" "}
                      {plan.name.toLowerCase().includes("premium")
                        ? "growing"
                        : "new"}{" "}
                      businesses
                    </p>

                    <p className="mt-4">
                      <span className="text-5xl font-extrabold text-gray-900">
                        £{plan.monthly_price}
                      </span>
                      <span className="text-lg font-medium text-gray-500">
                        /mo
                      </span>
                    </p>
                  </div>

                  {/* Feature List */}
                  <ul role="list" className="mt-6 space-y-3 grow">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2 shrink-0" />
                        <span className="text-base text-gray-600">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.stripe_price_id)}
                    disabled={isRedirecting}
                    className={`mt-8 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm transition duration-150 ease-in-out cursor-pointer ${styles.button}`}
                  >
                    {isRedirecting
                      ? "Loading Stripe..."
                      : `Choose ${plan.name}`}{" "}
                    <FiExternalLink className="ml-1 h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
