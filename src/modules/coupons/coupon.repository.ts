import type { Coupon } from '../../shared/types/domain.js';

const initialCoupons: readonly Coupon[] = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minimumSubtotalCents: 0,
  },
  {
    code: 'SAVE500',
    type: 'fixed',
    value: 500,
    minimumSubtotalCents: 3000,
  },
  {
    code: 'VIP20',
    type: 'percentage',
    value: 20,
    minimumSubtotalCents: 10000,
  },
  {
    code: 'EXPIRED10',
    type: 'percentage',
    value: 10,
    minimumSubtotalCents: 0,
    expiresAt: '2020-01-01T00:00:00.000Z',
  },
];

export class CouponRepository {
  public list(): readonly Coupon[] {
    return initialCoupons;
  }

  public findByCode(code: string): Coupon | undefined {
    return initialCoupons.find((coupon) => coupon.code === code);
  }
}
