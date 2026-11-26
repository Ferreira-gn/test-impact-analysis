import { describe, expect, it } from 'vitest';
import { ProductRepository } from '../../src/modules/products/product.repository.js';
import { ProductService } from '../../src/modules/products/product.service.js';

describe('products', () => {
  const service = new ProductService(new ProductRepository());

  it('lists the catalog', () => {
    expect(service.list()).toHaveLength(4);
  });

  it('rejects an unknown product', () => {
    expect(() => service.getById('unknown')).toThrow('Product not found');
  });
});
