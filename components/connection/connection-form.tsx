"use client"

import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ConnectionFormValues, ConnectionStatus, DEFAULT_CONNECTION_SETTINGS } from "@/stores"

interface ConnectionFormProps {
  form: UseFormReturn<ConnectionFormValues>;
  onSubmit: (values: ConnectionFormValues) => void;
  onCancel?: () => void;
  onSettingsChange?: (key: keyof ConnectionFormValues, value: string) => void;
  status: ConnectionStatus;
  showCancelButton?: boolean;
  submitButtonText?: string;
}

export function ConnectionForm({
  form,
  onSubmit,
  onCancel,
  onSettingsChange,
  status,
  showCancelButton = true,
  submitButtonText = "Connect"
}: ConnectionFormProps) {
  const [showToken, setShowToken] = useState(false);

  // Handle form field change with settings sync
  const handleFieldChange = (
    field: { onChange: (e: any) => void },
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof ConnectionFormValues
  ) => {
    field.onChange(e);
    if (onSettingsChange) {
      onSettingsChange(fieldName, e.target.value);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client URL</FormLabel>
              <FormControl>
                <Input
                  placeholder={DEFAULT_CONNECTION_SETTINGS.url}
                  {...field}
                  onChange={(e) => handleFieldChange(field, e, "url")}
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
              <FormLabel>Token</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="Enter your client token"
                    autoComplete="off"
                    {...field}
                    onChange={(e) => handleFieldChange(field, e, "token")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
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

        <div className="flex justify-end space-x-2 pt-2">
          {showCancelButton && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="cursor-pointer select-none">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={status === "connecting"} className="cursor-pointer select-none">
            {status === "connecting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
