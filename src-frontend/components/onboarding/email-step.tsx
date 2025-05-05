import { useFormContext } from "react-hook-form";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { GoogleIcon } from "@/components/logo/google-icon";
import { GithubIcon } from "@/components/logo/github-icon";
import { useConnectionStore } from "@/stores";

interface EmailStepProps {
  onNext: (email: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function EmailStep({ onNext, onBack, isLoading }: EmailStepProps) {
  const { control, getValues, trigger, resetField } = useFormContext();
  const {
    settings: { url, token },
  } = useConnectionStore();

  const showCat = () => {
    toast({
      icon: "🐱",
      title: "Feature Coming Soon!",
      description:
        "Hang tight! We're working on this feature. Meanwhile, here's a cat for ya!",
      variant: "default",
    });
  };

  const handleEmailLogin = async () => {
    // Trigger validation for fields in this step
    const isValid = await trigger(["email"]);
    if (!isValid) return;

    // Clear the token field in the form
    resetField("token");

    const response = await fetch(
      `${url}/v1/init/token?email=${getValues("email")}&server_url=${getValues("serverUrl")}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) {
      const data = await response.json();
      toast({
        icon: "❌",
        title: "Error",
        description: `Failed to send verification code. Error: ${data.message}`,
      });
      return;
    }
    onNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission
      handleEmailLogin();
    }
  };

  const handleOAuthLogin = (provider: string) => {
    if (provider === "Google") {
      showCat();
    } else if (provider === "GitHub") {
      showCat();
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Connect to your datasite</CardTitle>
        <CardDescription>
          Choose how you&apos;d like to access your datasite
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() => handleOAuthLogin("Google")}
          disabled={isLoading}
          type="button"
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() => handleOAuthLogin("GitHub")}
          disabled={isLoading}
          type="button"
        >
          <GithubIcon className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">Or</span>
          </div>
        </div>

        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter your email address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 pl-10"
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                We&apos;ll send a verification code to this email.
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
          onClick={handleEmailLogin}
          disabled={isLoading}
        >
          Continue with Email
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
