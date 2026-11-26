import { describe, expect, it } from 'vitest';
import { calculateDiscount } from '../../src/modules/pricing/calculate-discount.js';
import { calculateSubtotal } from '../../src/modules/pricing/calculate-subtotal.js';
import { calculateTotal } from '../../src/modules/pricing/calculate-total.js';

describe('pricing', () => {
  it('calculates a subtotal from catalog prices and quantities', () => {
    expect(
      calculateSubtotal(
        [{ productId: 'coffee', quantity: 2 }],
        [{ id: 'coffee', name: 'Coffee', priceCents: 2490 }],
      ),
    ).toBe(4980);
  });

  it('applies ten percent discount at the threshold', () => {
    expect(calculateDiscount(5000)).toBe(500);
    expect(calculateDiscount(4999)).toBe(0);
  });

  it('calculates total in integer cents', () => {
    expect(calculateTotal(10000, 1000)).toBe(9000);
  });

  it('rejects a discount greater than subtotal', () => {
    expect(() => calculateTotal(100, 101)).toThrow('Invalid monetary values');
  });
});
