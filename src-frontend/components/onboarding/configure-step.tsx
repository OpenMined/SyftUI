import { ArrowLeft, ArrowRight, Folder, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormContext } from "react-hook-form";

interface ConfigureStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ConfigureStep({ onNext, onBack }: ConfigureStepProps) {
  const { control, getValues, setValue, trigger } = useFormContext();
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleDirectorySelect = async () => {
    if (typeof window === "undefined" || !window.__TAURI__) return;

    const { open } = window.__TAURI__.dialog;
    const filepath = await open({
      defaultPath: getValues("dataDir"),
      multiple: false,
      directory: true,
    });
    if (filepath) setValue("dataDir", filepath);
  };

  const handleConfigureClient = async () => {
    const isValid = await trigger(["dataDir", "serverUrl"]);
    if (isValid) {
      setIsConfiguring(true);
      try {
        // Simulate some configuration time or add actual configuration logic here
        await new Promise((resolve) => setTimeout(resolve, 500));
        onNext();
      } finally {
        setIsConfiguring(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission
      handleConfigureClient();
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to SyftBox</CardTitle>
        <CardDescription>
          Let&apos;s get you set up in just a few steps
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="dataDir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Where do you want SyftBox to store data?</FormLabel>
              <div className="flex space-x-2">
                <FormControl>
                  <Input
                    placeholder="~/SyftBox"
                    onKeyDown={handleKeyDown}
                    {...field}
                  />
                </FormControl>
                {typeof window !== "undefined" && window.__TAURI__ && (
                  <Button
                    variant="outline"
                    onClick={handleDirectorySelect}
                    type="button"
                    disabled={isConfiguring}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Browse
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="serverUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter the SyftBox Server URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://syftbox.openmined.org"
                  disabled={true}
                  onKeyDown={handleKeyDown}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={onBack}
          disabled={isConfiguring}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          className="cursor-pointer"
          onClick={handleConfigureClient}
          disabled={isConfiguring}
        >
          {isConfiguring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Configuring...
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
