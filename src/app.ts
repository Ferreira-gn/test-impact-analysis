import Fastify, { type FastifyInstance } from 'fastify';
import { CartRepository } from './modules/cart/cart.repository.js';
import { registerCartRoutes } from './modules/cart/cart.routes.js';
import { CartService } from './modules/cart/cart.service.js';
import { registerCheckoutRoutes } from './modules/checkout/checkout.routes.js';
import { CheckoutService } from './modules/checkout/checkout.service.js';
import { ProductRepository } from './modules/products/product.repository.js';
import { registerProductRoutes } from './modules/products/product.routes.js';
import { ProductService } from './modules/products/product.service.js';
import { AppError } from './shared/errors/app-error.js';
import { AuthService } from './modules/auth/auth.service.js';
import { registerAuthRoutes } from './modules/auth/auth.routes.js';
import { CouponRepository } from './modules/coupons/coupon.repository.js';
import { CouponService } from './modules/coupons/coupon.service.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
    ajv: { customOptions: { removeAdditional: false } },
  });
  const products = new ProductService(new ProductRepository());
  const auth = new AuthService();
  const coupons = new CouponService(new CouponRepository());
  const cart = new CartService(new CartRepository(), products, coupons);
  const checkout = new CheckoutService(cart, products, coupons);

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, 'request failed');
    if (error instanceof AppError)
      return reply
        .status(error.statusCode)
        .send({ error: { code: error.code, message: error.message } });
    if ((error as { validation?: unknown }).validation)
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
      });
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });

  void registerAuthRoutes(app, auth);
  void registerProductRoutes(app, products);
  void registerCartRoutes(app, cart, auth);
  void registerCheckoutRoutes(app, checkout, auth);
  return app;
}
