import { AppError } from '../../shared/errors/app-error.js';
import type { CouponApplication, Coupon } from '../../shared/types/domain.js';
import type { CouponRepository } from './coupon.repository.js';

export class CouponService {
  public constructor(private readonly repository: CouponRepository) {}

  public list(): readonly Coupon[] {
    return this.repository.list();
  }

  public calculate(code: string, subtotalCents: number): CouponApplication {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = this.repository.findByCode(normalizedCode);
    if (!coupon)
      throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now())
      throw new AppError('Coupon expired', 400, 'COUPON_EXPIRED');
    if (subtotalCents < coupon.minimumSubtotalCents)
      throw new AppError(
        'Cart subtotal does not meet coupon minimum',
        400,
        'COUPON_MINIMUM_NOT_MET',
      );

    const discountCents =
      coupon.type === 'percentage'
        ? Math.floor((subtotalCents * coupon.value) / 100)
        : Math.min(coupon.value, subtotalCents);
    return { code: coupon.code, discountCents };
  }
}
