import type { FastifyInstance } from 'fastify';
import type { ProductService } from './product.service.js';

export async function registerProductRoutes(
  app: FastifyInstance,
  service: ProductService,
): Promise<void> {
  app.get('/products', async () => {
    const products = service.list();
    return { products };
  });
  app.get<{ Params: { id: string } }>(
    '/products/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', minLength: 1 } },
        },
      },
    },
    async (request) => service.getById(request.params.id),
  );
}
