"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectionForm } from "@/components/connection/connection-form"

import { ThemeToggle } from "@/components/theme-toggle"
import { LogoComponent } from "@/components/logo"
import { ConnectionStatus as StatusType, DEFAULT_CONNECTION_SETTINGS, connectionFormSchema, ConnectionFormValues, useConnection } from "@/components/contexts/connection-context"

export default function HomePage() {
    const router = useRouter()
    const {
        settings,
        updateSettings,
        status,
        connect
    } = useConnection();

    const form = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionFormSchema),
        defaultValues: {
            host: DEFAULT_CONNECTION_SETTINGS.host,
            port: DEFAULT_CONNECTION_SETTINGS.port,
            token: DEFAULT_CONNECTION_SETTINGS.token,
        },
    })

    // Sync form with connection settings
    useEffect(() => {
        form.setValue("host", settings.host);
        form.setValue("port", settings.port as string);
        form.setValue("token", settings.token);
    }, [form, settings]);

    useEffect(() => {
        // Handle navigation after successful connection
        const nextUrl = new URLSearchParams(window.location.search).get("next") || "/dashboard";
        if (status === "connected") {
            router.push(nextUrl)
        }
    }, [status])

    // Handle form submission
    async function onSubmit(values: ConnectionFormValues) {
        // Update connection settings from form values
        updateSettings({
            host: values.host,
            port: values.port.toString(),
            token: values.token
        });

        // Attempt connection
        const result = connect();

        if (!result.success) {
            // Handle validation errors from the connection hook
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

                        <div className="space-y-6">
                            <ConnectionForm
                                form={form}
                                onSubmit={onSubmit}
                                onSettingsChange={(key, value) => updateSettings({ [key]: value })}
                                status={status}
                                showCancelButton={false}
                            />

                            <div className="text-sm text-muted-foreground">
                                You can find this information in the output of the{" "}
                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">syft client</code> command in the terminal.
                                Alternatively, you can click the link provided in the terminal or copy and paste it into your browser.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}