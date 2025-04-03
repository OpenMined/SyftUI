"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ExternalLink, Linkedin, MapPin, Pencil, Twitter, User2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ActivityHeatmap } from "./activity-heatmap"
import { SocialConnectionButton } from "./social-connection-button"

const profileFormSchema = z.object({
    displayName: z.string().min(2, {
        message: "Display name must be at least 2 characters.",
    }),
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    title: z.string().optional(),
    organization: z.string().optional(),
    location: z.string().optional(),
    website: z
        .string()
        .url({
            message: "Please enter a valid URL.",
        })
        .optional()
        .or(z.literal("")),
    xLink: z
        .string()
        .url({
            message: "Please enter a valid URL.",
        })
        .optional()
        .or(z.literal("")),
    linkedinLink: z
        .string()
        .url({
            message: "Please enter a valid URL.",
        })
        .optional()
        .or(z.literal("")),
    bio: z.string().max(500).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// This would come from your database
const defaultValues: Partial<ProfileFormValues> = {
    displayName: "User Name",
    username: "username",
    email: "user@example.com",
    title: "Senior Software Engineer",
    organization: "TechCorp Inc.",
    location: "San Francisco, CA",
    website: "https://username.dev",
    xLink: "https://x.com/username",
    linkedinLink: "https://linkedin.com/in/username",
    bio: "Full-stack developer with 8+ years of experience building web applications. Passionate about user experience and clean code.",
}

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues,
        mode: "onChange",
    })

    function onSubmit(data: ProfileFormValues) {
        // In a real app, you would save this data to your backend
        console.log(data)
        setIsEditing(false)
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Activity</CardTitle>
                            <CardDescription>Your activity over the past year</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            View all activity
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ActivityHeatmap />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your profile details and public information</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? (
                                "Cancel"
                            ) : (
                                <>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit profile
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src="/placeholder.svg?height=80&width=80" alt={form.getValues().displayName} />
                                        <AvatarFallback>{form.getValues().displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" type="button">
                                        Change avatar
                                    </Button>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="displayName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Display Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Display Name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Email" type="email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your professional title" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="organization"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Organization</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your organization" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your location" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="website"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Website</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="xLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>X (Twitter)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://x.com/username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="linkedinLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>LinkedIn</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bio</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Tell us about yourself" className="min-h-[120px]" {...field} />
                                            </FormControl>
                                            <FormDescription>You can use up to 500 characters.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Save changes</Button>
                                </div>
                            </form>
                        </Form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src="/placeholder.svg?height=80&width=80" alt={defaultValues.displayName} />
                                    <AvatarFallback>{defaultValues.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-2xl font-semibold">{defaultValues.displayName}</h3>
                                    <p className="text-muted-foreground">@{defaultValues.username}</p>
                                    <p className="mt-1">
                                        {defaultValues.title} at {defaultValues.organization}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-2">
                                    <User2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Email:</span>
                                    <span className="text-sm">{defaultValues.email}</span>
                                </div>

                                {defaultValues.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Location:</span>
                                        <span className="text-sm">{defaultValues.location}</span>
                                    </div>
                                )}

                                {defaultValues.website && (
                                    <div className="flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Website:</span>
                                        <a
                                            href={defaultValues.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {defaultValues.website.replace(/^https?:\/\//, "")}
                                        </a>
                                    </div>
                                )}

                                {defaultValues.xLink && (
                                    <div className="flex items-center gap-2">
                                        <Twitter className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">X:</span>
                                        <a
                                            href={defaultValues.xLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {defaultValues.xLink.replace(/^https?:\/\/(www\.)?x\.com\//, "@")}
                                        </a>
                                    </div>
                                )}

                                {defaultValues.linkedinLink && (
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">LinkedIn:</span>
                                        <a
                                            href={defaultValues.linkedinLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {defaultValues.linkedinLink.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {defaultValues.bio && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Bio</h4>
                                        <p className="text-sm text-muted-foreground">{defaultValues.bio}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Connected Accounts</CardTitle>
                    <CardDescription>Manage your connected social accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SocialConnectionButton provider="github" isConnected={true} username="sarahjohnson" />
                    <SocialConnectionButton provider="google" isConnected={true} email="sarah.johnson@gmail.com" />
                    <SocialConnectionButton provider="twitter" isConnected={false} />
                </CardContent>
            </Card>
        </div>
    )
}
