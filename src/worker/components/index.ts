import * as core from 'core';
import { LoggerService } from 'modules/logger';
import { storage, ISyncInfo } from 'core/services';
import { SyncWorker } from './services/sync-worker';
import { DataWorker } from './services/data-worker';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import { ISettingsArea, PAGE_MODES, getPopupPage, getSettings } from 'modules/settings';
import { ITabInfo } from 'modules/settings/models/settings.model';
import { ensureOptionPage, findTab } from './services';
import { ISyncPushInfo } from './models/models';
import { PushWorker } from './services/push-worker';


export { StorageChange } from './models/models';


const logger = new LoggerService('background.ts', 'green');


export async function initPopup() {
  const settings = await getSettings();

  await chrome.action.setPopup({ popup: getPopupPage(settings.common) });
}

export async function initApplication(handler: string) {
  const local = await chrome.storage.local.get('migrate');

  await logger.addLine();
  await logger.info('initApp is fired: ', handler);

  // if migrate needed!
  if (local.migrate) {
    chrome.tabs.create({ url: 'whats-new.html' });
  }

  // TODO restore all sessions.
  await core.ensureApplicationId();
  await storage.cached.init();
  await chrome.alarms.clearAll();

  if (await SyncWorker.validate()) {
    await SyncWorker.register(1);
  }

  await DataWorker.register();
  await initPopup();
}

export async function openPopup(settings: ISettingsArea, tabInfo?: ITabInfo) {
  const mode = PAGE_MODES[settings.common.mode];

  if (tabInfo) {
    const tab = await findTab(tabInfo.id);

    if (tab) {
      await chrome.windows.update(tab.windowId, { focused: true });

      return chrome.tabs.update(tab.id, { active: true });
    }

    if (settings.common.mode === 4) {
      await logger.info('open-window', tabInfo.top, tabInfo.left, tabInfo.width, tabInfo.height);

      try {
        await chrome.windows.create({
          focused: true,
          url: mode.page || 'option.html',
          type: 'popup',
          top: tabInfo.top || null,
          left: tabInfo.left || null,
          width: tabInfo.width || 800,
          height: tabInfo.height || 600
        });

        return;
      } catch (er) {
        logger.warn('Error opening window', er.message);
      }
    }
  }

  if (settings.common.mode === 4) {
    return chrome.windows.create({ focused: true, url: mode.page || 'option.html', type: 'popup' });
  }

  return chrome.tabs.create({ url: mode.page || 'option.html' });
}

export async function onPushInfoChanged(oldValue: ISyncPushInfo, newValue: ISyncPushInfo) {
  if (newValue.time !== oldValue?.time && newValue.applicationId !== await core.getApplicationId()) {
    const alarm = await chrome.alarms.get(PushWorker.name);

    if (!alarm) {
      await chrome.storage.local.set({ pushInfo: -1 });
      await logger.info('onSyncPushInfoChanged: register to sync...');

      return chrome.alarms.create(PushWorker.name, { delayInMinutes: PushWorker.period });
    }
  }
}

export async function onSyncInfoChanged(info: ISyncInfo) {
  const identity = await storage.local.get<IdentityInfo>('identityInfo') || {
    fileId: null,
    enabled: false,
    token: null,
    passphrase: null,
    encrypted: false,
    applicationId: null
  };

  if (identity.locked && info.enabled && info.token && !info.encrypted && identity.encrypted) {
    identity.locked = false;
  }

  if (!identity.locked && info.enabled && info.token && info.encrypted && !identity.passphrase) {
    identity.locked = true;
  }

  if (!info.encrypted) {
    identity.passphrase = null;
  }

  identity.enabled = info.enabled;
  identity.applicationId = info.applicationId;
  identity.encrypted = info.encrypted;
  identity.token = info.token;

  await storage.local.sensitive('identityInfo', identity);
}

export async function onIdentityInfoChanged(oldInfo: IdentityInfo, newInfo: IdentityInfo) {
  if (oldInfo && oldInfo.token && (!newInfo || !newInfo.token)) {
    await SyncWorker.deregister();

    return SyncWorker.removeCache(oldInfo.token);
  }

  if (newInfo && newInfo.token && (await SyncWorker.validate(newInfo))) {
    if (!oldInfo?.token && newInfo.applicationId && newInfo.applicationId !== await core.getApplicationId()) {
      return SyncWorker.register(1);
    }

    return SyncWorker.register();
  }

  if (newInfo && newInfo.locked) {
    await ensureOptionPage();
  }

  return await SyncWorker.deregister();
}

export async function onSyncDataRemoved(oldInfo: ISyncInfo) {
  const bytes = await chrome.storage.sync.getBytesInUse();

  if (bytes === 0 && oldInfo.applicationId > 0) {
    const identity = await storage.local.get<IdentityInfo>('identityInfo');
    const { db } = await import('modules/db');
    const data = await db.dump();

    if (identity?.token) {
      await SyncWorker.removeCache(oldInfo.token);
    }

    if (data?.find(i => i.synced) || !!identity) {
      const { resetDefaults } = await import('modules/settings');

      await db.clear();
      await storage.global.clearLocal();
      await LoggerService.clear();
      await resetDefaults();
      await logger.info('data removed.');
    }

    return initApplication('reset');
  }
}
