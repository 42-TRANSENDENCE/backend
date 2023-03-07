import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Chats } from 'src/entities/Chats';
import { Channels } from 'src/entities/Channels';
import { ChannelMember } from 'src/entities/ChannelMember';
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: +this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USER_NAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_DATABASE'),
      entities: [__dirname + '/../**/*.entity.{js,ts}',
      Chats,
      Channels,
      ChannelMember],
      synchronize: true,
    };
  }
}
