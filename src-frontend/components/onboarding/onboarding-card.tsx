import { useEffect, useState } from "react";
import { ConnectStep } from "./connect-step";
import { ConfigureStep } from "./configure-step";
import { EmailStep } from "./email-step";
import { VerifyStep } from "./verify-step";
import { useConnectionStore } from "@/stores";
import useHashParams from "@/hooks/use-hash-params";

type Step = "initialize" | "connect" | "configure" | "email" | "verify";

interface OnboardingCardProps {
  onComplete: () => void;
}

export function OnboardingCard({ onComplete }: OnboardingCardProps) {
  const [step, setStep] = useState<Step>("initialize");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const { updateSettings, connect } = useConnectionStore();
  const { host, port, token } = useHashParams();

  useEffect(() => {
    const attemptConnection = async () => {
      if (!(host && port && token)) return;
      updateSettings({ url: `http://${host}:${port}`, token });
      // Attempt connection
      const result = await connect();
      if (result.success) {
        setStep("configure");
      } else {
        setStep("connect");
      }
    };
    attemptConnection();
  }, [host, port, token, updateSettings, connect]);

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

  if (step === "initialize") return null;

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
