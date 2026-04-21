import {
  createProxyMiddleware,
  RequestHandler,
  fixRequestBody,
} from 'http-proxy-middleware';

type ServiceName =
  | 'auth'
  | 'catalog'
  | 'report'
  | 'notification'
  | 'reader'
  | 'loan'
  | 'parameter';

const SERVICE_URLS: Record<ServiceName, string> = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:4002',
  report: process.env.REPORT_SERVICE_URL || 'http://localhost:4003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004',
  reader: process.env.READER_SERVICE_URL || 'http://localhost:4005',
  loan: process.env.LOAN_SERVICE_URL || 'http://localhost:4006',
  parameter: process.env.PARAMETER_SERVICE_URL || 'http://localhost:4007',
};

const proxyCache = new Map<ServiceName, RequestHandler>();

export function createServiceProxy(service: ServiceName): RequestHandler {
  if (!proxyCache.has(service)) {
    const target = SERVICE_URLS[service];
    proxyCache.set(
      service,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        on: {
          proxyReq: fixRequestBody,
          error: (err, req, res: any) => {
            console.error(`[Gateway] Proxy error for ${service}:`, err.message);
            if (!res.headersSent) {
              res.status(502).json({
                statusCode: 502,
                message: `${service} service is unavailable`,
                error: 'Bad Gateway',
              });
            }
          },
        },
      }),
    );
  }
  return proxyCache.get(service)!;
}
