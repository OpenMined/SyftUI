import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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

// Verification form schema
const verificationFormSchema = z.object({
  token: z.string().min(6, "Verification token must be at least 6 characters"),
});

// Verification form type
type VerificationFormValues = z.infer<typeof verificationFormSchema>;

interface VerifyStepProps {
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  email: string;
}

export function VerifyStep({
  onComplete,
  onBack,
  isLoading,
  setIsLoading,
  email,
}: VerifyStepProps) {
  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRhdXF1aXJAb3Blbm1pbmVkLm9yZyIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJpYXQiOjE3MzY5NDQxNjd9.YqRMwd9StsRUA_sAQuz1zSwkHtAV_RWdhCltCHW1E5x",
    },
  });

  const handleCompleteSetup = () => {
    setIsLoading(true);

    // Simulate token verification
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 750);
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription>
          Enter the verification token sent to your email
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCompleteSetup)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please enter the token sent to {email}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter verification token"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-sm">
                    Also check your spam folder if you don&apos;t see the email.
                  </p>
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
                  Verifying...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
      </CardFooter>
    </Card>
  );
}
