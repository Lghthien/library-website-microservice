import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Ã°Å¸Å’Â API Gateway running at http://localhost:${port}`);
  console.log(
    `   Ã¢â€ â€™ Auth Service:         ${process.env.AUTH_SERVICE_URL || 'http://localhost:4001'}`,
  );
  console.log(
    `   Ã¢â€ â€™ Catalog Service:      ${process.env.CATALOG_SERVICE_URL || 'http://localhost:4002'}`,
  );
  console.log(
    `   Ã¢â€ â€™ Reader Service:       ${process.env.READER_SERVICE_URL || 'http://localhost:4005'}`,
  );
  console.log(
    `   Ã¢â€ â€™ Loan Service:         ${process.env.LOAN_SERVICE_URL || 'http://localhost:4006'}`,
  );
  console.log(
    `   Ã¢â€ â€™ Parameter Service:    ${process.env.PARAMETER_SERVICE_URL || 'http://localhost:4007'}`,
  );
  console.log(
    `   Ã¢â€ â€™ Report Service:       ${process.env.REPORT_SERVICE_URL || 'http://localhost:4003'}`,
  );
  console.log(
    `   Ã¢â€ â€™ Notification Service: ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004'}`,
  );
}
bootstrap();
