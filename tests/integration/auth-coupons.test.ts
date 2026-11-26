import type { FastifyInstance } from 'fastify';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

async function login(app: FastifyInstance): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'demo@example.com', password: 'password123' },
  });
  expect(response.statusCode).toBe(200);
  return `Bearer ${response.json().accessToken}`;
}

describe('authentication and coupons HTTP API', () => {
  it('logs in with valid credentials', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'demo@example.com', password: 'password123' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      tokenType: 'Bearer',
      expiresIn: 900,
    });
    expect(response.json().accessToken).toEqual(expect.any(String));
    await app.close();
  });

  it('rejects invalid login credentials', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'demo@example.com', password: 'wrong-password' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('INVALID_CREDENTIALS');
    await app.close();
  });

  it('rejects malformed login payloads', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'not-an-email', password: 'short' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
    await app.close();
  });

  it('keeps product listing public', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/products' });
    expect(response.statusCode).toBe(200);
    expect(response.json().products).toHaveLength(4);
    await app.close();
  });

  it('requires a token to read the cart', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/cart' });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
    await app.close();
  });

  it('requires a token to add cart items', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/cart/items',
      payload: { productId: 'coffee', quantity: 1 },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('rejects an invalid bearer token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/checkout',
      headers: { authorization: 'Bearer invalid' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('INVALID_TOKEN');
    await app.close();
  });

  it('reads an empty cart with a valid token', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const response = await app.inject({
      method: 'GET',
      url: '/cart',
      headers: { authorization },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ items: [] });
    await app.close();
  });

  it('applies WELCOME10 to a cart', async () => {
    const app = buildApp();
    const authorization = await login(app);
    await app.inject({
      method: 'POST',
      url: '/cart/items',
      headers: { authorization },
      payload: { productId: 'coffee', quantity: 2 },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: 'WELCOME10' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().couponCode).toBe('WELCOME10');
    await app.close();
  });

  it('applies coupons case-insensitively', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const response = await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: ' welcome10 ' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().couponCode).toBe('WELCOME10');
    await app.close();
  });

  it('rejects an unknown coupon with not found', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const response = await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: 'NOPE' },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('COUPON_NOT_FOUND');
    await app.close();
  });

  it('rejects an expired coupon', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const response = await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: 'EXPIRED10' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('COUPON_EXPIRED');
    await app.close();
  });

  it('rejects a coupon below its minimum subtotal', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const response = await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: 'VIP20' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('COUPON_MINIMUM_NOT_MET');
    await app.close();
  });

  it('rejects unexpected coupon fields', async () => {
    const app = buildApp();
    const authorization = await login(app);
    const response = await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: 'WELCOME10', discountCents: 999999 },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('includes coupon discount in checkout totals', async () => {
    const app = buildApp();
    const authorization = await login(app);
    await app.inject({
      method: 'POST',
      url: '/cart/items',
      headers: { authorization },
      payload: { productId: 'coffee', quantity: 2 },
    });
    await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: 'WELCOME10' },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/checkout',
      headers: { authorization },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      subtotalCents: 4980,
      couponCode: 'WELCOME10',
      couponDiscountCents: 498,
      discountCents: 498,
      totalCents: 4482,
    });
    await app.close();
  });

  it('clears an applied coupon', async () => {
    const app = buildApp();
    const authorization = await login(app);
    await app.inject({
      method: 'POST',
      url: '/cart/coupon',
      headers: { authorization },
      payload: { code: 'WELCOME10' },
    });
    const response = await app.inject({
      method: 'DELETE',
      url: '/cart/coupon',
      headers: { authorization },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ items: [] });
    await app.close();
  });
});
