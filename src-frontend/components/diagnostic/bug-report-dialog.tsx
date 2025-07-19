"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { downloadLogs } from "@/lib/api/logs";
import { submitBugReport } from "@/lib/api/bug-report";
import { APP_VERSION } from "@/lib/version";

interface BugReportDialogProps {
  trigger: React.ReactNode;
}

export function BugReportDialog({ trigger }: BugReportDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shareLogs, setShareLogs] = useState(true);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setScreenshots((prev) => [...prev, ...newFiles]);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileInputDisplay = () => {
    if (screenshots.length === 0) return "No files selected";
    if (screenshots.length === 1) return "1 file selected";
    return `${screenshots.length} files selected`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logsBlob: Blob | undefined;
      if (shareLogs) {
        try {
          logsBlob = await downloadLogs();
        } catch (error) {
          console.error("Failed to download logs:", error);
          toast({
            icon: "⚠️",
            title: "Failed to download logs",
            description: "The bug report will be submitted without logs.",
            variant: "destructive",
          });
        }
      }

      // Get OS and architecture info
      const os = navigator.platform;
      const arch = navigator.userAgent.includes("x86_64") ? "amd64" : "arm64";

      // Submit the bug report
      await submitBugReport({
        title,
        description,
        version: APP_VERSION,
        os,
        arch,
        logs: logsBlob,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      });

      // Success! Show toast, close the dialog and reset the form
      toast({
        icon: "🐛",
        title: "Bug report submitted",
        description: "Thank you for helping us improve our platform.",
        variant: "default",
      });

      setIsOpen(false);
      setTitle("");
      setDescription("");
      setShareLogs(false);
      setScreenshots([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast({
        icon: "❌",
        title: "Failed to submit bug report",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
            <DialogDescription>
              Please describe the issue you&apos;re experiencing. This
              information will help us improve our platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bug-title" className="text-right">
                Title
              </Label>
              <Input
                id="bug-title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                className="col-span-3"
                placeholder="Brief description of the issue"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bug-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="bug-description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                className="col-span-3"
                placeholder="Please include steps to reproduce the issue and any error messages you may have seen"
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="screenshots" className="text-right">
                Screenshots
                <br />
                <span className="text-muted-foreground ml-1 text-xs">
                  (optional)
                </span>
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="relative">
                  <Input
                    id="screenshots"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="bg-background flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-muted-foreground text-sm">
                      {getFileInputDisplay()}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </div>
                </div>
                {screenshots.length > 0 && (
                  <div className="mt-2 max-h-[200px] space-y-2 overflow-y-auto pr-2">
                    {screenshots.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScreenshot(index)}
                          className="ml-2 h-6 shrink-0 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  Add screenshots that help illustrate the issue
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div></div>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="share-logs"
                  checked={shareLogs}
                  onCheckedChange={(checked) => setShareLogs(checked === true)}
                />
                <Label
                  htmlFor="share-logs"
                  className="text-muted-foreground cursor-pointer text-sm font-normal"
                >
                  Share logs with this report (recommended)
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
