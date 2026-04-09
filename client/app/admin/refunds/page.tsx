'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  RotateCcw,
  Settings2,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import * as businessApi from '@/lib/api/business';
import { formatCurrency } from '@/lib/commerce';
import type { Refund, RefundRules, RefundTier } from '@/lib/types';

const createEmptyRules = (): RefundRules => ({
  minCompletion: 0,
  minScore: 0,
  timeLimitDays: 0,
  tiers: [{ minScore: 0, refundPercent: 0 }],
});

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [rules, setRules] = useState<RefundRules>(createEmptyRules());
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadRefundData = async () => {
      try {
        setLoading(true);
        const [refundData, ruleData] = await Promise.all([
          businessApi.getRefundRequests(),
          businessApi.getRefundRules().catch(() => null),
        ]);
        setRefunds(refundData);
        if (ruleData) {
          setRules(ruleData);
        }
      } catch (error) {
        console.error('Failed to load refunds:', error);
        toast.error('Failed to load refund operations.');
      } finally {
        setLoading(false);
      }
    };

    loadRefundData();
  }, []);

  const stats = useMemo(() => {
    return {
      openRequests: refunds.filter((refund) => refund.status === 'requested').length,
      eligibleCount: refunds.filter((refund) => refund.eligible).length,
      totalExposure: refunds.reduce(
        (sum, refund) => sum + (refund.paymentData?.amount || 0),
        0
      ),
    };
  }, [refunds]);

  const policyPreview = useMemo(() => buildRefundPolicyPreview(rules), [rules]);

  const handleTierChange = (
    index: number,
    key: keyof RefundTier,
    value: number
  ) => {
    setRules((current) => ({
      ...current,
      tiers: current.tiers.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, [key]: value } : tier
      ),
    }));
  };

  const handleSaveRules = async () => {
    try {
      setSavingRules(true);
      const nextRules = await businessApi.setRefundRules(rules);
      setRules(nextRules);
      toast.success('Refund rules updated successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save refund rules');
    } finally {
      setSavingRules(false);
    }
  };

  const handleRefundAction = async (
    refundId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      setProcessingId(refundId);
      const updated = await businessApi.updateRefundStatus(refundId, {
        status,
        remark: remarks[refundId] || undefined,
      });
      setRefunds((current) =>
        current.map((refund) => (refund._id === refundId ? updated : refund))
      );
      toast.success(`Refund ${status} successfully.`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${status} refund`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessRefund = async (refundId: string) => {
    try {
      setProcessingId(refundId);
      const updated = await businessApi.processApprovedRefund(refundId);
      setRefunds((current) =>
        current.map((refund) => (refund._id === refundId ? updated : refund))
      );
      toast.success('Refund processed successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process refund');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#1E1E1E] bg-[linear-gradient(180deg,#120F0E_0%,#0B0B0C_100%)] p-6 sm:p-8">
        <p
          className="text-[11px] uppercase tracking-[0.18em] text-[#FF6A2A]"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          Refund Operations
        </p>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Refund rules and request queue
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8E8E8E]">
              Control the refund engine thresholds, then triage incoming requests with
              progress, exam, and payment context in one admin workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[560px]">
            <MetricCard label="Open requests" value={loading ? '—' : String(stats.openRequests)} />
            <MetricCard label="Eligible" value={loading ? '—' : String(stats.eligibleCount)} />
            <MetricCard label="Exposure" value={loading ? '—' : formatCurrency(stats.totalExposure)} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-[16px] border border-[#232830] bg-[#141920] p-3 text-[#FF6A2A]">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#8A9198]">Rules editor</p>
                <h2
                  className="text-2xl font-semibold text-[#FAFAFA]"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Refund thresholds
                </h2>
              </div>
            </div>

            <Input
              label="Minimum completion (%)"
              type="number"
              min={0}
              max={100}
              value={rules.minCompletion}
              onChange={(event) =>
                setRules((current) => ({
                  ...current,
                  minCompletion: Number(event.target.value),
                }))
              }
            />
            <Input
              label="Minimum score (%)"
              type="number"
              min={0}
              max={100}
              value={rules.minScore}
              onChange={(event) =>
                setRules((current) => ({
                  ...current,
                  minScore: Number(event.target.value),
                }))
              }
            />
            <Input
              label="Refund request time limit (days)"
              type="number"
              min={0}
              value={rules.timeLimitDays}
              onChange={(event) =>
                setRules((current) => ({
                  ...current,
                  timeLimitDays: Number(event.target.value),
                }))
              }
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#FAFAFA]">Score tiers</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setRules((current) => ({
                      ...current,
                      tiers: [...current.tiers, { minScore: 0, refundPercent: 0 }],
                    }))
                  }
                >
                  Add tier
                </Button>
              </div>

              {rules.tiers.map((tier, index) => (
                <div
                  key={`${tier.minScore}-${index}`}
                  className="rounded-[20px] border border-[#1D2228] bg-[#12161B] p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Min score"
                      type="number"
                      min={0}
                      max={100}
                      value={tier.minScore}
                      onChange={(event) =>
                        handleTierChange(index, 'minScore', Number(event.target.value))
                      }
                    />
                    <Input
                      label="Refund percent"
                      type="number"
                      min={0}
                      max={100}
                      value={tier.refundPercent}
                      onChange={(event) =>
                        handleTierChange(
                          index,
                          'refundPercent',
                          Number(event.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={handleSaveRules}
              disabled={savingRules}
              className="w-full rounded-[16px]"
            >
              {savingRules ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save refund rules'
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[#1E1E1E] bg-[linear-gradient(180deg,#11151A_0%,#0D1014_100%)] p-0">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex rounded-[18px] border border-[#202833] bg-[#121820] p-3 text-[#FF6A2A]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-[#8A9198]">Live policy preview</p>
                  <h2
                    className="mt-1 text-2xl font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Refund policy copy
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8A9198]">
                    The written policy below updates instantly while you edit the
                    thresholds on the left. Save the rules to make this version the active
                    refund policy.
                  </p>
                </div>

                <div className="rounded-full border border-[#1F2730] bg-[#10151B] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[#9FB0BF]">
                  Draft updates live
                </div>
              </div>

              {loading ? (
                <p className="py-10 text-center text-sm text-[#8A9198]">
                  Loading refund policy preview...
                </p>
              ) : !policyPreview.hasConfiguredPolicy ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-[#232B34] bg-[#0F1419] px-6 py-10 text-center">
                  <p
                    className="text-lg font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Start editing rules to generate the policy copy.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#8A9198]">
                    Once you set the minimum completion, qualifying score, request window,
                    and score tiers, the written refund policy will appear here
                    automatically.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_320px]">
                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-[#202730] bg-[#11171D] p-5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7E8A96]">
                        Written policy
                      </p>
                      <div className="mt-4 space-y-4 text-sm leading-7 text-[#CDD6DF]">
                        <p>{policyPreview.eligibilityCopy}</p>
                        <p>{policyPreview.payoutCopy}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <PolicyFact
                        icon={<ShieldCheck className="h-4 w-4" />}
                        label="Completion threshold"
                        value={`${policyPreview.minCompletion}% required`}
                      />
                      <PolicyFact
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Qualifying score"
                        value={`${policyPreview.minScore}% or above`}
                      />
                      <PolicyFact
                        icon={<Clock3 className="h-4 w-4" />}
                        label="Request window"
                        value={`Within ${formatDayLabel(policyPreview.timeLimitDays)}`}
                      />
                      <PolicyFact
                        icon={<WalletCards className="h-4 w-4" />}
                        label="Highest refund tier"
                        value={`${policyPreview.topRefundPercent}% of course price`}
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#202730] bg-[#0F1419] p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#7E8A96]">
                      Score to refund map
                    </p>
                    <div className="mt-4 space-y-3">
                      {policyPreview.tiers.length === 0 ? (
                        <div className="rounded-[18px] border border-[#1F2730] bg-[#11171D] px-4 py-3 text-sm leading-6 text-[#8A9198]">
                          No payout tiers are configured yet. Approved requests would
                          currently calculate to a 0% refund until at least one tier is
                          added.
                        </div>
                      ) : (
                        policyPreview.tiers.map((tier) => (
                          <div
                            key={`${tier.minScore}-${tier.refundPercent}`}
                            className="flex items-center justify-between rounded-[18px] border border-[#1F2730] bg-[#11171D] px-4 py-3"
                          >
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-[#7E8A96]">
                                Score
                              </p>
                              <p className="mt-1 text-sm font-medium text-[#FAFAFA]">
                                {tier.minScore}% and above
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-[0.16em] text-[#7E8A96]">
                                Refund
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[#FFB48C]">
                                {tier.refundPercent}%
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="mt-4 text-xs leading-6 text-[#7E8A96]">
                      The highest matching score tier is applied after the learner clears
                      the base eligibility checks above.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114] p-0">
            <CardContent className="p-5">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-[#8A9198]">Review queue</p>
                  <h2
                    className="text-2xl font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Incoming refund requests
                  </h2>
                </div>
                <Badge className="border-[#24303B] bg-[#141A20] text-[#A7B6C2]">
                  {stats.openRequests} open
                </Badge>
              </div>

              {loading ? (
                <p className="py-10 text-center text-sm text-[#8A9198]">
                  Loading refund requests...
                </p>
              ) : refunds.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#8A9198]">
                  No refund requests are waiting for review.
                </p>
              ) : (
                <div className="space-y-4">
                  {refunds.map((refund) => (
                    <div
                      key={refund._id}
                      className="rounded-[24px] border border-[#1D2127] bg-[#12161B] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={refund.eligible ? 'success' : 'warning'}
                            >
                              {refund.eligible ? 'eligible' : 'needs review'}
                            </Badge>
                            <Badge className="border-[#24303B] bg-[#141A20] text-[#A7B6C2]">
                              {refund.status}
                            </Badge>
                          </div>
                          <h3
                            className="text-xl font-semibold text-[#FAFAFA]"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            {refund.courseData?.title || 'Refund request'}
                          </h3>
                          <p className="mt-2 text-sm text-[#8A9198]">
                            {refund.studentData?.name || 'Student'} •{' '}
                            {refund.studentData?.email || refund.student}
                          </p>
                        </div>

                        <div className="grid gap-2 text-right text-sm text-[#8A9198]">
                          <span>Completion: {refund.completionPercentage}%</span>
                          <span>Exam score: {refund.examScore}%</span>
                          <span>
                            Amount at risk:{' '}
                            {formatCurrency(refund.paymentData?.amount || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="space-y-4">
                          <div className="rounded-[20px] border border-[#1C2025] bg-[#0F1318] p-4 text-sm leading-7 text-[#A0A6AD]">
                            <p className="font-medium text-[#F3F4F6]">Student reason</p>
                            <p className="mt-2">
                              {refund.reason || 'No additional context was provided by the student.'}
                            </p>
                          </div>

                          <Textarea
                            label="Admin remark"
                            placeholder="Add review notes or rejection context."
                            value={remarks[refund._id] ?? refund.adminRemark ?? ''}
                            onChange={(event) =>
                              setRemarks((current) => ({
                                ...current,
                                [refund._id]: event.target.value,
                              }))
                            }
                            className="min-h-[110px] rounded-[18px] border-[#232932] bg-[#0F1318]"
                          />
                        </div>

                        <div className="space-y-4 rounded-[22px] border border-[#1C2026] bg-[#0D1116] p-4">
                          <DetailPill
                            label="Created"
                            value={new Date(refund.createdAt).toLocaleDateString()}
                          />
                          <DetailPill
                            label="Projected refund"
                            value={
                              refund.refundAmount
                                ? formatCurrency(refund.refundAmount)
                                : 'Calculated on approval'
                            }
                          />
                          <div className="grid gap-3">
                            {refund.status === 'requested' ? (
                              <>
                                <Button
                                  variant="primary"
                                  onClick={() => handleRefundAction(refund._id, 'approved')}
                                  disabled={processingId === refund._id}
                                  className="rounded-[16px]"
                                >
                                  {processingId === refund._id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleRefundAction(refund._id, 'rejected')}
                                  disabled={processingId === refund._id}
                                  className="rounded-[16px] border-[#2A3038] bg-[#151920]"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            ) : refund.status === 'approved' ? (
                              <Button
                                variant="primary"
                                onClick={() => handleProcessRefund(refund._id)}
                                disabled={processingId === refund._id}
                                className="rounded-[16px]"
                              >
                                {processingId === refund._id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <WalletCards className="h-4 w-4" />
                                    Process refund
                                  </>
                                )}
                              </Button>
                            ) : (
                              <div className="rounded-[16px] border border-[#1E242C] bg-[#12171D] px-4 py-3 text-sm text-[#A7B6C2]">
                                {refund.status === 'processed'
                                  ? 'Refund payout completed.'
                                  : 'Refund request closed.'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function buildRefundPolicyPreview(rules: RefundRules) {
  const minCompletion = sanitizePercent(rules.minCompletion);
  const minScore = sanitizePercent(rules.minScore);
  const timeLimitDays = sanitizeWholeNumber(rules.timeLimitDays);
  const tiers = [...rules.tiers]
    .map((tier) => ({
      minScore: sanitizePercent(tier.minScore),
      refundPercent: sanitizePercent(tier.refundPercent),
    }))
    .sort((a, b) => b.minScore - a.minScore);

  const hasConfiguredPolicy =
    minCompletion > 0 ||
    minScore > 0 ||
    timeLimitDays > 0 ||
    tiers.some((tier) => tier.minScore > 0 || tier.refundPercent > 0);

  const topRefundPercent = tiers.reduce(
    (highest, tier) => Math.max(highest, tier.refundPercent),
    0
  );

  const eligibilityCopy = `Learners become eligible for refund review only after completing at least ${minCompletion}% of the course, scoring ${minScore}% or higher in the qualifying assessment, and submitting the refund request within ${formatDayLabel(
    timeLimitDays
  )} of purchase. Requests linked to cheating, malpractice, or abusive behaviour are automatically rejected.`;

  const payoutCopy =
    tiers.length > 0
      ? 'Once a learner clears the base checks, the approved refund amount is calculated using the highest matching score tier shown below.'
      : 'A learner may clear the base checks, but no score-based payout tier is configured yet, so approved requests would currently return a 0% refund until you add at least one tier.';

  return {
    hasConfiguredPolicy,
    minCompletion,
    minScore,
    timeLimitDays,
    topRefundPercent,
    eligibilityCopy,
    payoutCopy,
    tiers,
  };
}

function sanitizePercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Number(value)));
}

function sanitizeWholeNumber(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(Number(value)));
}

function formatDayLabel(days: number) {
  if (days === 0) {
    return 'the same day';
  }

  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[22px] border-[#1D2025] bg-[#111317]">
      <CardContent className="py-4">
        <p className="text-sm text-[#8A9198]">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-[#FAFAFA]">{value}</p>
      </CardContent>
    </Card>
  );
}

function PolicyFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#202730] bg-[#10151B] px-4 py-4">
      <div className="flex items-center gap-2 text-[#FF6A2A]">{icon}</div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#7E8A96]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[#FAFAFA]">{value}</p>
    </div>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#1E242C] bg-[#12171D] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#768390]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[#FAFAFA]">{value}</p>
    </div>
  );
}
