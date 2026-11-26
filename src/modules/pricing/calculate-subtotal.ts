import type { CartItem, Product } from '../../shared/types/domain.js';

export function calculateSubtotal(
  items: readonly CartItem[],
  products: readonly Product[],
): number {
  const prices = new Map(
    products.map((product) => [product.id, product.priceCents]),
  );
  return items.reduce(
    (subtotal, item) =>
      subtotal + (prices.get(item.productId) ?? 0) * item.quantity,
    0,
  );
}
