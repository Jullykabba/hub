import { z } from 'zod';
import { insertAirdropSchema, insertUserSchema, airdrops, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        walletAddress: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/auth/me' as const,
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  airdrops: {
    list: {
      method: 'GET' as const,
      path: '/api/airdrops' as const,
      input: z.object({
        network: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof airdrops.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/airdrops' as const,
      input: insertAirdropSchema.extend({
        startDate: z.coerce.date(),
        endDate: z.coerce.date()
      }),
      responses: {
        201: z.custom<typeof airdrops.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/airdrops/:id' as const,
      input: insertAirdropSchema.partial().extend({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional()
      }),
      responses: {
        200: z.custom<typeof airdrops.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/airdrops/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  crypto: {
    prices: {
      method: 'GET' as const,
      path: '/api/crypto/prices' as const,
      responses: {
        200: z.any(), // Returning arbitrary json from Coingecko
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
