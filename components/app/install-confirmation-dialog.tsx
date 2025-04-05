"use client"

import React, { useState } from 'react'
import { AlertTriangle, Download, ExternalLink, ShieldAlert } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { App } from '@/lib/mock-apps'

interface InstallConfirmationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  app: App
  onConfirm: () => void
  onCancel: () => void
}

export function InstallConfirmationDialog({
  isOpen,
  onOpenChange,
  app,
  onConfirm,
  onCancel,
}: InstallConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const handleInstall = () => {
    setIsProcessing(true)
    // Simulate an installation process
    setTimeout(() => {
      setIsProcessing(false)
      onConfirm()
    }, 2000)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm sm:max-w-md md:max-w-xl">
        <AlertDialogHeader className="gap-2">
          <div className="flex items-start">
            <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0" />
            <AlertDialogTitle className="text-left">
              Do you trust the publisher &ldquo;{app.publisher}&rdquo;?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3 md:ml-8">
            The app <a
              href={app.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex m-0"
            >
              {app.name} <ExternalLink className="h-2 w-2 align-super" />
            </a>
            is published by <a
              href={app.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex m-0"
            >
              {app.publisher} <ExternalLink className="h-2 w-2 align-super" />
            </a>. This is the first app you&apos;re installing from this publisher.
            <span className="flex items-center gap-2 text-sm my-3">
              <span className="inline-flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full p-1 h-6 w-6">
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </span>
              <span className="text-muted-foreground">
                {app.publisher} is <span className="font-bold text-yellow-500">not</span><span className='font-medium text-yellow-500'> verified</span>.
              </span>
            </span>
            SyftBox has no control over the behavior of third-party apps, including how they manage your personal data. Proceed only if you trust the publisher.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-2 md:ml-8">
            <Button variant="outline">
              Learn More
            </Button>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <AlertDialogCancel onClick={onCancel}>
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={handleInstall}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                {isProcessing ? "Installing..." : "Trust Publisher & Install"}
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog >
  )
}
