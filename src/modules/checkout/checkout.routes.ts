import type { FastifyInstance } from 'fastify';
import type { CheckoutService } from './checkout.service.js';

export async function registerCheckoutRoutes(
  app: FastifyInstance,
  service: CheckoutService,
): Promise<void> {
  app.post('/checkout', async () => service.checkout());
}
