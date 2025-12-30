import { FaCheckCircle, FaDotCircle, FaRegCircle } from "react-icons/fa";

type StepProps = {
  steps: { id: number; label: string }[];
  activeStep: number;
  setActiveStep: (step: number) => void;
};

export default function StepIndicator({
  steps,
  activeStep,
  setActiveStep,
}: StepProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step) => {
        const completed = step.id < activeStep;
        const isActive = step.id === activeStep;

        return (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className="flex flex-col items-center text-sm"
          >
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all
              ${
                completed
                  ? "bg-green-500 text-white border-green-500"
                  : isActive
                  ? "border-green-800 text-green-800"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {completed ? (
                <FaCheckCircle size={22} />
              ) : isActive ? (
                <FaDotCircle size={22} />
              ) : (
                <FaRegCircle size={22} />
              )}
            </div>

            <span
              className={`mt-2 ${
                isActive ? "font-bold text-green-800" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
