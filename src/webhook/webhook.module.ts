import { Module } from '@nestjs/common';
import {WebhookController} from "./webhook.controller";
import {WebhookService} from "./webhook.service";
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({}),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
