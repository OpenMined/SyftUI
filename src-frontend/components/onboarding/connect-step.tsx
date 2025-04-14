import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import {
  ConnectionFormValues,
  DEFAULT_CONNECTION_SETTINGS,
  connectionFormSchema,
  useConnectionStore,
} from "@/stores";

interface ConnectStepProps {
  onNext: () => void;
  onBack?: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function ConnectStep({
  onNext,
  onBack,
  isLoading,
  setIsLoading,
}: ConnectStepProps) {
  const [showToken, setShowToken] = useState(false);
  const { updateSettings, status, connect } = useConnectionStore();

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      url: DEFAULT_CONNECTION_SETTINGS.url,
      token: DEFAULT_CONNECTION_SETTINGS.token,
    },
  });

  const handleConnectClient = (values: ConnectionFormValues) => {
    setIsLoading(true);

    // Update connection settings from form values
    updateSettings({
      url: values.url,
      token: values.token,
    });

    // Attempt connection
    const result = connect();
    setIsLoading(false);

    // Error handling
    if (result.success) {
      setTimeout(() => {
        onNext();
      }, 750);
    } else {
      Object.entries(result.errors).forEach(([key, value]) => {
        if (value && key in values) {
          form.setError(key as keyof ConnectionFormValues, {
            type: "manual",
            message: value,
          });
        }
      });
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Connect to SyftBox</CardTitle>
        <CardDescription>Connect to your SyftBox CLI client</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleConnectClient)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="client-url">Client URL</FormLabel>
                  <FormControl>
                    <Input
                      id="client-url"
                      placeholder={DEFAULT_CONNECTION_SETTINGS.url}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="client-token">Token</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="client-token"
                        type={showToken ? "text" : "password"}
                        placeholder="Enter your client token"
                        autoComplete="off"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-full cursor-pointer px-3"
                        onClick={() => setShowToken(!showToken)}
                        aria-label={showToken ? "Hide token" : "Show token"}
                      >
                        {showToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isLoading || status === "connecting"}
            >
              {isLoading || status === "connecting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      {onBack && (
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
      )}
    </Card>
  );
}
