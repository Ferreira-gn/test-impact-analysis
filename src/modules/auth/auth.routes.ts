import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuthService } from './auth.service.js';

export async function registerAuthRoutes(
  app: FastifyInstance,
  service: AuthService,
): Promise<void> {
  app.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', minLength: 3, format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request) => service.login(request.body.email, request.body.password),
  );
}

export function requireAuth(service: AuthService) {
  return async (request: FastifyRequest): Promise<void> => {
    service.authenticate(request.headers.authorization);
  };
}
