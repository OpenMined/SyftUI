import { useEffect, useState } from "react";
import { ConnectStep } from "./connect-step";
import { ConfigureStep } from "./configure-step";
import { EmailStep } from "./email-step";
import { VerifyStep } from "./verify-step";
import { useConnectionStore } from "@/stores";
import useHashParams from "@/hooks/use-hash-params";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Step = "initialize" | "connect" | "configure" | "email" | "verify";

interface OnboardingCardProps {
  onComplete: (didOnboard: boolean) => void;
}

// Config form schema
const configFormSchema = z.object({
  dataDir: z.string().min(1, "Data directory is required"),
  serverUrl: z.string().url("Must be a valid URL"),
  email: z.string().email("Please enter a valid email address"),
  token: z.string().min(1, "Token is required"),
});

// Config form type
type ConfigFormValues = z.infer<typeof configFormSchema>;

export function OnboardingCard({ onComplete }: OnboardingCardProps) {
  const [step, setStep] = useState<Step>("initialize");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { datasite, updateSettings, connect } = useConnectionStore();
  const { host, port, token } = useHashParams();

  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      dataDir: "~/SyftBox",
      serverUrl: "https://syftbox.net",
      email: "",
      token: "",
    },
  });

  useEffect(() => {
    const attemptConnection = async () => {
      if (!(host && port && token)) {
        setStep("connect");
        return;
      }
      updateSettings({ url: `http://${host}:${port}`, token });

      // Attempt connection
      const isDesktopBuild = window?.__TAURI__ !== undefined;
      let result;

      if (isDesktopBuild) {
        // Desktop app should automatically pass the right connection details, but the daemon might not be running yet
        // So we keep trying to connect until timeout
        const TIMEOUT = 10000;
        const startTime = Date.now();
        while (Date.now() - startTime < TIMEOUT) {
          result = await connect();
          if (result.success && datasite?.status !== undefined) {
            break;
          }
          // Wait for 500ms before trying again
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        result = await connect();
      }

      if (!result.success) {
        setStep("connect");
        return;
      }

      if (["UNPROVISIONED", "ERROR"].includes(datasite?.status)) {
        setStep("configure");
      } else if (["PROVISIONING", "PROVISIONED"].includes(datasite?.status)) {
        onComplete();
      }
    };
    attemptConnection();
  }, [
    connect,
    datasite?.status,
    host,
    onComplete,
    port,
    token,
    updateSettings,
  ]);

  const handleNext = () => {
    const nextStep =
      step === "connect"
        ? "configure"
        : step === "configure"
          ? "email"
          : "verify";
    setStep(nextStep);
  };

  const handleBack = () => {
    const prevStep =
      step === "verify" ? "email" : step === "email" ? "configure" : "connect";
    setStep(prevStep);
  };

  if (step === "initialize") return null;

  return (
    <>
      {step === "connect" && (
        <ConnectStep
          onComplete={() => onComplete(false)}
          onNext={handleNext}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      <FormProvider {...configForm}>
        <form onSubmit={(e) => e.preventDefault()}>
          {step === "configure" && (
            <ConfigureStep onNext={handleNext} onBack={handleBack} />
          )}

          {step === "email" && (
            <EmailStep
              onNext={handleNext}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}

          {step === "verify" && (
            <VerifyStep
              onComplete={() => onComplete(true)}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
        </form>
      </FormProvider>
    </>
  );
}
