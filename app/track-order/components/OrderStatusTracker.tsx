import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { clsx } from "clsx";

export type ShippingStatus = "processing" | "ongoing" | "delivered";

export interface Order {
  id: number;
  shipping_status: ShippingStatus;
  updated_at: string;
}

interface OrderStatusTrackerProps {
  order: Order;
}

const statusSteps: { id: ShippingStatus; label: string }[] = [
  { id: "processing", label: "Processing" },
  { id: "ongoing", label: "In Transit" },
  { id: "delivered", label: "Delivered" },
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
}) => {
  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.id === order.shipping_status
  );

  return (
    <div aria-label="Order status tracker">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Order #{order.id}
        </h3>
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
          {order.shipping_status}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Last updated: {new Date(order.updated_at).toLocaleString()}
      </p>

      {/* The Status Bar */}
      <div className="flex items-center">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isLastStep = index === statusSteps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    {
                      "bg-green-800 text-white": isCompleted,
                      "bg-gray-200 text-gray-400": !isCompleted,
                    }
                  )}
                  aria-current={
                    index === currentStatusIndex ? "step" : undefined
                  }
                >
                  <FaCheckCircle className="text-lg" />
                </div>
                <p
                  className={clsx("mt-2 text-xs text-center font-medium", {
                    "text-gray-800": isCompleted,
                    "text-gray-400": !isCompleted,
                  })}
                >
                  {step.label}
                </p>
              </div>

              {!isLastStep && (
                <div
                  className={clsx("flex-1 h-1 transition-colors", {
                    "bg-green-800": isCompleted,
                    "bg-gray-200": !isCompleted,
                  })}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
