import {Inject, Injectable} from "@nestjs/common";
import * as fs from "fs";
import {WINSTON_MODULE_PROVIDER} from "nest-winston";
import {Logger} from "winston";
const UPDATE_EXCHANGE_RATE_PERIOD_EVERY_5_MINUTES = 'every 5 minutes';
import moment = require('moment');
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookService {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly config: ConfigService,
  ) {
  }

  async getItems() {
    const dumpFileName = `${this.config.get('ROOT_DIR')}/tmp/webhook-sites.json`;

    const readFile = () => {
      return new Promise((rs, rj) => {
        this.logger.debug(
          `[WebhookService] read file`,
        );
        fs.readFile(dumpFileName, (err, content: any) => {
            if (err) return rj(err);

            try {
              return rs(JSON.parse(content));
            } catch (err) {
              return rj(new Error(err.messsage));
            }
          },
        );
      });
    };

    const tryReadFile = () => {
      return new Promise((rs, rj) => {
        readFile().then((content) => {
          rs(content);
        }).catch((err) => {
          setTimeout(() => {
            tryReadFile().then((content) => {
              rs(content);
            });
          }, 1000);
        })
      });
    };

    return tryReadFile();
  }

  updateItems = (contentFile) => {
    const dumpFileName = `${this.config.get('ROOT_DIR')}/tmp/webhook-sites.json`;

    const writeFile = () => {
      return new Promise((resolve, reject) => {
        fs.writeFile(dumpFileName, contentFile, (err) => {
          if(err) return reject(err);

          resolve();
        })
      });
    };
    return writeFile();
  };


  async findAll() {
    return this.getItems();
  }

  async findOne(modelData) {
    return new Promise((resolve, reject) => {
      return this.getItems().then((res) => {
        let foundEntity = null;
        res['items'].map((item) => {
          if(item['callback_url'] === modelData['callback_url']) {
            foundEntity = item;
          }
        });
        if(foundEntity) {
          return resolve(foundEntity);
        }
        reject(new Error(`entity with callback_url "${modelData['callback_url']}" not found`));
      });
    });
  }

  protected lockedBy = null;
  protected static LOCKED_BY_WEBHOOK_SERVICE = -1;

  async acquireLock() {
    return new Promise((resolve, reject) => {
      if(this.lockedBy === null) {
        this.lockedBy = WebhookService.LOCKED_BY_WEBHOOK_SERVICE;
        return resolve(this.lockedBy);
      }
      return reject({});
    });
  }

  async startAcquireLock() {
    return new Promise((resolve, reject) => {
      this.acquireLock().then(() => {
        resolve({});
      }).catch((err) => {
        return this.startAcquireLock().then(resolve).catch(reject);
      })
    })
  }
  async releaseLock() {
    this.lockedBy = null;
  }

  async addWebhook(webhookModel) {
    return new Promise((resolve, reject) => {
      this.startAcquireLock().then(() => {
        return this.getItems();
      }).then((fileContent) => {
        const items = JSON.parse(JSON.stringify(fileContent['items']));

        let latestId;
        if(items.length) {
          const latestItem = items.slice(-1)[0];
          latestId = latestItem['id'];
        } else {
          latestId = 0;
        }
        const newId = latestId + 1;

        const newWebhookEntity = {
          "id": newId,
          "callback_url": webhookModel['callback_url']
        };
        items.push(newWebhookEntity);

        return new Promise((resolve1, reject1) => {
          this.updateItems(JSON.stringify({
            items: items
          })).then(() => {
            resolve1(newWebhookEntity)
          }).catch(reject1)
        });
      }).then((newWebhookEntity) => {
        this.releaseLock();

        resolve(newWebhookEntity);
      });
    });
  }


  async updateWebhook(webhookModel) {
    return new Promise((resolve, reject) => {
      this.startAcquireLock().then(() => {
        return this.getItems();
      }).then((fileContent) => {
        const items = JSON.parse(JSON.stringify(fileContent['items']));

        let foundEntity = null;

        const newItems = items.map((item) => {
          if(Number(item['id']) === Number(webhookModel['id'])) {
            foundEntity = {
              "id": Number(webhookModel['id']),
              'callback_url': webhookModel['callback_url']
            };
            return foundEntity;
          }
          return item;
        });

        if(foundEntity) {
          // keep
        } else {
          this.releaseLock();
          return reject(new Error(`entity with id "${webhookModel['id']}" not found`));
        }

        return new Promise((resolve1, reject1) => {
          this.updateItems(JSON.stringify({
            items: newItems
          })).then(() => {
            resolve1(foundEntity)
          }).catch(reject1)
        });
      }).then((foundEntity) => {
        this.releaseLock();

        resolve(foundEntity);
      });
    });
  }

  async deleteWebhook(webhookModel) {
    return new Promise((resolve, reject) => {
      this.startAcquireLock().then(() => {
        return this.getItems();
      }).then((fileContent) => {
        const items = JSON.parse(JSON.stringify(fileContent['items']));
        const newItems = [];
        let foundEntity = null;

        items.map((item) => {
          if(Number(item['id']) === Number(webhookModel['id'])) {
            foundEntity = item;
          } else {
            newItems.push(item);
          }
        });

        if(foundEntity) {
          // keep
        } else {
          this.releaseLock();
          return reject(new Error(`entity with id "${webhookModel['id']}" not found`));
        }

        return new Promise((resolve1, reject1) => {
          this.updateItems(JSON.stringify({
            items: newItems
          })).then(() => {
            resolve1(foundEntity)
          }).catch(reject1)
        });
      }).then((foundEntity) => {
        this.releaseLock();

        return resolve(foundEntity);
      });
    });
  }
  
}
