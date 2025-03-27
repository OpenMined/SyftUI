"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Github, Chrome, Loader2, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    ConnectionFormValues,
    ConnectionStatus as StatusType,
    DEFAULT_CONNECTION_SETTINGS,
    connectionFormSchema,
    useConnection
} from "@/components/contexts/connection-context"

export default function HomePage() {
    const router = useRouter()
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [step, setStep] = useState<"connect" | "configure" | "verify">("connect")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
    const [isGithubLoading, setIsGithubLoading] = useState<boolean>(false)
    const [email, setEmail] = useState<string>("")
    const [verificationToken, setVerificationToken] = useState<string>("")
    const [dataDir, setDataDir] = useState<string>(`~/SyftBox`)
    const [serverUrl, setServerUrl] = useState<string>("https://syftbox.openmined.org/")
    const [showToken, setShowToken] = useState(false)

    const {
        settings,
        updateSettings,
        status,
        connect,
        displayUrl
    } = useConnection();

    const form = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionFormSchema),
        defaultValues: {
            url: DEFAULT_CONNECTION_SETTINGS.url,
            token: DEFAULT_CONNECTION_SETTINGS.token,
        },
    })

    // Navigate to app with next parameter support
    const navigateToApp = () => {
        const params = new URLSearchParams(window.location.search);
        const nextUrl = params.get("next") || "/dashboard";
        router.push(nextUrl);
    }

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Sync form with connection settings
    useEffect(() => {
        form.setValue("url", settings.url);
        form.setValue("token", settings.token);
    }, [form, settings]);

    const handleConnectClient = (values: ConnectionFormValues) => {
        setIsLoading(true)

        // Update connection settings from form values
        updateSettings({
            url: values.url,
            token: values.token
        });

        // Attempt connection
        const result = connect();
        setIsLoading(false);

        if (result.success) {
            setTimeout(() => {
                setStep("configure");
            }, 1500);
        } else {
            Object.entries(result.errors).forEach(([key, value]) => {
                if (value && key in values) {
                    form.setError(key as keyof ConnectionFormValues, {
                        type: "manual",
                        message: value
                    });
                }
            });
        }
    }

    const handleSendVerification = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate sending verification email
        setTimeout(() => {
            setIsLoading(false)
            setStep("verify")
        }, 1500)
    }

    const handleCompleteSetup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate token verification
        setTimeout(() => {
            setIsLoading(false)
            navigateToApp();
        }, 1500)
    }

    const handleOAuthLogin = (provider: string) => {
        if (provider === "Google") {
            setIsGoogleLoading(true)

            // Simulate OAuth login
            setTimeout(() => {
                setIsGoogleLoading(false)
                navigateToApp();
            }, 1500)
        } else if (provider === "GitHub") {
            setIsGithubLoading(true)

            // Simulate OAuth login
            setTimeout(() => {
                setIsGithubLoading(false)
                navigateToApp();
            }, 1500)
        }
    }

    if (!mounted) {
        return null
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8 p-6">
                <div className="flex items-center">
                    <Image
                        src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
                        alt="SyftBox Logo"
                        width={180}
                        height={40}
                        priority
                    />
                </div>
                <ThemeToggle />
            </div>

            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {step === "connect" && "Connect to SyftBox"}
                        {step === "configure" && "Configure SyftBox"}
                        {step === "verify" && "Verify Your Email"}
                    </CardTitle>
                    <CardDescription>
                        {step === "connect" && "Connect to your SyftBox CLI client"}
                        {step === "configure" && "Let's get you set up in just a few steps"}
                        {step === "verify" && "Enter the verification token sent to your email"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === "connect" && (
                        <form onSubmit={form.handleSubmit(handleConnectClient)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="client-url">Client URL</Label>
                                <Input
                                    id="client-url"
                                    {...form.register("url")}
                                    placeholder="http://127.0.0.1:8080/"
                                    required
                                />
                                {form.formState.errors.url && (
                                    <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client-token">Token</Label>
                                <div className="relative">
                                    <Input
                                        id="client-token"
                                        type={showToken ? "text" : "password"}
                                        {...form.register("token")}
                                        placeholder="Enter your client token"
                                        autoComplete="off"
                                        required
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
                                {form.formState.errors.token && (
                                    <p className="text-sm text-destructive">{form.formState.errors.token.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading || status === "connecting"}>
                                {(isLoading || status === "connecting") ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : "Connect"}
                            </Button>
                        </form>
                    )}

                    {step === "configure" && (
                        <form onSubmit={handleSendVerification} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="data-dir">Where do you want SyftBox to store data?</Label>
                                <Input
                                    id="data-dir"
                                    value={dataDir}
                                    onChange={(e) => setDataDir(e.target.value)}
                                    placeholder="~/SyftBox"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="server-url">Enter the SyftBox Server URL</Label>
                                <Input
                                    id="server-url"
                                    value={serverUrl}
                                    onChange={(e) => setServerUrl(e.target.value)}
                                    placeholder="https://syftbox.openmined.org/"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Enter your email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
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
                    )}

                    {step === "verify" && (
                        <form onSubmit={handleCompleteSetup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="verification-token">Please enter the token sent to {email}</Label>
                                <Input
                                    id="verification-token"
                                    value={verificationToken}
                                    onChange={(e) => setVerificationToken(e.target.value)}
                                    placeholder="Enter verification token"
                                    required
                                />
                                <p className="text-sm text-muted-foreground">Also check your spam folder if you don't see the email.</p>
                            </div>
                            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : "Complete Setup"}
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    {step !== "connect" && (
                        <Button
                            variant="outline"

                            className="cursor-pointer"
                            onClick={() => setStep(step === "verify" ? "configure" : "connect")}
                            disabled={isLoading || isGoogleLoading || isGithubLoading}
                        >
                            Back
                        </Button>
                    )}
                    {status === "connected" && step === "connect" && (
                        <div className="text-sm text-green-500 font-medium">
                            <span className="text-2xl align-middle font-bold">•</span> Connected to {displayUrl}
                        </div>
                    )}
                </CardFooter>
            </Card>
        </>
    )
}