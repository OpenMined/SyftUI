"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoComponent } from "@/components/logo"

const formSchema = z.object({
    host: z.string().min(1, "Host is required").regex(/^[a-zA-Z0-9.-]+$/, "Invalid host"),
    port: z.preprocess(
        (value) => parseInt(z.string().parse(value), 10),
        z.number().min(1, "Port is required").max(65535, "Port must be between 1 and 65535")
    ),
    token: z.string().length(40, "Token must be exactly 40 characters"),
})

type FormValues = z.infer<typeof formSchema>

export default function HomePage() {
    const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected")
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Session storage utilities
    const saveToSessionStorage = (key: string, value: any) => {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to sessionStorage:', error);
        }
    };

    const getFromSessionStorage = (key: string) => {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return null;
        }
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            host: "localhost",
            port: "3000",
            token: "2b280fc73335d39427183bed28fead26d865a5c1",
        },
    })

    // Load saved connection from sessionStorage
    useEffect(() => {
        const savedConnection = getFromSessionStorage('connectionSettings');
        if (savedConnection) {
            try {
                const { host, port, token } = savedConnection;
                if (host) form.setValue("host", host);
                if (port) form.setValue("port", port);
                if (token) form.setValue("token", token);
            } catch (error) {
                console.error('Failed to parse saved connection', error);
            }
        }
    }, [form]);

    useEffect(() => {
        // Handle navigation after successful connection
        const nextUrl = searchParams.get("next") || "dashboard"
        if (status === "connected") {
            router.push(nextUrl)
        }
    }, [status, router, searchParams])

    // Handle form submission
    async function onSubmit(values: FormValues) {
        setStatus("connecting")

        // Simulate connection attempt
        setTimeout(() => {
            saveToSessionStorage('connectionSettings', values);
            setStatus("connected")
        }, 750)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="absolute right-4 top-4 md:right-8 md:top-8">
                    <ThemeToggle />
                </div>

                <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
                    <div className="w-full max-w-md space-y-8">
                        <div className="flex flex-col items-center space-y-6">
                            <div className="h-16 w-auto">
                                <LogoComponent />
                            </div>

                            <h1 className="text-center text-xl font-semibold tracking-tight">
                                Connect to your SyftBox client to get started
                            </h1>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="host"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Host</FormLabel>
                                            <FormControl>
                                                <Input placeholder="localhost" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="port"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Port</FormLabel>
                                            <FormControl>
                                                <Input min={1} type="number" placeholder="3000" {...field} />
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
                                            <FormLabel>Token</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your 40-character token"
                                                        autoComplete="off"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-0 h-full px-3"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        aria-label={showPassword ? "Hide token" : "Show token"}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="text-sm text-muted-foreground">
                                    You can find this information in the output of the{" "}
                                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">syft client</code> command in the terminal.
                                    Alternatively, you can click the link provided in the terminal or copy and paste it into your browser.
                                </div>

                                <Button type="submit" className="w-full" disabled={status === "connecting"}>
                                    {status === "connecting" ? (
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
                    </div>
                </div>
            </div>
        </div>
    )
}