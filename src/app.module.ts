import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import LoggerConfig from './logger.config';
import {WebhookModule} from "./webhook";

const logger: LoggerConfig = new LoggerConfig();

@Module({
  imports: [
    ConfigModule.forRoot({}),
    WebhookModule,
    WinstonModule.forRoot(logger.console())
  ],
})
export class AppModule {}
