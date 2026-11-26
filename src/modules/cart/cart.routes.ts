import type { FastifyInstance } from 'fastify';
import type { CartService } from './cart.service.js';
import type { AuthService } from '../auth/auth.service.js';
import { requireAuth } from '../auth/auth.routes.js';

const quantitySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['quantity'],
  properties: { quantity: { type: 'integer', minimum: 1, maximum: 20 } },
} as const;
const productParams = {
  type: 'object',
  required: ['productId'],
  properties: { productId: { type: 'string', minLength: 1 } },
} as const;

export async function registerCartRoutes(
  app: FastifyInstance,
  service: CartService,
  auth: AuthService,
): Promise<void> {
  const authOptions = { preHandler: requireAuth(auth) };
  app.get('/cart', authOptions, async () => service.get());
  app.post<{ Body: { productId: string; quantity: number } }>(
    '/cart/items',
    {
      ...authOptions,
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', minLength: 1 },
            quantity: { type: 'integer', minimum: 1, maximum: 20 },
          },
        },
      },
    },
    async (request) =>
      service.add(request.body.productId, request.body.quantity),
  );
  app.patch<{ Params: { productId: string }; Body: { quantity: number } }>(
    '/cart/items/:productId',
    {
      ...authOptions,
      schema: { params: productParams, body: quantitySchema },
    },
    async (request) =>
      service.update(request.params.productId, request.body.quantity),
  );
  app.delete<{ Params: { productId: string } }>(
    '/cart/items/:productId',
    { ...authOptions, schema: { params: productParams } },
    async (request) => service.remove(request.params.productId),
  );

  app.post<{ Body: { code: string } }>(
    '/cart/coupon',
    {
      ...authOptions,
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['code'],
          properties: { code: { type: 'string', minLength: 1, maxLength: 32 } },
        },
      },
    },
    async (request) => service.applyCoupon(request.body.code),
  );
  app.delete('/cart/coupon', authOptions, async () => service.clearCoupon());
}
