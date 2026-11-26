import { AppError } from '../../shared/errors/app-error.js';
import type { OrderSummary } from '../../shared/types/domain.js';
import type { CartService } from '../cart/cart.service.js';
import type { ProductService } from '../products/product.service.js';
import { CouponService } from '../coupons/coupon.service.js';
import { CouponRepository } from '../coupons/coupon.repository.js';
import { calculateDiscount } from '../pricing/calculate-discount.js';
import { calculateSubtotal } from '../pricing/calculate-subtotal.js';
import { calculateTotal } from '../pricing/calculate-total.js';

export class CheckoutService {
  public constructor(
    private readonly cart: CartService,
    private readonly products: ProductService,
    private readonly coupons = new CouponService(new CouponRepository()),
  ) {}

  public checkout(): OrderSummary {
    const cart = this.cart.get();
    if (cart.items.length === 0)
      throw new AppError('Cannot checkout an empty cart', 400, 'EMPTY_CART');
    const catalog = this.products.list();
    const subtotalCents = calculateSubtotal(cart.items, catalog);
    const automaticDiscountCents = calculateDiscount(subtotalCents);
    const couponDiscountCents = cart.couponCode
      ? this.coupons.calculate(cart.couponCode, subtotalCents).discountCents
      : 0;
    const discountCents = Math.min(
      subtotalCents,
      automaticDiscountCents + couponDiscountCents,
    );
    return {
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
      subtotalCents,
      discountCents,
      ...(cart.couponCode ? { couponCode: cart.couponCode } : {}),
      couponDiscountCents,
      totalCents: calculateTotal(subtotalCents, discountCents),
    };
  }
}
