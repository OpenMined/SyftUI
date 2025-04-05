"use client";

import { useState } from "react";
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

interface BugReportDialogProps {
  trigger: React.ReactNode;
}

export function BugReportDialog({ trigger }: BugReportDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shareLogs, setShareLogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would implement the actual logic to submit the bug report
      // For example, sending to an API endpoint
      console.log("Bug report submitted:", {
        title,
        description,
        shareLogs,
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
    } catch (error) {
      console.error("Error submitting bug report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
                onChange={(e) => setTitle(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Please include steps to reproduce the issue and any error messages you may have seen"
                rows={5}
                required
              />
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
