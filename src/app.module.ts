import { CacheModule, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './channels/chats/chats.module';
import { ChannelsModule } from './channels/channels.module';
import { ChannelsGateway } from './channels/events/events.channels.gateway';
import { EventsModule } from './channels/events/events.module';
import { DatabaseModule } from './database/database.module';
import { GameModule } from './game/game.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        CLIENT_ID: Joi.string().required(),
        CLIENT_SECRET: Joi.string().required(),
        REDIRECT_URI: Joi.string().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        SESSION_SECRET: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
      envFilePath: process.env.NODE_ENV == 'dev' ? '.env.dev' : '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    ChannelsModule,
    EventsModule,
    GameModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.register(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
