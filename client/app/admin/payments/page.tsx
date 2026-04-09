'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CreditCard,
  Loader2,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import * as businessApi from '@/lib/api/business';
import { formatCurrency } from '@/lib/commerce';
import type { Payment } from '@/lib/types';

type PaymentFilter = 'all' | 'pending' | 'success' | 'failed';

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<PaymentFilter>('all');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const paymentData = await businessApi.getAllAdminPayments();
        setPayments(paymentData);
        setSelectedPaymentId(paymentData[0]?._id || null);
      } catch (error) {
        console.error('Failed to load payments:', error);
        toast.error('Failed to load payment operations.');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) =>
      activeFilter === 'all' ? true : payment.status === activeFilter
    );
  }, [activeFilter, payments]);

  const selectedPayment = useMemo(
    () =>
      filteredPayments.find((payment) => payment._id === selectedPaymentId) ||
      filteredPayments[0] ||
      null,
    [filteredPayments, selectedPaymentId]
  );

  useEffect(() => {
    const paymentId = selectedPayment?._id;

    if (!paymentId) {
      setSelectedPaymentDetail(null);
      return;
    }

    let cancelled = false;

    const loadPaymentDetail = async () => {
      try {
        setDetailLoading(true);
        const payment = await businessApi.getAdminPaymentDetails(paymentId);
        if (!cancelled) {
          setSelectedPaymentDetail(payment);
        }
      } catch (error) {
        console.error('Failed to load payment detail:', error);
        if (!cancelled) {
          setSelectedPaymentDetail(selectedPayment);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    loadPaymentDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedPayment]);

  const stats = useMemo(() => {
    const successful = payments.filter((payment) => payment.status === 'success');
    return {
      totalTransactions: payments.length,
      successfulCount: successful.length,
      pendingCount: payments.filter((payment) => payment.status === 'pending').length,
      grossRevenue: successful.reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [payments]);

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      setVerifyingId(paymentId);
      const updated = await businessApi.verifyAdminPayment(paymentId);
      setPayments((current) =>
        current.map((payment) => (payment._id === paymentId ? updated : payment))
      );
      if (selectedPaymentId === paymentId) {
        setSelectedPaymentDetail(updated);
      }
      toast.success('Payment verified successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#1E1E1E] bg-[linear-gradient(180deg,#101214_0%,#0B0D10_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-[#FF6A2A]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Revenue Operations
            </p>
            <h1
              className="mt-3 text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Payments workspace
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8D9298]">
              Review transaction state, verify pending gateway sessions, and keep a
              live pulse on course revenue across the platform.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
            <MetricCard
              label="Gross revenue"
              value={loading ? '—' : formatCurrency(stats.grossRevenue)}
              icon={WalletCards}
            />
            <MetricCard
              label="Pending checks"
              value={loading ? '—' : String(stats.pendingCount)}
              icon={ReceiptText}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Transactions" value={loading ? '—' : String(stats.totalTransactions)} icon={CreditCard} />
        <MetricCard label="Verified payments" value={loading ? '—' : String(stats.successfulCount)} icon={BadgeCheck} />
        <MetricCard label="Pending" value={loading ? '—' : String(stats.pendingCount)} icon={ReceiptText} />
        <MetricCard label="Gateway" value="Live API" icon={WalletCards} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'success', 'failed'] as const).map((status) => (
          <Button
            key={status}
            variant={activeFilter === status ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114] p-0">
          <CardContent className="p-4 sm:p-5">
            {loading ? (
              <p className="py-10 text-center text-sm text-[#8C9198]">
                Loading transactions...
              </p>
            ) : filteredPayments.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#8C9198]">
                No payments match the current filter.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => {
                  const courseTitle =
                    payment.items[0]?.courseData?.title || 'Course purchase';
                  const studentName =
                    payment.studentData?.name || payment.studentData?.email || 'Learner';
                  const active = payment._id === selectedPayment?._id;

                  return (
                    <button
                      key={payment._id}
                      type="button"
                      onClick={() => setSelectedPaymentId(payment._id)}
                      className={`w-full rounded-[22px] border p-4 text-left transition-all ${
                        active
                          ? 'border-[#FF6A2A]/50 bg-[#171A1F]'
                          : 'border-[#1C2026] bg-[#111418] hover:border-[#2A3038] hover:bg-[#151920]'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                payment.status === 'success'
                                  ? 'success'
                                  : payment.status === 'failed'
                                    ? 'error'
                                    : 'warning'
                              }
                            >
                              {payment.status}
                            </Badge>
                            <Badge className="border-[#28323D] bg-[#12161B] text-[#A9BAC7]">
                              {payment.type}
                            </Badge>
                          </div>
                          <p className="text-lg font-medium text-[#FAFAFA]">
                            {courseTitle}
                          </p>
                          <p className="mt-2 text-sm text-[#8C9198]">
                            {studentName} • {payment.orderId}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="text-right">
                            <p className="text-xl font-semibold text-[#FAFAFA]">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-xs text-[#6E7782]">
                              {formatDate(payment.createdAt)}
                            </p>
                          </div>
                          {payment.status === 'pending' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleVerifyPayment(payment._id);
                              }}
                              disabled={verifyingId === payment._id}
                              className="rounded-[14px]"
                            >
                              {verifyingId === payment._id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                'Verify'
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114] p-0">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E7782]">
                Transaction detail
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-[#FAFAFA]"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {selectedPaymentDetail?.items[0]?.courseData?.title ||
                  selectedPayment?.items[0]?.courseData?.title ||
                  'Select a payment'}
              </h2>
            </div>

            {selectedPayment ? (
              <>
                {detailLoading ? (
                  <p className="text-sm text-[#8E949B]">Loading payment detail...</p>
                ) : null}
                <DetailRow
                  label="Status"
                  value={selectedPaymentDetail?.status || selectedPayment.status}
                />
                <DetailRow
                  label="Order ID"
                  value={selectedPaymentDetail?.orderId || selectedPayment.orderId}
                />
                <DetailRow
                  label="Learner"
                  value={
                    selectedPaymentDetail?.studentData?.email ||
                    selectedPayment.studentData?.email ||
                    selectedPayment.student
                  }
                />
                <DetailRow
                  label="Transaction ID"
                  value={
                    selectedPaymentDetail?.transactionId ||
                    selectedPayment.transactionId ||
                    'Awaiting verification'
                  }
                />
                <DetailRow
                  label="Paid at"
                  value={formatDate(
                    selectedPaymentDetail?.paidAt ||
                      selectedPaymentDetail?.createdAt ||
                      selectedPayment.paidAt ||
                      selectedPayment.createdAt
                  )}
                />
                <DetailRow
                  label="Amount"
                  value={formatCurrency(selectedPaymentDetail?.amount || selectedPayment.amount)}
                />
                <DetailRow
                  label="Refund state"
                  value={selectedPaymentDetail?.refundStatus || selectedPayment.refundStatus || 'none'}
                />
                <DetailRow
                  label="Items"
                  value={String(
                    selectedPaymentDetail?.items.length || selectedPayment.items.length
                  )}
                />

                <div className="rounded-[22px] border border-[#1E1E1E] bg-[#12161B] p-4 text-sm text-[#8E949B]">
                  {(selectedPaymentDetail?.status || selectedPayment.status) === 'pending'
                    ? 'This order is waiting for a final verification signal. Admin can manually verify it if the gateway settled outside the callback flow.'
                    : (selectedPaymentDetail?.status || selectedPayment.status) === 'success'
                      ? 'Payment verified successfully. Course access should already be attached to the learner account.'
                      : 'This payment did not complete successfully. Learner may retry checkout.'}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#8E949B]">
                Pick a transaction from the left to review its gateway state and
                metadata.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-[24px] border-[#1D2025] bg-[#101317]">
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm text-[#858C95]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#FAFAFA]">{value}</p>
        </div>
        <div className="rounded-[18px] border border-[#242A31] bg-[#151A21] p-3 text-[#FF6A2A]">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#1A1D22] pb-4 text-sm">
      <span className="text-[#858C95]">{label}</span>
      <span className="max-w-[220px] break-all text-right font-medium text-[#FAFAFA]">
        {value}
      </span>
    </div>
  );
}
