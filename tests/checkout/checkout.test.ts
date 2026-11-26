import { describe, expect, it } from 'vitest';
import { CartRepository } from '../../src/modules/cart/cart.repository.js';
import { CartService } from '../../src/modules/cart/cart.service.js';
import { CheckoutService } from '../../src/modules/checkout/checkout.service.js';
import { ProductRepository } from '../../src/modules/products/product.repository.js';
import { ProductService } from '../../src/modules/products/product.service.js';

describe('checkout', () => {
  it('rejects an empty cart', () => {
    const products = new ProductService(new ProductRepository());
    const checkout = new CheckoutService(
      new CartService(new CartRepository(), products),
      products,
    );
    expect(() => checkout.checkout()).toThrow('empty cart');
  });

  it('returns an order summary with discount', () => {
    const products = new ProductService(new ProductRepository());
    const cart = new CartService(new CartRepository(), products);
    cart.add('mug', 1);
    const result = new CheckoutService(cart, products).checkout();
    expect(result).toEqual({
      itemCount: 1,
      subtotalCents: 4990,
      discountCents: 0,
      totalCents: 4990,
    });
    cart.add('coffee', 1);
    expect(new CheckoutService(cart, products).checkout().discountCents).toBe(
      748,
    );
  });
});
