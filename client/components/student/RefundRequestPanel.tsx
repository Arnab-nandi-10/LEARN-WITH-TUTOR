'use client';

import { useState } from 'react';
import { CircleDollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import * as businessApi from '@/lib/api/business';

interface RefundRequestPanelProps {
  courseId: string;
  courseTitle: string;
  completionPercentage: number;
}

export default function RefundRequestPanel({
  courseId,
  courseTitle,
  completionPercentage,
}: RefundRequestPanelProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestRefund = async () => {
    try {
      setSubmitting(true);
      await businessApi.requestRefund({
        courseId,
        reason: reason.trim() || undefined,
      });
      toast.success('Refund request submitted for admin review.');
      setReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to request refund');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[30px] border-[#2C1E19] bg-[linear-gradient(180deg,#140E0D_0%,#0F0F10_100%)] p-0">
      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex rounded-full border border-[#3D2921] bg-[#1A100E] p-3 text-[#FF6A2A]">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <h3
              className="text-2xl font-semibold text-[#FAFAFA]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Refund request for {courseTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#9C8F88]">
              This request is validated on the backend using your progress, final exam
              attempt, payment record, and the active refund rules set by admin.
            </p>
          </div>

          <div className="rounded-[18px] border border-[#32241E] bg-[#151111] px-4 py-3 text-sm text-[#D6B8A8]">
            Current lesson completion: <span className="font-semibold text-[#FAFAFA]">{completionPercentage}%</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <Textarea
            label="Why are you requesting a refund?"
            placeholder="Share any context you want the admin team to review."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-[120px] rounded-[18px] border-[#32241E] bg-[#120D0D] text-[#FAFAFA] placeholder:text-[#6C625E]"
            helperText="Optional, but helpful when the request is reviewed."
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handleRequestRefund}
              disabled={submitting}
              className="h-14 w-full rounded-[18px] bg-[#D65B26] text-base hover:bg-[#E96B32]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Request refund'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
