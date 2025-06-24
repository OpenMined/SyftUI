import { useEffect, useState } from "react";
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
  connectionFormSchema,
  useConnectionStore,
} from "@/stores";
import { isConfigValid } from "@/stores/useConnectionStore";

interface ConnectStepProps {
  onComplete: () => void;
  onNext: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function ConnectStep({
  onComplete,
  onNext,
  isLoading,
  setIsLoading,
}: ConnectStepProps) {
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { updateSettings, status, datasite, connect, settings } =
    useConnectionStore();

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      url: settings.url,
      token: settings.token,
    },
  });

  useEffect(() => {
    form.setValue("url", settings.url);
    form.setValue("token", settings.token);
  }, [settings.url, settings.token, form]);

  const handleConnectDaemon = async (values: ConnectionFormValues) => {
    setIsConnecting(true);
    setIsLoading(true);

    try {
      // Update connection settings from form values
      updateSettings({
        url: values.url,
        token: values.token,
      });

      // Attempt connection
      const result = await connect();

      // Error handling
      if (result.success) {
        if (isConfigValid(datasite?.status)) {
          onComplete();
        } else {
          onNext();
        }
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
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleConnectDaemon)}
          className="space-y-4"
        >
          <CardHeader>
            <CardTitle className="text-2xl">Connect to the daemon</CardTitle>
            <CardDescription>
              Run <code className="font-bold">syftbox</code> command in your
              terminal to get started.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="daemon-url">Daemon URL</FormLabel>
                  <FormControl>
                    <Input
                      id="daemon-url"
                      placeholder="Enter your daemon URL"
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
                  <FormLabel htmlFor="daemon-token">Token</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="daemon-token"
                        type={showToken ? "text" : "password"}
                        placeholder="Enter your daemon token"
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
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isLoading || status === "connecting" || isConnecting}
            >
              {isLoading || status === "connecting" || isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
