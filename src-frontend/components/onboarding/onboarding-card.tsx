import { useState } from "react";
import { ConnectStep } from "./connect-step";
import { ConfigureStep } from "./configure-step";
import { EmailStep } from "./email-step";
import { VerifyStep } from "./verify-step";

type Step = "connect" | "configure" | "email" | "verify";

interface OnboardingCardProps {
  onComplete: () => void;
}

export function OnboardingCard({ onComplete }: OnboardingCardProps) {
  const [step, setStep] = useState<Step>("connect");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const handleNext = () => {
    setStep(
      step === "connect"
        ? "configure"
        : step === "configure"
          ? "email"
          : "verify",
    );
  };

  const handleBack = () => {
    setStep(
      step === "verify" ? "email" : step === "email" ? "configure" : "connect",
    );
  };

  const handleEmailSubmit = (email: string) => {
    setEmail(email);
    handleNext();
  };

  return (
    <>
      {step === "connect" && (
        <ConnectStep
          onNext={handleNext}
          onBack={step !== "connect" ? handleBack : undefined}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {step === "configure" && (
        <ConfigureStep
          onNext={handleNext}
          onBack={handleBack}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {step === "email" && (
        <EmailStep
          onNext={handleEmailSubmit}
          onBack={handleBack}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onComplete={onComplete}
        />
      )}

      {step === "verify" && (
        <VerifyStep
          onComplete={onComplete}
          onBack={handleBack}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          email={email}
        />
      )}
    </>
  );
}
