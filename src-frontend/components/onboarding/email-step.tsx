import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Chrome, Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
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

// Email form schema
const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Email form type
type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailStepProps {
  onNext: (email: string) => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onComplete: () => void;
}

export function EmailStep({
  onNext,
  onBack,
  isLoading,
  setIsLoading,
  onComplete,
}: EmailStepProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isGithubLoading, setIsGithubLoading] = useState<boolean>(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "user@example.com",
    },
  });

  const handleSendVerification = (values: EmailFormValues) => {
    setIsLoading(true);

    // Simulate sending verification email
    setTimeout(() => {
      setIsLoading(false);
      onNext(values.email);
    }, 750);
  };

  const handleOAuthLogin = (provider: string) => {
    if (provider === "Google") {
      setIsGoogleLoading(true);

      // Simulate OAuth login
      setTimeout(() => {
        setIsGoogleLoading(false);
        onComplete();
      }, 750);
    } else if (provider === "GitHub") {
      setIsGithubLoading(true);

      // Simulate OAuth login
      setTimeout(() => {
        setIsGithubLoading(false);
        onComplete();
      }, 750);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Connect to your datasite</CardTitle>
        <CardDescription>Log in to access your datasite</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSendVerification)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter your email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Send Verification Token
                </>
              ) : (
                "Send Verification Token"
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => handleOAuthLogin("Google")}
                disabled={isGoogleLoading || isLoading}
                type="button"
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-4 w-4" />
                )}
                Google
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => handleOAuthLogin("GitHub")}
                disabled={isGithubLoading || isLoading}
                type="button"
              >
                {isGithubLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                GitHub
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={onBack}
          disabled={isLoading || isGoogleLoading || isGithubLoading}
        >
          Back
        </Button>
      </CardFooter>
    </Card>
  );
}
