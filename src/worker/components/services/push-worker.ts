// import { applicationId } from 'core';
// import { BaseWorker, workerLogger } from './base-worker';
// import { SyncWorker } from './sync-worker';
// import { ISyncPushInfo } from '../models/models';


// export class PushWorker extends BaseWorker {
//   static readonly name = 'pusher-worker';
//   static readonly period = 1;

//   readonly name = PushWorker.name;

//   async process() {
//     if (!(await this.busy()) && await SyncWorker.validate()) {
//       const process = await chrome.alarms.get(SyncWorker.name);

//       if (process?.name) {
//         const { pushedTime } = await chrome.storage.local.get('pushedTime');
//         const worker = new SyncWorker(this.settings);

//         await worker.process();
//         await chrome.storage.local.remove('pushedTime');

//         if (pushedTime > 1) {
//           await workerLogger.info('register to sync.');

//           return this.registerSync();
//         }
//       } else {
//         await workerLogger.info(`${SyncWorker.name} is not registered.`);
//       }
//     }
//   }

//   static async push(minutes: number, sync?: boolean): Promise<void> {
//     const alarm = await chrome.alarms.get(this.name);

//     if (!alarm) {
//       await workerLogger.info(`registered pushWorker with delayInMinutes: ${minutes || this.period}`);
//       // await chrome.storage.session.set({ pushedTime: sync ? new Date().getTime() : -1 });

//       return chrome.alarms.create(this.name, { delayInMinutes: minutes || this.period });
//     }
//   }

//   static async register(): Promise<void> {
//     throw new Error('PushWorker should not be part of the scheduled services.');
//   }

//   private async registerSync() {
//     const date = new Date();

//     await chrome.storage.sync.set({
//       pushChanged: <ISyncPushInfo> {
//         time: date.getTime(), applicationId: await applicationId()
//       }
//     });
//   }
// }
