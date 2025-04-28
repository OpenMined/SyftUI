import { useFormContext } from "react-hook-form";
import { ArrowLeft, Loader2, LucideCheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
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
import { useConnectionStore } from "@/stores";

interface VerifyStepProps {
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function VerifyStep({ onComplete, onBack, isLoading }: VerifyStepProps) {
  const { control, getValues, trigger } = useFormContext();
  const {
    settings: { url, token },
  } = useConnectionStore();

  const handleCompleteSetup = async () => {
    const isValid = await trigger(["token"]);
    if (!isValid) return;

    const response = await fetch(`${url}/v1/init/datasite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        dataDir: getValues("dataDir"),
        email: getValues("email"),
        serverUrl: getValues("serverUrl"),
        token: getValues("token"),
      }),
    });

    if (!response.ok) {
      toast({
        title: "Error",
        description: "Failed to verify email",
      });
      return;
    }

    onComplete();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCompleteSetup();
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription>
          Enter the verification token sent to your email
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Please enter the token sent to {getValues("email")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter verification token"
                  autoComplete="off"
                  onKeyDown={handleKeyDown}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-muted-foreground text-sm">
                Also check your spam folder if you don&apos;t see the email.
              </FormDescription>
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
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          className="cursor-pointer"
          disabled={isLoading}
          onClick={handleCompleteSetup}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Complete Setup"
          )}
          <LucideCheckCircle className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
