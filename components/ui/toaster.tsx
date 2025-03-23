"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-start gap-3">
              {/* Icon/Emoji column */}
              {icon && (
                <div className="text-xl pt-0.5">{icon}</div>
              )}
              {/* Title and description column */}
              <div className="grid gap-1">
                {title && (
                  <ToastTitle>{title}</ToastTitle>
                )}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
