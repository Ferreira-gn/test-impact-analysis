import type { FastifyInstance } from 'fastify';
import type { CheckoutService } from './checkout.service.js';
import type { AuthService } from '../auth/auth.service.js';
import { requireAuth } from '../auth/auth.routes.js';

export async function registerCheckoutRoutes(
  app: FastifyInstance,
  service: CheckoutService,
  auth: AuthService,
): Promise<void> {
  app.post('/checkout', { preHandler: requireAuth(auth) }, async () =>
    service.checkout(),
  );
}
