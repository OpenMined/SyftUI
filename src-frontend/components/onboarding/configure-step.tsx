import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Folder, Loader2 } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

// Config form schema
const configFormSchema = z.object({
  dataDir: z.string().min(1, "Data directory is required"),
  serverUrl: z.string().url("Must be a valid URL"),
  email: z.string().email("Please enter a valid email address"),
});

// Config form type
type ConfigFormValues = z.infer<typeof configFormSchema>;

interface ConfigureStepProps {
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function ConfigureStep({
  onNext,
  onBack,
  isLoading,
  setIsLoading,
}: ConfigureStepProps) {
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      dataDir: "~/SyftBox",
      serverUrl: "https://syftbox.openmined.org/",
      email: "user@example.com",
    },
  });

  const handleDirectorySelect = () => {
    toast({
      icon: "🐱",
      title: "Feature Coming Soon!",
      description:
        "Hang tight! We're working on this feature. Meanwhile, here's a cat for ya!",
      variant: "default",
    });
  };

  const handleConfigureClient = () => {
    setIsLoading(true);

    // Simulate saving configuration
    setTimeout(() => {
      setIsLoading(false);
      onNext();
    }, 750);
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Configure SyftBox</CardTitle>
        <CardDescription>
          Let&apos;s get you set up in just a few steps
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleConfigureClient)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="dataDir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Where do you want SyftBox to store data?
                  </FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="~/SyftBox" {...field} />
                    </FormControl>
                    <Button
                      variant="outline"
                      onClick={handleDirectorySelect}
                      type="button"
                    >
                      <Folder className="mr-2 h-4 w-4" />
                      Browse
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter the SyftBox Server URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://syftbox.openmined.org/"
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
                  Next
                </>
              ) : (
                "Next"
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
