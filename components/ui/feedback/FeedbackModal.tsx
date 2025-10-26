'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PreferencesStore } from '@/lib/storage/preferences';
import type { FeedbackSubmission } from '@/types/feedback';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto-capture user preferences
      const userPrefs = PreferencesStore.get();

      const feedbackData: FeedbackSubmission = {
        message,
        email: email || undefined,
        userPrefs: userPrefs
          ? {
              team: userPrefs.team,
              division: userPrefs.division,
              mcpServer: userPrefs.mcpServer,
            }
          : undefined,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Thanks! Your feedback has been sent.');
        setMessage('');
        setEmail('');
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Failed to send feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Just describe what happened. Copy and paste any error messages you see.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">
              What went wrong? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Example: 'The schedule won't load' or copy/paste any error messages..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="mt-2 min-h-[120px]"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              We only collect your message, team preferences (if saved), and timestamp. No personal data.
            </p>
          </div>

          <div>
            <Label htmlFor="email">Your email (optional for follow-up)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
