import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

describe('HTTP API', () => {
  const login = async (app: ReturnType<typeof buildApp>): Promise<string> => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'demo@example.com', password: 'password123' },
    });
    return `Bearer ${response.json().accessToken}`;
  };

  it('lists products and manages a cart through Fastify injection', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const products = await app.inject({ method: 'GET', url: '/products' });
    expect(products.statusCode).toBe(200);
    expect(products.json().products).toHaveLength(4);

    const add = await app.inject({
      method: 'POST',
      url: '/cart/items',
      headers: { authorization },
      payload: { productId: 'coffee', quantity: 2 },
    });
    expect(add.statusCode).toBe(200);
    expect(add.json().items).toEqual([{ productId: 'coffee', quantity: 2 }]);

    const checkout = await app.inject({
      method: 'POST',
      url: '/checkout',
      headers: { authorization },
    });
    expect(checkout.statusCode).toBe(200);
    expect(checkout.json().totalCents).toBe(4980);
    await app.close();
  });

  it('returns validation and not-found errors safely', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const invalid = await app.inject({
      method: 'POST',
      url: '/cart/items',
      headers: { authorization },
      payload: { productId: 'coffee', quantity: 0 },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error.code).toBe('VALIDATION_ERROR');
    const missing = await app.inject({ method: 'GET', url: '/products/nope' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error.code).toBe('PRODUCT_NOT_FOUND');
    await app.close();
  });
});
