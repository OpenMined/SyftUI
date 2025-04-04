"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Github, Chrome, Loader2, Eye, EyeOff, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    ConnectionFormValues,
    ConnectionStatus as StatusType,
    DEFAULT_CONNECTION_SETTINGS,
    connectionFormSchema,
    useConnectionStore
} from "@/stores"
import { toast } from "@/hooks/use-toast"
import { LogoComponent } from "@/components/logo"
import { FloatingConnectionStatus } from "@/components/floating-connection-status"
import { ConnectionStatus } from "@/components/connection-status"

export default function HomePage() {
    const router = useRouter()
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [step, setStep] = useState<"connect" | "configure" | "email" | "verify">("connect")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
    const [isGithubLoading, setIsGithubLoading] = useState<boolean>(false)
    const [showToken, setShowToken] = useState(false)

    const {
        settings,
        updateSettings,
        status,
        connect,
        displayUrl
    } = useConnectionStore();

    const connectionForm = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionFormSchema),
        defaultValues: {
            url: DEFAULT_CONNECTION_SETTINGS.url,
            token: DEFAULT_CONNECTION_SETTINGS.token,
        },
    })

    // Config form schema
    const configFormSchema = z.object({
        dataDir: z.string().min(1, "Data directory is required"),
        serverUrl: z.string().url("Must be a valid URL"),
        email: z.string().email("Please enter a valid email address")
    });

    // Config form type
    type ConfigFormValues = z.infer<typeof configFormSchema>;

    // Setup config form with react-hook-form and zod validation
    const configForm = useForm<ConfigFormValues>({
        resolver: zodResolver(configFormSchema),
        defaultValues: {
            dataDir: "~/SyftBox",
            serverUrl: "https://syftbox.openmined.org/",
            email: "user@example.com"
        }
    });

    // Verification form schema
    const verificationFormSchema = z.object({
        token: z.string().min(6, "Verification token must be at least 6 characters")
    });

    // Verification form type
    type VerificationFormValues = z.infer<typeof verificationFormSchema>;

    // Setup verification form with react-hook-form and zod validation
    const verificationForm = useForm<VerificationFormValues>({
        resolver: zodResolver(verificationFormSchema),
        defaultValues: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRhdXF1aXJAb3Blbm1pbmVkLm9yZyIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJpYXQiOjE3MzY5NDQxNjd9.YqRMwd9StsRUA_sAQuz1zSwkHtAV_RWdhCltCHW1E5x"
        }
    });

    // Navigate to app with next parameter support
    const navigateToApp = () => {
        const params = new URLSearchParams(window.location.search);
        const nextUrl = params.get("next") || "/dashboard";
        router.push(nextUrl);

        toast({
            icon: "🎉",
            title: "Welcome to SyftBox!",
            description: "You're all set up and ready to go.",
            variant: "default",
        })
    }

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleConnectClient = (values: ConnectionFormValues) => {
        setIsLoading(true)

        // Update connection settings from connectionForm values
        updateSettings({
            url: values.url,
            token: values.token
        });

        // Attempt connection
        const result = connect();
        setIsLoading(false);

        // Error handling (navigation handled by useEffect)
        if (result.success) {
            setTimeout(() => {
                setStep("configure");
            }, 750);
        } else {
            Object.entries(result.errors).forEach(([key, value]) => {
                if (value && key in values) {
                    connectionForm.setError(key as keyof ConnectionFormValues, {
                        type: "manual",
                        message: value
                    });
                }
            });
        }
    }

    const handleDirectorySelect = () => {
        toast({
            icon: "🐱",
            title: "Feature Coming Soon!",
            description: "Hang tight! We're working on this feature. Meanwhile, here's a cat for ya!",
            variant: "default",
        })
    }

    const handleConfigureClient = (values: ConfigFormValues) => {
        setIsLoading(true);

        // Simulate saving configuration
        setTimeout(() => {
            setIsLoading(false);
            setStep("email");
        }, 750);
    }

    const handleSendVerification = (values: VerificationFormValues) => {
        setIsLoading(true);

        // Simulate sending verification email
        setTimeout(() => {
            setIsLoading(false);
            setStep("verify");
        }, 750);
    };

    const handleCompleteSetup = (values: VerificationFormValues) => {
        setIsLoading(true)

        // Simulate token verification
        setTimeout(() => {
            setIsLoading(false)
            navigateToApp();
        }, 750)
    }

    const handleOAuthLogin = (provider: string) => {
        if (provider === "Google") {
            setIsGoogleLoading(true)

            // Simulate OAuth login
            setTimeout(() => {
                setIsGoogleLoading(false)
                navigateToApp();
            }, 750)
        } else if (provider === "GitHub") {
            setIsGithubLoading(true)

            // Simulate OAuth login
            setTimeout(() => {
                setIsGithubLoading(false)
                navigateToApp();
            }, 750)
        }
    }

    if (!mounted) {
        return null
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8 p-6">
                <div className="flex items-center w-[180] h-[40]">
                    <LogoComponent />
                </div>
                <ThemeToggle />
            </div>

            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {step === "connect" && "Connect to SyftBox"}
                        {step === "configure" && "Configure SyftBox"}
                        {step === "email" && "Connect to your datasite"}
                        {step === "verify" && "Verify Your Email"}
                    </CardTitle>
                    <CardDescription>
                        {step === "connect" && "Connect to your SyftBox CLI client"}
                        {step === "configure" && "Let's get you set up in just a few steps"}
                        {step === "email" && "Log in to access your datasite"}
                        {step === "verify" && "Enter the verification token sent to your email"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === "connect" && (
                        <Form {...connectionForm}>
                            <form onSubmit={connectionForm.handleSubmit(handleConnectClient)} className="space-y-4">
                                <FormField
                                    control={connectionForm.control}
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
                                    control={connectionForm.control}
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
                                                        className="absolute right-0 top-0 h-full px-3 cursor-pointer"
                                                        onClick={() => setShowToken(!showToken)}
                                                        aria-label={showToken ? "Hide token" : "Show token"}
                                                    >
                                                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading || status === "connecting"}>
                                    {(isLoading || status === "connecting") ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : "Connect"}
                                </Button>
                            </form>
                        </Form>
                    )}

                    {step === "configure" && (
                        <Form {...configForm}>
                            <form onSubmit={configForm.handleSubmit(handleConfigureClient)} className="space-y-4">
                                <FormField
                                    control={configForm.control}
                                    name="dataDir"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Where do you want SyftBox to store data?</FormLabel>
                                            <div className="flex space-x-2">
                                                <FormControl>
                                                    <Input
                                                        placeholder="~/SyftBox"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <Button variant="outline" onClick={handleDirectorySelect} type="button">
                                                    <Folder className="h-4 w-4 mr-2" />
                                                    Browse
                                                </Button>
                                            </div>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={configForm.control}
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

                                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Next
                                        </>
                                    ) : "Next"}
                                </Button>
                            </form>
                        </Form>
                    )}

                    {step === "email" && (
                        <Form {...configForm}>
                            <form onSubmit={configForm.handleSubmit(handleSendVerification)} className="space-y-4">
                                <FormField
                                    control={configForm.control}
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

                                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Send Verification Token
                                        </>
                                    ) : "Send Verification Token"}
                                </Button>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
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
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Chrome className="h-4 w-4 mr-2" />
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
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Github className="h-4 w-4 mr-2" />
                                        )}
                                        GitHub
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}

                    {step === "verify" && (
                        <Form {...verificationForm}>
                            <form onSubmit={verificationForm.handleSubmit(handleCompleteSetup)} className="space-y-4">
                                <FormField
                                    control={verificationForm.control}
                                    name="token"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Please enter the token sent to {configForm.getValues("email")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter verification token"
                                                    autoComplete="off"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-sm text-muted-foreground">Also check your spam folder if you don't see the email.</p>
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : "Complete Setup"}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    {step !== "connect" && (
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setStep(step === "verify" ? "email" : step === "email" ? "configure" : "connect")}
                            disabled={isLoading || isGoogleLoading || isGithubLoading}
                        >
                            Back
                        </Button>
                    )}
                </CardFooter>
            </Card>
            <FloatingConnectionStatus status={status} url={displayUrl} position="bottom-right" />
        </>
    )
}