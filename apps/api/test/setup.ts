// Set env vars before any module is imported
process.env.JWT_SECRET = 'e2e-test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../src/auth/auth.module';
import { TodosModule } from '../src/todos/todos.module';
import { UsersModule } from '../src/users/users.module';
import { User } from '../src/users/entities/user.entity';
import { Todo } from '../src/todos/entities/todo.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [User, Todo],
        synchronize: true,
        logging: false,
      }),
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
      AuthModule,
      TodosModule,
      UsersModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();
  return app;
}
