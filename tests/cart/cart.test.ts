import { describe, expect, it } from 'vitest';
import { CartRepository } from '../../src/modules/cart/cart.repository.js';
import { CartService } from '../../src/modules/cart/cart.service.js';
import { ProductRepository } from '../../src/modules/products/product.repository.js';
import { ProductService } from '../../src/modules/products/product.service.js';

describe('cart', () => {
  const createService = () => {
    const products = new ProductService(new ProductRepository());
    return new CartService(new CartRepository(), products);
  };

  it('adds and accumulates quantities', () => {
    const service = createService();
    service.add('coffee', 2);
    expect(service.add('coffee', 1).items).toEqual([
      { productId: 'coffee', quantity: 3 },
    ]);
  });

  it('rejects invalid quantities', () => {
    expect(() => createService().add('coffee', 0)).toThrow('Quantity must be');
  });

  it('updates and removes an item', () => {
    const service = createService();
    service.add('tea', 2);
    service.update('tea', 4);
    expect(service.remove('tea').items).toEqual([]);
  });
});
