import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type PaymentStatusPageProps = {
  searchParams?: {
    status?: string;
    orderId?: string;
    txnId?: string;
  };
};

const statusCopy = {
  success: {
    title: 'Payment confirmed',
    description:
      'Your payment has been verified and course access is being attached to your learner account.',
    icon: CheckCircle2,
    tone: 'text-[#4ADE80]',
    border: 'border-[#1C5A34]',
    background: 'bg-[rgba(12,28,19,0.86)]',
  },
  failed: {
    title: 'Payment needs attention',
    description:
      'The gateway did not confirm this payment. You can retry checkout or review the order details below.',
    icon: ShieldAlert,
    tone: 'text-[#F59E0B]',
    border: 'border-[#6A4313]',
    background: 'bg-[rgba(34,20,8,0.82)]',
  },
  pending: {
    title: 'Payment is processing',
    description:
      'We are waiting for the final gateway signal. If you just paid, give it a moment and refresh the page.',
    icon: Clock3,
    tone: 'text-[#60A5FA]',
    border: 'border-[#224466]',
    background: 'bg-[rgba(8,18,30,0.84)]',
  },
} as const;

export default function PaymentStatusPage({ searchParams }: PaymentStatusPageProps) {
  const normalizedStatus =
    searchParams?.status === 'success' || searchParams?.status === 'failed'
      ? searchParams.status
      : 'pending';

  const content = statusCopy[normalizedStatus];
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12 text-[#FAFAFA]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p
            className="text-[11px] uppercase tracking-[0.22em] text-[#8A8A8A]"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Payment Status
          </p>
          <h1
            className="mt-4 text-4xl font-semibold sm:text-5xl"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Gateway <span className="text-[#FF6A2A]">Response</span>
          </h1>
        </div>

        <section
          className={`overflow-hidden rounded-[32px] border ${content.border} ${content.background}`}
        >
          <div className="border-b border-white/10 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full border border-white/10 bg-black/20 p-4">
                  <Icon className={`h-8 w-8 ${content.tone}`} />
                </div>
                <div>
                  <h2
                    className="text-2xl font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {content.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#B7B7B7]">
                    {content.description}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full border border-white/10 px-4 py-2 text-sm font-medium capitalize ${content.tone}`}
              >
                {normalizedStatus}
              </span>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
            <StatusTile
              label="Order ID"
              value={searchParams?.orderId || 'Not provided by gateway'}
            />
            <StatusTile
              label="Transaction ID"
              value={searchParams?.txnId || 'Awaiting provider confirmation'}
            />
          </div>

          <div className="flex flex-wrap gap-3 px-6 pb-8 sm:px-8">
            <Link href="/student/courses">
              <Button variant="primary" className="rounded-[16px] px-6 py-3">
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/student/enrolled">
              <Button
                variant="secondary"
                className="rounded-[16px] border-[#2A2A2A] bg-[#111111]"
              >
                My learning
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/15 px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A8A8A]">
        {label}
      </p>
      <p className="mt-3 break-all text-sm font-medium leading-7 text-[#F2F2F2]">
        {value}
      </p>
    </div>
  );
}
