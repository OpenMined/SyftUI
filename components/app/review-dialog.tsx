"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface ReviewDialogProps {
  appName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (rating: number, reviewText: string) => void
}

export function ReviewDialog({ appName, open, onOpenChange, onSubmit }: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (rating === 0) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)

      // Show toast notification
      toast({
        icon: "🎉",
        title: "Review Submitted!",
        description: `Thank you for reviewing ${appName}. Your feedback helps others make informed decisions.`,
        variant: "default",
      })

      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(rating, reviewText)
      }

      // Reset and close dialog
      setRating(0)
      setReviewText("")
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 cursor-pointer ${star <= (hoverRating || rating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                      }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="review-text" className="text-sm font-medium">
                Review
              </label>
              <Textarea
                id="review-text"
                placeholder="Share your experience with this app..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="mt-2"
                rows={5}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}