import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { GatewayRouterMiddleware } from './gateway-router.middleware';

@Module({})
export class GatewayModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GatewayRouterMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
