"use client";

import { CheckCircle, Loader2, AlertCircle, Globe, Brain, ImageIcon } from "lucide-react";
import type { ProcessingStep } from "@/types";

const steps: { key: ProcessingStep; label: string; icon: React.ElementType }[] = [
  { key: "scraping", label: "Scraping URL", icon: Globe },
  { key: "processing", label: "AI Processing", icon: Brain },
  { key: "compressing", label: "Compressing Images", icon: ImageIcon },
];

export default function StatusIndicator({
  currentStep,
  error,
}: {
  currentStep: ProcessingStep;
  error?: string;
}) {
  if (currentStep === "idle") return null;

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full max-w-xl mx-auto py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = step.icon;
          let status: "done" | "active" | "pending" | "error" = "pending";

          if (currentStep === "done") {
            status = "done";
          } else if (currentStep === "error" && i <= currentIndex) {
            status = i === currentIndex ? "error" : "done";
          } else if (i < currentIndex) {
            status = "done";
          } else if (i === currentIndex) {
            status = "active";
          }

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  status === "done"
                    ? "bg-green-100 text-green-600"
                    : status === "active"
                    ? "bg-brand-100 text-brand-700"
                    : status === "error"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {status === "done" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : status === "active" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : status === "error" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  status === "done"
                    ? "text-green-600"
                    : status === "active"
                    ? "text-brand-700"
                    : status === "error"
                    ? "text-red-600"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Connector lines */}
      <div className="flex items-center justify-between px-[60px] -mt-[52px] mb-8">
        {[0, 1].map((i) => {
          const filled =
            currentStep === "done" ||
            (currentIndex > i + 1) ||
            (currentStep === "error" && currentIndex > i);
          return (
            <div
              key={i}
              className={`flex-1 h-0.5 mx-2 ${
                filled ? "bg-green-300" : "bg-gray-200"
              }`}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-center text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
