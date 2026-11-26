import { describe, expect, it } from 'vitest';
import { CouponRepository } from '../../src/modules/coupons/coupon.repository.js';
import { CouponService } from '../../src/modules/coupons/coupon.service.js';

describe('CouponService', () => {
  const service = new CouponService(new CouponRepository());

  it('lists the seeded coupons', () => {
    expect(service.list()).toHaveLength(4);
  });

  it('applies WELCOME10 at zero subtotal', () => {
    expect(service.calculate('WELCOME10', 0)).toEqual({
      code: 'WELCOME10',
      discountCents: 0,
    });
  });

  it('calculates a percentage discount', () => {
    expect(service.calculate('WELCOME10', 4999).discountCents).toBe(499);
  });

  it('rounds percentage discounts down to cents', () => {
    expect(service.calculate('WELCOME10', 101).discountCents).toBe(10);
  });

  it('accepts lowercase coupon codes', () => {
    expect(service.calculate('welcome10', 5000).code).toBe('WELCOME10');
  });

  it('accepts coupon codes with surrounding whitespace', () => {
    expect(service.calculate(' SAVE500 ', 3000).code).toBe('SAVE500');
  });

  it('calculates the fixed SAVE500 discount', () => {
    expect(service.calculate('SAVE500', 4000).discountCents).toBe(500);
  });

  it('applies the fixed discount at the minimum subtotal', () => {
    expect(service.calculate('SAVE500', 3000).discountCents).toBe(500);
  });

  it('requires the minimum subtotal for SAVE500', () => {
    expect(() => service.calculate('SAVE500', 2999)).toThrow(
      'does not meet coupon minimum',
    );
  });

  it('requires the minimum subtotal for VIP20', () => {
    expect(() => service.calculate('VIP20', 9999)).toThrow(
      'does not meet coupon minimum',
    );
  });

  it('calculates the VIP20 percentage discount', () => {
    expect(service.calculate('VIP20', 10000).discountCents).toBe(2000);
  });

  it('rejects an unknown coupon', () => {
    expect(() => service.calculate('NOT-REAL', 5000)).toThrow(
      'Coupon not found',
    );
  });

  it('rejects an expired coupon', () => {
    expect(() => service.calculate('EXPIRED10', 5000)).toThrow(
      'Coupon expired',
    );
  });

  it('returns the canonical coupon code', () => {
    expect(service.calculate('vip20', 10000).code).toBe('VIP20');
  });

  it('never returns a negative discount', () => {
    expect(service.calculate('WELCOME10', 1).discountCents).toBe(0);
  });
});
