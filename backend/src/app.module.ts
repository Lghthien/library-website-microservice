import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ParametersModule } from './modules/parameters/parameters.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { BookCopiesModule } from './modules/book_copies/book_copies.module';
import { BooksModule } from './modules/books/books.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FineReceiptsModule } from './modules/fine_receipts/fine_receipts.module';
import { LoansDetailsModule } from './modules/loans_details/loans_details.module';
import { LoansModule } from './modules/loans/loans.module';
import { ReaderTypesModule } from './modules/reader_types/reader_types.module';
import { ReadersModule } from './modules/readers/readers.module';
import { TitleAuthorsModule } from './modules/title_authors/title_authors.module';
import { TitleBooksModule } from './modules/title_books/title_books.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolePermissionsModule } from './modules/role_permissions/role-permissions.module';
import { LoginHistoryModule } from './modules/login_history/login-history.module';
import { AuditLogsModule } from './modules/audit_logs/audit-logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/library',
    ),

    AuthModule,
    UsersModule,
    ParametersModule,
    AuthorsModule,
    BookCopiesModule,
    BooksModule,
    CategoriesModule,
    FineReceiptsModule,
    LoansDetailsModule,
    LoansModule,
    ReaderTypesModule,
    ReadersModule,
    TitleAuthorsModule,
    TitleBooksModule,
    PermissionsModule,
    RolePermissionsModule,
    LoginHistoryModule,
    AuditLogsModule,
    NotificationsModule,
    ReportsModule,

    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
