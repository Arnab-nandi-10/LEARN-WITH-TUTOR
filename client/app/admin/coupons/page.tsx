'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Ticket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import * as businessApi from '@/lib/api/business';
import { formatCurrency } from '@/lib/commerce';
import type { Coupon, CouponDiscountType } from '@/lib/types';

type CouponFormState = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  usageLimit: string;
  expiresAt: string;
};

const initialFormState: CouponFormState = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '0',
  usageLimit: '',
  expiresAt: '',
};

const isExpired = (coupon: Coupon) =>
  Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now());

const formatCouponSummary = (coupon: Pick<Coupon, 'discountType' | 'discountValue' | 'maxDiscountAmount'>) => {
  if (coupon.discountType === 'percent') {
    return coupon.maxDiscountAmount
      ? `${coupon.discountValue}% off up to ${formatCurrency(coupon.maxDiscountAmount)}`
      : `${coupon.discountValue}% off`;
  }

  return `${formatCurrency(coupon.discountValue)} off`;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponFormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);
        const couponData = await businessApi.getAllCoupons();
        setCoupons(couponData);
      } catch (error) {
        console.error('Failed to load coupons:', error);
        toast.error('Failed to load coupons.');
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const stats = useMemo(
    () => ({
      total: coupons.length,
      active: coupons.filter((coupon) => coupon.active && !isExpired(coupon)).length,
      expired: coupons.filter((coupon) => isExpired(coupon)).length,
      redeemed: coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0),
    }),
    [coupons]
  );

  const handleCreateCoupon = async () => {
    if (!form.code.trim() || !form.discountValue.trim()) {
      toast.error('Coupon code and discount value are required.');
      return;
    }

    try {
      setSaving(true);
      const coupon = await businessApi.createCoupon({
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : null,
        minOrderAmount: Number(form.minOrderAmount || 0),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
      });
      setCoupons((current) => [coupon, ...current]);
      setForm(initialFormState);
      toast.success('Coupon created successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCoupon = async (couponId: string) => {
    try {
      setMutatingId(couponId);
      const updated = await businessApi.toggleCouponStatus(couponId);
      setCoupons((current) =>
        current.map((coupon) => (coupon._id === couponId ? updated : coupon))
      );
      toast.success('Coupon status updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update coupon');
    } finally {
      setMutatingId(null);
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    const confirmed = window.confirm(`Delete coupon ${code}?`);

    if (!confirmed) {
      return;
    }

    try {
      setMutatingId(couponId);
      await businessApi.deleteCoupon(couponId);
      setCoupons((current) => current.filter((coupon) => coupon._id !== couponId));
      toast.success('Coupon deleted.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete coupon');
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#1E1E1E] bg-[linear-gradient(180deg,#111315_0%,#0C0E11_100%)] p-6 sm:p-8">
        <p
          className="text-[11px] uppercase tracking-[0.18em] text-[#FF6A2A]"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          Promotion Engine
        </p>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Manage checkout coupons
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8E8E8E]">
              Create reusable discount codes for the real checkout flow. Coupon
              validation now runs on the backend and the final charged amount uses the
              same server-side pricing rules.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
            <MetricCard label="Total coupons" value={loading ? '—' : String(stats.total)} />
            <MetricCard label="Active" value={loading ? '—' : String(stats.active)} />
            <MetricCard label="Expired" value={loading ? '—' : String(stats.expired)} />
            <MetricCard label="Redeemed" value={loading ? '—' : String(stats.redeemed)} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-[16px] border border-[#232830] bg-[#141920] p-3 text-[#FF6A2A]">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#8A9198]">New coupon</p>
                <h2
                  className="text-2xl font-semibold text-[#FAFAFA]"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Create offer
                </h2>
              </div>
            </div>

            <Input
              label="Coupon code"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="SAVE20"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Discount type
                </label>
                <select
                  value={form.discountType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      discountType: event.target.value as CouponDiscountType,
                    }))
                  }
                  className="w-full rounded-md border border-border bg-bg-elevated px-4 py-2.5 text-text-primary"
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <Input
                label="Discount value"
                type="number"
                min={0}
                value={form.discountValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discountValue: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Max discount cap"
                type="number"
                min={0}
                value={form.maxDiscountAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxDiscountAmount: event.target.value,
                  }))
                }
                helperText="Leave empty for full percentage discount. If you enter 20 here, the coupon will never reduce more than Rs.20."
              />
              <Input
                label="Minimum order"
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minOrderAmount: event.target.value,
                  }))
                }
              />
            </div>

            <div className="rounded-[18px] border border-[#1D2127] bg-[#12161B] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A9198]">
                Offer preview
              </p>
              <p className="mt-2 text-sm text-[#FAFAFA]">
                {form.discountValue
                  ? formatCouponSummary({
                      discountType: form.discountType,
                      discountValue: Number(form.discountValue || 0),
                      maxDiscountAmount: form.maxDiscountAmount
                        ? Number(form.maxDiscountAmount)
                        : null,
                    })
                  : 'Add a discount value to preview the final coupon behavior.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Usage limit"
                type="number"
                min={0}
                value={form.usageLimit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    usageLimit: event.target.value,
                  }))
                }
                helperText="Leave empty for unlimited."
              />
              <Input
                label="Expiry date"
                type="date"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt: event.target.value,
                  }))
                }
              />
            </div>

            <Button
              variant="primary"
              onClick={handleCreateCoupon}
              disabled={saving}
              className="w-full rounded-[16px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create coupon'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114] p-0">
          <CardContent className="p-5">
            {loading ? (
              <p className="py-10 text-center text-sm text-[#8A9198]">
                Loading coupons...
              </p>
            ) : coupons.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#8A9198]">
                No coupons created yet.
              </p>
            ) : (
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <div
                    key={coupon._id}
                    className="rounded-[24px] border border-[#1D2127] bg-[#12161B] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant={coupon.active ? 'success' : 'warning'}>
                            {coupon.active ? 'active' : 'inactive'}
                          </Badge>
                          {isExpired(coupon) ? <Badge variant="error">expired</Badge> : null}
                        </div>
                        <h3
                          className="text-xl font-semibold text-[#FAFAFA]"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          {coupon.code}
                        </h3>
                        <p className="mt-2 text-sm text-[#8A9198]">
                          {formatCouponSummary(coupon)}
                        </p>
                      </div>

                      <div className="grid gap-2 text-right text-sm text-[#8A9198]">
                        <span>Min order: {formatCurrency(coupon.minOrderAmount || 0)}</span>
                        <span>
                          Usage: {coupon.usedCount}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / unlimited'}
                        </span>
                        <span>
                          Expires:{' '}
                          {coupon.expiresAt
                            ? new Date(coupon.expiresAt).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button
                        variant={coupon.active ? 'secondary' : 'primary'}
                        onClick={() => handleToggleCoupon(coupon._id)}
                        disabled={mutatingId === coupon._id}
                        className="rounded-[16px]"
                      >
                        {mutatingId === coupon._id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : coupon.active ? (
                          'Deactivate'
                        ) : (
                          'Activate'
                        )}
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                        disabled={mutatingId === coupon._id}
                        className="rounded-[16px]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
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
