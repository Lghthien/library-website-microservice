import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createServiceProxy } from './proxy.middleware';

@Injectable()
export class GatewayRouterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;

    // Service mapping based on path prefixes
    if (
      path.startsWith('/api/auth/') ||
      path === '/api/auth' ||
      path.startsWith('/api/users') ||
      path.startsWith('/api/permissions') ||
      path.startsWith('/api/role-permissions') ||
      path.startsWith('/api/login-history')
    ) {
      return createServiceProxy('auth')(req, res, next);
    }

    if (
      path.startsWith('/api/books') ||
      path.startsWith('/api/title-books') ||
      path.startsWith('/api/title-authors') ||
      path.startsWith('/api/book-copies') ||
      path.startsWith('/api/categories') ||
      path.startsWith('/api/authors') ||
      path.startsWith('/uploads')
    ) {
      return createServiceProxy('catalog')(req, res, next);
    }

    if (
      path.startsWith('/api/readers') ||
      path.startsWith('/api/reader-types')
    ) {
      return createServiceProxy('reader')(req, res, next);
    }

    if (
      path.startsWith('/api/loans') ||
      path.startsWith('/api/loans-details') ||
      path.startsWith('/api/fine-receipts')
    ) {
      return createServiceProxy('loan')(req, res, next);
    }

    if (path.startsWith('/api/parameters')) {
      return createServiceProxy('parameter')(req, res, next);
    }

    if (path.startsWith('/api/reports')) {
      return createServiceProxy('report')(req, res, next);
    }

    if (
      path.startsWith('/api/notifications') ||
      path.startsWith('/api/audit-logs')
    ) {
      return createServiceProxy('notification')(req, res, next);
    }

    // Default: Continue to next middleware (will likely result in 404 if no other handler matches)
    next();
  }
}
