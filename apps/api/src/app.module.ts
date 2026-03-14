import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Todo } from './todos/entities/todo.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'todo_db'),
        entities: [User, Todo],
        synchronize: configService.get<string>('DATABASE_SYNCHRONIZE') === 'true',
        logging: configService.get<string>('DATABASE_LOGGING') === 'true',
        ssl: configService.get<string>('DATABASE_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    TodosModule,
    UsersModule,
  ],
})
export class AppModule {}
