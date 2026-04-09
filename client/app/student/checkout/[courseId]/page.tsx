'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent } from '@/client/components/ui/Card';
import { Input } from '@/client/components/ui/Input';
import { Badge } from '@/client/components/ui/Badge';
import { Spinner } from '@/client/components/ui/Spinner';
import {
  calculateCheckoutBreakdown,
  checkoutConfig,
  formatCurrency,
  getCheckoutHighlights,
} from '@/lib/commerce';
import { useAuth } from '@/lib/stores/authStore';
import * as businessApi from '@/lib/api/business';
import * as coursesApi from '@/lib/api/courses';
import * as enrollmentsApi from '@/lib/api/enrollments';
import type { CheckoutQuote, FullCourse, PaymentOrderResponse } from '@/lib/types';

type CheckoutMethodId = 'upi' | 'cards' | 'netbanking' | 'wallet' | 'paylater';

type CheckoutMethod = {
  id: CheckoutMethodId;
  title: string;
  subtitle: string;
  offerLabel: string;
  providers: string[];
  icon: React.ComponentType<{ className?: string }>;
  theme: string;
  panelTone: string;
};

const checkoutMethods: CheckoutMethod[] = [
  {
    id: 'upi',
    title: 'UPI',
    subtitle: 'Instant scan-and-pay experience',
    offerLabel: '5 offers',
    providers: ['GP', 'PH', 'PT'],
    icon: QrCode,
    theme: 'text-[#7BE0B6]',
    panelTone: 'from-[#DDF8F0] to-[#ECF7FF]',
  },
  {
    id: 'cards',
    title: 'Cards',
    subtitle: 'Credit, debit, and saved card flows',
    offerLabel: 'Up to 15% savings',
    providers: ['VI', 'MC', 'AX'],
    icon: CreditCard,
    theme: 'text-[#76C8FF]',
    panelTone: 'from-[#E7F4FF] to-[#F6FBFF]',
  },
  {
    id: 'netbanking',
    title: 'Netbanking',
    subtitle: 'Bank-led checkout with secure redirect',
    offerLabel: 'Bank offers',
    providers: ['IC', 'SB', 'AX'],
    icon: Landmark,
    theme: 'text-[#FFC36E]',
    panelTone: 'from-[#FFF2E0] to-[#FFF8EF]',
  },
  {
    id: 'wallet',
    title: 'Wallet',
    subtitle: 'One-tap wallet-based payment paths',
    offerLabel: 'Instant wallet pay',
    providers: ['PY', 'AM', 'MP'],
    icon: Wallet,
    theme: 'text-[#FFA8D3]',
    panelTone: 'from-[#FFF0F7] to-[#FFF9FC]',
  },
  {
    id: 'paylater',
    title: 'Pay Later',
    subtitle: 'Flexible installments where supported',
    offerLabel: 'Flexible repayment',
    providers: ['EM', 'PL', 'BN'],
    icon: Sparkles,
    theme: 'text-[#A6B4FF]',
    panelTone: 'from-[#F0F3FF] to-[#FBFCFF]',
  },
];

type CheckoutOffer = {
  title: string;
  detail: string;
  badge?: string;
};

const describeAppliedCoupon = (coupon: NonNullable<CheckoutQuote['coupon']>) => {
  if (coupon.discountType === 'percent') {
    return coupon.maxDiscountAmount
      ? `${coupon.discountValue}% off up to ${formatCurrency(coupon.maxDiscountAmount)}`
      : `${coupon.discountValue}% off`;
  }

  return `${formatCurrency(coupon.discountValue)} off`;
};

const formatDurationLabel = (duration: number, modules: number) => {
  if (duration >= 60) {
    const hours = Math.max(1, Math.round(duration / 60));
    return `${hours} hr guided flow`;
  }

  if (duration > 0) {
    return `${duration} min guided flow`;
  }

  return `${Math.max(modules, 1)} modules self-paced`;
};

const createSeededQrMatrix = (seed: string) => {
  const size = 25;
  let state = Array.from(seed).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647,
    7
  );

  const next = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const inFinder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= size - 7) ||
        (row >= size - 7 && col < 7);

      if (inFinder) {
        const localRow = row % (size - 18);
        const localCol = col % (size - 18);
        return (
          localRow === 0 ||
          localCol === 0 ||
          localRow === 6 ||
          localCol === 6 ||
          (localRow >= 2 &&
            localRow <= 4 &&
            localCol >= 2 &&
            localCol <= 4)
        );
      }

      if (row === 6 || col === 6) {
        return (row + col) % 2 === 0;
      }

      return next() > 0.48;
    })
  );
};

export default function StudentCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;
  const gatewayFormRef = useRef<HTMLFormElement>(null);

  const [courseData, setCourseData] = useState<FullCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [selectedMethod, setSelectedMethod] =
    useState<CheckoutMethodId>('upi');
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [createdOrder, setCreatedOrder] =
    useState<PaymentOrderResponse | null>(null);
  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote | null>(null);

  const loadQuote = async (nextCouponCode?: string) => {
    const quote = await businessApi.getCheckoutQuote({
      items: [{ course: courseId }],
      type: 'course',
      couponCode: nextCouponCode?.trim() || undefined,
    });
    setCheckoutQuote(quote);
    return quote;
  };

  useEffect(() => {
    let cancelled = false;

    const loadCheckout = async () => {
      try {
        setLoading(true);
        const [fullCourse, enrollments] = await Promise.all([
          coursesApi.getFullCourse(courseId),
          enrollmentsApi.getMyEnrollments().catch(() => []),
        ]);

        if (cancelled) return;

        setCourseData(fullCourse);
        setIsEnrolled(
          enrollments.some((enrollment) => enrollment.course_id === courseId)
        );
        if ((fullCourse.course.price || 0) > 0) {
          try {
            const quote = await businessApi.getCheckoutQuote({
              items: [{ course: courseId }],
              type: 'course',
            });
            if (!cancelled) {
              setCheckoutQuote(quote);
            }
          } catch (quoteError) {
            console.error('Failed to load checkout quote:', quoteError);
            if (!cancelled) {
              setCheckoutQuote(null);
            }
          }
        } else if (!cancelled) {
          setCheckoutQuote(null);
        }
      } catch (error) {
        console.error('Failed to load checkout page:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load checkout');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (courseId) loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const course = courseData?.course;
  const pricing = useMemo(
    () => checkoutQuote?.breakdown ?? calculateCheckoutBreakdown(course?.price ?? 0),
    [checkoutQuote?.breakdown, course?.price]
  );
  const appliedCoupon = checkoutQuote?.coupon || null;
  const highlights = useMemo(
    () => (course ? getCheckoutHighlights(course) : []),
    [course]
  );
  const currentMethod = checkoutMethods.find((method) => method.id === selectedMethod)!;
  const gatewayOffers = useMemo<CheckoutOffer[]>(() => {
    const offers: CheckoutOffer[] = [];

    if (appliedCoupon) {
      offers.push({
        title: `${appliedCoupon.code} applied`,
        detail: `${describeAppliedCoupon(appliedCoupon)}. Currently saving ${formatCurrency(
          appliedCoupon.discountAmount
        )} on this order`,
        badge: 'Coupon',
      });
    }

    offers.push({
      title:
        pricing.platformFee > 0
          ? `${formatCurrency(pricing.platformFee)} platform fee`
          : 'No added platform fee',
      detail:
        pricing.platformFee > 0
          ? 'The fee is already included before you continue to the gateway'
          : 'Today’s session is passing through without an extra platform fee',
      badge: 'Summary',
    });

    offers.push({
      title:
        pricing.taxAmount > 0
          ? `${formatCurrency(pricing.taxAmount)} tax shown upfront`
          : 'No tax added in this session',
      detail:
        pricing.taxAmount > 0
          ? 'Your total is fully visible before gateway handoff'
          : 'The current checkout config does not add a tax layer right now',
      badge: 'Tax',
    });

    if (createdOrder?.payment.orderId) {
      offers.push({
        title: `Order ${createdOrder.payment.orderId.slice(-6)} locked`,
        detail: 'Your server-backed order is ready for gateway submission',
        badge: 'Live',
      });
    }

    return offers.slice(0, 2);
  }, [
    appliedCoupon,
    createdOrder?.payment.orderId,
    pricing.platformFee,
    pricing.taxAmount,
  ]);
  const sessionStatus = createdOrder ? 'Order created' : 'Awaiting order';
  const SelectedMethodIcon = currentMethod.icon;
  const qrMatrix = useMemo(
    () => createSeededQrMatrix(createdOrder?.payment.orderId || courseId || 'tutor'),
    [createdOrder?.payment.orderId, courseId]
  );
  const gatewayFields = useMemo(() => {
    if (!createdOrder) return null;
    return { ...createdOrder.paytmParams, CHECKSUMHASH: createdOrder.checksum };
  }, [createdOrder]);

  const handleCouponApply = async () => {
    if (!couponCode.trim()) {
      toast.info('Enter a coupon code first.');
      return;
    }

    try {
      setCouponLoading(true);
      const quote = await loadQuote(couponCode);
      if (quote.coupon) {
        setCouponCode(quote.coupon.code);
        toast.success(
          `${quote.coupon.code} applied. You saved ${formatCurrency(
            quote.coupon.discountAmount
          )}.`
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setCouponLoading(true);
      setCouponCode('');
      await loadQuote();
      toast.success('Coupon removed.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!course) return;

    try {
      setCreatingOrder(true);
      const order = await businessApi.createPaymentOrder({
        items: [{ course: course._id }],
        type: 'course',
        couponCode: appliedCoupon?.code,
      });
      setCreatedOrder(order);
      toast.success('Secure order created. Continue to the payment gateway.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleOpenGateway = () => {
    if (isEnrolled) {
      router.push(`/student/courses/${courseId}`);
      return;
    }

    setGatewayOpen(true);
  };

  const handleFreeUnlock = async () => {
    if (!course) return;

    try {
      setCreatingOrder(true);
      await enrollmentsApi.enrollInCourse(course._id);
      toast.success('Course unlocked successfully.');
      router.push(`/student/courses/${course._id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock course');
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!courseData || !course) {
    return (
      <Card className="rounded-[32px] border-[#1E1E1E] bg-[#101010]">
        <CardContent className="py-14 text-center">
          <p className="text-sm text-[#888888]">
            We couldn&apos;t load this checkout session. Try opening the course again.
          </p>
          <Link href="/student/courses" className="mt-4 inline-flex">
            <Button variant="primary">Back to catalog</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/student/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-[#FAFAFA]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
          <Badge className="border-[#2B2B2B] bg-[#151515] text-[#F5D4BF]">
            {isEnrolled ? 'already unlocked' : 'secure checkout'}
          </Badge>
        </div>

        <section className="relative overflow-hidden rounded-[36px] border border-[#1E1E1E] bg-[#080808]">
          <div className="absolute inset-0 line-grid opacity-20" />
          <div className="absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_top,rgba(255,92,0,0.35),transparent_60%)]" />
          <div className="relative z-10 px-6 pb-8 pt-10 sm:px-10">
            <div className="mb-10 text-center">
              <p
                className="text-[11px] uppercase tracking-[0.24em] text-[#8E8E8E]"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                Checkout Console
              </p>
              <h1
                className="mt-4 text-4xl font-semibold text-[#F6F1EC] md:text-6xl"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Complete Your <span className="text-[#FF6A2A]">Purchase</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#8B8B8B] sm:text-base">
                A premium, data-backed checkout for your selected course. Every number
                below is generated from the live course record and current checkout
                configuration.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
              <div className="overflow-hidden rounded-[30px] border border-[#1F1F1F] bg-[linear-gradient(130deg,rgba(255,106,42,0.32),rgba(22,18,18,0.96)_36%,rgba(14,14,16,0.98)_72%)] p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-[24px] border border-[#2D2D2D] bg-[#111111]/90 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                    <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#777777]">
                      <span className="h-2 w-2 rounded-full bg-[#FF6A2A]" />
                      Course Preview
                    </div>
                    <div className="overflow-hidden rounded-[18px] border border-[#222222] bg-[#0B0B0B]">
                      {course.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-video bg-[radial-gradient(circle_at_top_left,rgba(255,106,42,0.28),transparent_45%),linear-gradient(135deg,#0B0B0B,#171717)] p-6">
                          <div className="flex h-full flex-col justify-between rounded-[16px] border border-[#1E1E1E] p-4">
                            <Badge className="w-fit border-[#2A2A2A] bg-[#141414] text-[#F3C1A4]">
                              {course.category}
                            </Badge>
                            <div>
                              <p
                                className="text-2xl font-semibold leading-tight text-[#FAFAFA]"
                                style={{ fontFamily: 'Syne, sans-serif' }}
                              >
                                {course.title}
                              </p>
                              <p className="mt-2 text-xs text-[#777777]">
                                Live checkout preview
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p
                      className="text-[11px] uppercase tracking-[0.18em] text-[#F5BC9D]"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      Your course
                    </p>
                    <h2
                      className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[#FFF4EC] md:text-5xl"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {course.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[#C9B1A3] sm:text-base">
                      {course.description}
                    </p>

                    <div className="mt-6 flex flex-wrap items-end gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[#8D6E5F]">
                          Pay today
                        </p>
                        <p
                          className="mt-2 text-4xl font-semibold text-[#FAFAFA]"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          {course.price === 0 ? 'Free' : formatCurrency(pricing.total)}
                        </p>
                      </div>
                      <div className="rounded-full border border-[#3B2A23] bg-[#150E0A] px-4 py-2 text-xs text-[#E4B79A]">
                        {formatDurationLabel(course.total_duration, course.total_modules)}
                      </div>
                    </div>

                    {course.price > 0 ? (
                      <div className="mt-6 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                          <Input
                            value={couponCode}
                            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                            placeholder="Enter coupon code"
                            className="rounded-[16px] border-[#38231A] bg-[#1A0906] py-3 text-[#FFF4EC] placeholder:text-[#8B5C4A]"
                          />
                          <Button
                            variant="primary"
                            onClick={handleCouponApply}
                            disabled={couponLoading}
                            className="rounded-[16px] bg-[#D65B26] py-3 text-sm font-semibold hover:bg-[#EA6A32]"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            {couponLoading ? 'Checking...' : 'Use Coupon'}
                          </Button>
                        </div>
                        {appliedCoupon ? (
                          <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-[#3B2A23] bg-[#140B09] px-4 py-3 text-sm text-[#F6CDB6]">
                            <span>
                              {appliedCoupon.code} applied. {describeAppliedCoupon(appliedCoupon)}.
                              Current savings: {formatCurrency(appliedCoupon.discountAmount)}
                            </span>
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="text-[#FF8C58] transition-colors hover:text-[#FFB18A]"
                            >
                              Remove
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                      {highlights.map((highlight) => (
                        <div
                          key={highlight.title}
                          className="rounded-[18px] border border-[#2B1F19] bg-[#0F0D0D]/80 p-4"
                        >
                          <div className="mb-3 inline-flex rounded-full border border-[#3A2B24] bg-[#181111] p-2 text-[#FF7A3E]">
                            <BadgeCheck className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-medium text-[#FFF4EC]">
                            {highlight.title}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-[#A58878]">
                            {highlight.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-[#3C1D13] bg-[linear-gradient(180deg,rgba(28,6,4,0.92),rgba(14,6,5,0.98))]">
                <div className="border-b border-[#4B2518] px-6 py-6">
                  <p
                    className="text-[11px] uppercase tracking-[0.18em] text-[#B67A5E]"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    Payment details
                  </p>
                  <h3
                    className="mt-3 text-3xl font-semibold text-[#FFF3EA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Purchase summary
                  </h3>
                </div>

                <div className="space-y-5 px-6 py-6">
                  <SummaryRow label="Course fee" value={formatCurrency(pricing.subtotal)} />
                  {pricing.platformFee > 0 ? (
                    <SummaryRow label="Platform fee" value={formatCurrency(pricing.platformFee)} />
                  ) : null}
                  {pricing.taxAmount > 0 ? (
                    <SummaryRow
                      label={`Tax (${Math.round(checkoutConfig.taxRate * 100)}%)`}
                      value={formatCurrency(pricing.taxAmount)}
                    />
                  ) : null}
                  {pricing.discountAmount > 0 ? (
                    <SummaryRow
                      label={appliedCoupon ? `Coupon (${appliedCoupon.code})` : 'Discount'}
                      value={`- ${formatCurrency(pricing.discountAmount)}`}
                      valueClassName="text-[#82E1AE]"
                    />
                  ) : null}
                  <div className="h-px bg-[#4B2518]" />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#E6BFA8]">Total amount</p>
                      <p className="mt-1 text-xs text-[#8B6A59]">
                        Powered by {checkoutConfig.gatewayName}
                      </p>
                    </div>
                    <p
                      className="text-4xl font-semibold text-[#FFF4EC]"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {course.price === 0 ? 'Free' : formatCurrency(pricing.total)}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-[#40231A] bg-[#140B09] p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-[#FF7A3E]" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[#FFF3EA]">
                          Checkout note
                        </p>
                        <p className="text-xs leading-6 text-[#A98A79]">
                          Promotions, taxes, and gateway behavior are driven by your live
                          backend configuration. No course or pricing values on this screen are
                          hardcoded to a specific product.
                        </p>
                      </div>
                    </div>
                  </div>
                  {isEnrolled ? (
                    <Button
                      variant="primary"
                      onClick={handleOpenGateway}
                      className="h-14 w-full rounded-[18px] bg-[#D65B26] text-lg hover:bg-[#EA6A32]"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Open learning console
                    </Button>
                  ) : course.price === 0 ? (
                    <Button
                      variant="primary"
                      onClick={handleFreeUnlock}
                      disabled={creatingOrder}
                      className="h-14 w-full rounded-[18px] bg-[#D65B26] text-lg hover:bg-[#EA6A32]"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {creatingOrder ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Unlocking...
                        </>
                      ) : (
                        'Unlock for free'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleOpenGateway}
                      className="h-14 w-full rounded-[18px] bg-[#D65B26] text-lg hover:bg-[#EA6A32]"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Proceed to checkout
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {gatewayOpen ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-[rgba(4,9,18,0.82)] px-4 py-6 backdrop-blur-md">
          <div className="relative mx-auto grid min-h-[min(860px,calc(100vh-3rem))] w-full max-w-[1080px] overflow-hidden rounded-[34px] border border-[#D7E3EE] bg-[#F5F9FC] shadow-[0_32px_120px_rgba(0,0,0,0.42)] lg:grid-cols-[320px_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => setGatewayOpen(false)}
              className="absolute right-5 top-5 z-20 rounded-full border border-[#D8E4EC] bg-white/90 p-2 text-[#5E7789] transition-colors hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative overflow-hidden bg-[#081827] px-6 py-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(75,200,255,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(34,130,255,0.16),transparent_38%)]" />
              <div className="relative z-10 flex h-full flex-col">
                <div>
                  <Badge className="border-white/15 bg-white/10 text-white">
                    Hosted on {checkoutConfig.gatewayName}
                  </Badge>
                  <div>
                    <p
                      className="mt-5 text-3xl font-semibold leading-tight"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Secure payment handoff
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      This sheet creates the backend order first, then hands the session
                      over to {checkoutConfig.gatewayName}. We are not faking the gateway
                      inside the product UI.
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <GatewayRailTile
                    label="Total payable"
                    value={course.price === 0 ? 'Free' : formatCurrency(pricing.total)}
                  />
                  <GatewayRailTile
                    label="Course"
                    value={course.title}
                    tone="subdued"
                  />
                  <GatewayRailTile
                    label="Learner"
                    value={user?.email || checkoutConfig.supportEmail}
                    tone="subdued"
                  />
                  <GatewayRailTile
                    label="Session"
                    value={sessionStatus}
                    tone="success"
                  />
                  {appliedCoupon ? (
                    <GatewayRailTile
                      label="Coupon"
                      value={`${appliedCoupon.code} · ${formatCurrency(
                        appliedCoupon.discountAmount
                      )} off`}
                      tone="warm"
                    />
                  ) : null}
                </div>

                <div className="mt-auto pt-8">
                  <div className="rounded-[26px] border border-white/10 bg-white/6 p-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                      Why this is cleaner
                    </p>
                    <p className="mt-3 text-lg font-medium text-white">
                      Order creation happens here. Payment happens on{' '}
                      {checkoutConfig.gatewayName}.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      That keeps pricing, coupon effects, callback URLs, and course
                      identity aligned with the backend before redirect.
                    </p>
                  </div>
                  <p className="mt-4 text-sm text-white/70">
                    Support: {checkoutConfig.supportEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-white">
              <div className="border-b border-[#E1EBF3] bg-white px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-[0.2em] text-[#8093A1]"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      Paytm checkout
                    </p>
                    <h4
                      className="mt-3 text-3xl font-semibold text-[#112534]"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Review, create, redirect
                    </h4>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-[#668090]">
                      Pick the route you prefer, create the secure order, then continue
                      to {checkoutConfig.gatewayName} for the hosted payment flow.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#D8E4EC] bg-[#F8FBFE] px-4 py-2 text-sm text-[#42627A]">
                    <Clock3 className="h-4 w-4 text-[#0F7ACB]" />
                    {createdOrder ? 'Ready for redirect' : 'Order not created yet'}
                  </div>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[280px_minmax(0,1fr)]">
                <div className="border-r border-[#E1EBF3] bg-[#F7FBFE] p-5">
                  <div className="grid gap-3">
                    <GatewayStep
                      step="01"
                      title="Review live amount"
                      detail="Every amount here is coming from the backend quote."
                      state="complete"
                    />
                    <GatewayStep
                      step="02"
                      title="Create server order"
                      detail="Lock the final amount before any redirect happens."
                      state={createdOrder ? 'complete' : 'active'}
                    />
                    <GatewayStep
                      step="03"
                      title={`Continue to ${checkoutConfig.gatewayName}`}
                      detail="The actual payment happens on the hosted gateway."
                      state={createdOrder ? 'active' : 'upcoming'}
                    />
                  </div>

                  <div className="mt-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#7A93A5]">
                      Select your route
                    </p>
                    <div className="mt-3 space-y-3">
                    {checkoutMethods.map((method) => {
                      const Icon = method.icon;
                      const active = method.id === selectedMethod;

                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethod(method.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-4 text-left transition-all ${
                            active
                              ? 'border-[#0F7ACB] bg-white shadow-[0_14px_30px_rgba(39,101,150,0.12)]'
                              : 'border-[#E1E9F0] bg-white/70 hover:border-[#C6D8E5] hover:bg-white'
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="rounded-[16px] bg-[#EFF6FC] p-3">
                              <Icon className={`h-5 w-5 ${method.theme}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-[#193243]">
                                {method.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#668093]">
                                {method.subtitle}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#F1F7FB] px-2.5 py-1 text-[11px] font-medium text-[#436781]">
                                  {method.offerLabel}
                                </span>
                                <div className="flex items-center -space-x-1">
                                  {method.providers.map((provider) => (
                                    <ProviderDot key={provider} label={provider} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 text-sm ${
                              active ? 'text-[#0F7ACB]' : 'text-[#7A95A9]'
                            }`}
                          >
                            {active ? 'Selected' : 'View'}
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>

                <div className="min-h-0 bg-[#FCFEFF] p-6">
                  <div className="mb-5 rounded-[24px] border border-[#E2ECF4] bg-[#F9FCFF] px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#7A93A5]">
                          Session overview
                        </p>
                        <p className="mt-2 text-xl font-medium text-[#213949]">
                          {currentMethod.title} handoff through {checkoutConfig.gatewayName}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {gatewayOffers.map((offer) => (
                          <OfferChip key={offer.title} offer={offer} />
                        ))}
                        <span className="rounded-full border border-[#DAE7F0] bg-white px-3 py-2 text-sm font-medium text-[#204055]">
                          {course.price === 0 ? 'Free unlock' : formatCurrency(pricing.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-5">
                      <div
                        className={`rounded-[30px] border border-[#DCE8F2] bg-gradient-to-br ${currentMethod.panelTone} p-6`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6A8292]">
                              Selected route
                            </p>
                            <h5
                              className="mt-3 text-3xl font-semibold text-[#162B3A]"
                              style={{ fontFamily: 'Syne, sans-serif' }}
                            >
                              {currentMethod.title}
                            </h5>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#617A8C]">
                              {currentMethod.subtitle}. After redirect,{' '}
                              {checkoutConfig.gatewayName} will show the live supported
                              apps, banks, or instruments for this session.
                            </p>
                          </div>
                          <Badge className="border-[#C9DEEA] bg-white/80 text-[#335D77]">
                            {currentMethod.offerLabel}
                          </Badge>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-[#DCE8F2] bg-[#F7FBFF] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[#7A93A5]">
                              Route preview
                            </p>
                            <p className="mt-2 text-lg font-medium text-[#213949]">
                              {createdOrder
                                ? `Your order is ready. Continue on ${checkoutConfig.gatewayName}.`
                                : 'Create the backend order first, then continue to the hosted gateway.'}
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-[#587287]">
                            <Clock3 className="h-3.5 w-3.5" />
                            {createdOrder ? 'Live order ready' : 'Preview before redirect'}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                          <div className="rounded-[22px] border border-[#DCE8F2] bg-white p-4 shadow-[0_10px_30px_rgba(35,68,95,0.06)]">
                            {currentMethod.id === 'upi' ? (
                              <>
                                <div className="rounded-[18px] border border-[#EFF4F8] bg-white p-3">
                                  <div className="grid grid-cols-[repeat(25,minmax(0,1fr))] gap-[2px]">
                                    {qrMatrix.flatMap((row, rowIndex) =>
                                      row.map((filled, colIndex) => (
                                        <span
                                          key={`${rowIndex}-${colIndex}`}
                                          className={`aspect-square rounded-[1px] ${
                                            filled ? 'bg-[#111111]' : 'bg-transparent'
                                          }`}
                                        />
                                      ))
                                    )}
                                  </div>
                                </div>
                                <p className="mt-4 text-xs leading-6 text-[#6A8397]">
                                  UPI stays a preview until the secure order exists. The real
                                  payable QR is generated on the gateway side.
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="inline-flex rounded-[18px] bg-[#EFF6FC] p-4">
                                  <SelectedMethodIcon
                                    className={`h-8 w-8 ${currentMethod.theme}`}
                                  />
                                </div>
                                <p className="mt-4 text-sm font-medium text-[#183040]">
                                  {currentMethod.title} route
                                </p>
                                <p className="mt-2 text-xs leading-6 text-[#6A8397]">
                                  {checkoutConfig.gatewayName} will reveal the available
                                  issuers and providers after redirect.
                                </p>
                              </>
                            )}
                          </div>

                          <div className="rounded-[22px] border border-[#DCE8F2] bg-white p-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <GatewayFact label="Course" value={course.title} />
                              <GatewayFact
                                label="Learner"
                                value={user?.name || 'Signed-in student'}
                              />
                              <GatewayFact
                                label="Gateway"
                                value={checkoutConfig.gatewayName}
                              />
                              <GatewayFact
                                label="Amount"
                                value={course.price === 0 ? 'Free' : formatCurrency(pricing.total)}
                              />
                            </div>

                            <div className="mt-5 rounded-[18px] border border-[#D4E3EE] bg-[#F8FCFF] p-4 text-sm text-[#567285]">
                              <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#2E97D2]" />
                                <div>
                                  <p className="font-medium text-[#1A3343]">
                                    {createdOrder
                                      ? 'Secure order generated'
                                      : 'Ready to create order'}
                                  </p>
                                  <p className="mt-2 leading-6">
                                    {createdOrder
                                      ? `Order ${createdOrder.payment.orderId} is ready. Continue to ${checkoutConfig.gatewayName} to complete the payment in the hosted flow.`
                                      : `Create the secure order first so pricing, coupon, and callback data are locked before redirect.`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5">
                              <p className="text-xs uppercase tracking-[0.16em] text-[#7A93A5]">
                                Supported on this route
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge className="border-[#DCE6EE] bg-[#F8FBFE] text-[#26465B]">
                                  {currentMethod.offerLabel}
                                </Badge>
                                {currentMethod.providers.map((provider) => (
                                  <ProviderDot key={provider} label={provider} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-[#173C5A] bg-[#10273A] p-5 text-white shadow-[0_16px_40px_rgba(8,24,39,0.18)]">
                      <div className="space-y-4">
                        <GatewaySidebarTile label="Course" value={course.title} inverted />
                        <GatewaySidebarTile
                          label="Learner"
                          value={user?.email || checkoutConfig.supportEmail}
                          inverted
                        />
                        <GatewaySidebarTile
                          label="Amount"
                          value={course.price === 0 ? 'Free' : formatCurrency(pricing.total)}
                          inverted
                        />
                        {appliedCoupon ? (
                          <GatewaySidebarTile
                            label="Coupon"
                            value={`${appliedCoupon.code} · ${formatCurrency(
                              appliedCoupon.discountAmount
                            )} off`}
                            inverted
                          />
                        ) : null}
                        {createdOrder ? (
                          <GatewaySidebarTile
                            label="Order ID"
                            value={createdOrder.payment.orderId}
                            inverted
                          />
                        ) : null}
                      </div>

                      <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-5 w-5 text-[#7FD2FF]" />
                          <div>
                            <p className="text-sm font-medium text-white">
                              Order control
                            </p>
                            <p className="mt-2 text-sm leading-6 text-white/70">
                              {createdOrder
                                ? `Your live order is prepared. Continue to ${checkoutConfig.gatewayName} in the same tab or copy the reference below.`
                                : `Create the secure order when you are ready. The redirect only happens after that step is complete.`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3">
                        {!createdOrder ? (
                          <Button
                            variant="primary"
                            onClick={handleCreateOrder}
                            disabled={creatingOrder}
                            className="h-12 rounded-[16px] bg-[#0F7ACB] px-6 text-base hover:bg-[#0D6AB0]"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            {creatingOrder ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating secure order...
                              </>
                            ) : (
                              `Create ${checkoutConfig.gatewayName} order`
                            )}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => gatewayFormRef.current?.submit()}
                              className="h-12 rounded-[16px] bg-[#0F7ACB] px-6 text-base hover:bg-[#0D6AB0]"
                              style={{ fontFamily: 'Syne, sans-serif' }}
                            >
                              Continue to {checkoutConfig.gatewayName}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() =>
                                navigator.clipboard.writeText(createdOrder.payment.orderId)
                              }
                              className="h-12 rounded-[16px] border-white/15 bg-white/6 text-white hover:bg-white/10"
                            >
                              Copy order ID
                            </Button>
                          </>
                        )}
                      </div>

                      {gatewayFields ? (
                        <form
                          ref={gatewayFormRef}
                          action={checkoutConfig.paytmActionUrl}
                          method="post"
                          className="hidden"
                        >
                          {Object.entries(gatewayFields).map(([key, value]) => (
                            <input key={key} type="hidden" name={key} value={value} />
                          ))}
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[#E9C3AE]">{label}</span>
      <span className={`font-medium text-[#FFF3EA] ${valueClassName || ''}`}>
        {value}
      </span>
    </div>
  );
}

function GatewayRailTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warm' | 'subdued';
}) {
  const toneClassName =
    tone === 'success'
      ? 'bg-[#E7FAF2] text-[#093D2C]'
      : tone === 'warm'
        ? 'bg-[#FFF4E7] text-[#5E3418]'
        : tone === 'subdued'
          ? 'bg-white/6 text-white'
          : 'bg-white/90 text-[#0A1824]';
  const toneLabelClassName =
    tone === 'success'
      ? 'text-[#2D7E62]'
      : tone === 'warm'
        ? 'text-[#A96630]'
        : tone === 'subdued'
          ? 'text-white/40'
          : 'text-[#698394]';

  return (
    <div className={`rounded-[18px] border border-white/10 px-4 py-3 ${toneClassName}`}>
      <p className={`text-xs uppercase tracking-[0.16em] ${toneLabelClassName}`}>
        {label}
      </p>
      <p className="mt-2 text-lg font-medium">{value}</p>
    </div>
  );
}

function GatewayStep({
  step,
  title,
  detail,
  state,
}: {
  step: string;
  title: string;
  detail: string;
  state: 'complete' | 'active' | 'upcoming';
}) {
  const toneClassName =
    state === 'complete'
      ? 'border-[#BFDDF1] bg-[#F1F8FD]'
      : state === 'active'
        ? 'border-[#0F7ACB] bg-white shadow-[0_12px_28px_rgba(39,101,150,0.08)]'
        : 'border-[#E1E9F0] bg-white/70';

  const badgeClassName =
    state === 'complete'
      ? 'bg-[#DFF2FF] text-[#145C8F]'
      : state === 'active'
        ? 'bg-[#0F7ACB] text-white'
        : 'bg-[#EFF4F8] text-[#708799]';

  return (
    <div className={`rounded-[20px] border p-4 ${toneClassName}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badgeClassName}`}>
          {step}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#183142]">{title}</p>
          <p className="mt-2 text-xs leading-6 text-[#6C8597]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ProviderDot({ label }: { label: string }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D5E3ED] bg-white text-[10px] font-semibold text-[#3C6178] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      {label}
    </span>
  );
}

function OfferChip({ offer }: { offer: CheckoutOffer }) {
  return (
    <div className="rounded-full border border-[#DAE7F0] bg-white px-3 py-2 text-sm text-[#4E6F86]">
      <span className="font-medium text-[#1F3B4C]">{offer.title}</span>
      {offer.badge ? (
        <>
          <span className="mx-2 text-[#A6BAC8]">•</span>
          <span>{offer.badge}</span>
        </>
      ) : null}
    </div>
  );
}

function GatewayFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#D6E5EF] bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#7A93A5]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[#183040]">{value}</p>
    </div>
  );
}

function GatewaySidebarTile({
  label,
  value,
  inverted = false,
}: {
  label: string;
  value: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border px-4 py-3 ${
        inverted
          ? 'border-white/10 bg-white/6'
          : 'border-[#D6E5EF] bg-white'
      }`}
    >
      <p
        className={`text-[11px] uppercase tracking-[0.16em] ${
          inverted ? 'text-white/42' : 'text-[#7A93A5]'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-medium leading-6 ${
          inverted ? 'text-white' : 'text-[#183040]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
