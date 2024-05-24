import { BaseWorker, workerLogger } from './base-worker';


const globals: {offscreen: Promise<void>} = { offscreen: null };

export class OffScreenWorker extends BaseWorker {
  static readonly name = 'offscreen-worker';
  static readonly period = 120;

  readonly name = OffScreenWorker.name;

  async process() {
    if (!(await this.busy())) {
      await this.start();

      const hasDocument = await chrome.offscreen.hasDocument();

      try {
        if (!hasDocument && !globals.offscreen) {
          globals.offscreen = chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: [chrome.offscreen.Reason.MATCH_MEDIA],
            justification: 'reason for needing the MATCH_MEDIA'
          });

          await globals.offscreen;
        }
      } catch (error) {
        workerLogger.info('offscreen document seems exists:', error.toString());
      }

      await this.finish();
    }
  }
}
