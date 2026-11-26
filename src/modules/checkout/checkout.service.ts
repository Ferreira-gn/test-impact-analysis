import { AppError } from '../../shared/errors/app-error.js';
import type { OrderSummary } from '../../shared/types/domain.js';
import type { CartService } from '../cart/cart.service.js';
import type { ProductService } from '../products/product.service.js';
import { calculateDiscount } from '../pricing/calculate-discount.js';
import { calculateSubtotal } from '../pricing/calculate-subtotal.js';
import { calculateTotal } from '../pricing/calculate-total.js';

export class CheckoutService {
  public constructor(
    private readonly cart: CartService,
    private readonly products: ProductService,
  ) {}

  public checkout(): OrderSummary {
    const cart = this.cart.get();
    if (cart.items.length === 0)
      throw new AppError('Cannot checkout an empty cart', 400, 'EMPTY_CART');
    const catalog = this.products.list();
    const subtotalCents = calculateSubtotal(cart.items, catalog);
    const discountCents = calculateDiscount(subtotalCents);
    return {
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
      subtotalCents,
      discountCents,
      totalCents: calculateTotal(subtotalCents, discountCents),
    };
  }
}
