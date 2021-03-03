import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Delete, Put
} from '@nestjs/common';
import {WebhookService} from "./webhook.service";


@Controller('webhook')
export class WebhookController {

  constructor(
    private readonly webhookService: WebhookService,
  ) {}

  static callbackUrlIsPassed(modelData) {
    if(modelData['callback_url']) {
      // keep
    } else {
      throw new BadRequestException('callback_url should be passed');
    }
  }

  static idIsPassed(modelData) {
    if(modelData['id']) {
      // keep
    } else {
      throw new BadRequestException('id should be passed');
    }
  }

  @Get()
  async getAllWebhooks(): Promise<any> {
    return this.webhookService.findAll();
  }

  @Post()
  async addWebhooks(@Body() modelData: { callback_url: string }): Promise<any> {
    WebhookController.callbackUrlIsPassed(modelData);

    return this.webhookService.addWebhook(modelData).catch((err) => {
      throw new BadRequestException(err.message);
    });
  }

  @Put()
  async updateWebhooks(@Body() modelData: { id: string, callback_url: string }): Promise<any> {
    WebhookController.idIsPassed(modelData);
    WebhookController.callbackUrlIsPassed(modelData);

    return this.webhookService.updateWebhook(modelData).catch((err) => {
      throw new BadRequestException(err.message);
    });
  }
  
  @Delete()
  async deleteWebhooks(@Body() modelData: { id: string }): Promise<any> {
    WebhookController.idIsPassed(modelData);

    return this.webhookService.deleteWebhook(modelData).catch((err) => {
      throw new BadRequestException(err.message);
    });
  }

}
