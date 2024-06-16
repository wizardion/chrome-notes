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
import { OffScreenWorker } from './services/offscreen-worker';


export { StorageChange } from './models/models';

const globals: {offscreen: Promise<void>} = { offscreen: null };
const logger = new LoggerService('background.ts', 'green');


export async function initPopup() {
  const settings = await getSettings();

  await chrome.action.setPopup({ popup: getPopupPage(settings.common) });
}

export async function initIcons() {
  const settings = await getSettings();

  await chrome.action.setPopup({ popup: getPopupPage(settings.common) });
}

export async function initOffScreen() {
  const hasDocument = await chrome.offscreen.hasDocument();

  if (!hasDocument && !globals.offscreen) {
    globals.offscreen = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.MATCH_MEDIA],
      justification: 'reason for needing the MATCH_MEDIA'
    });

    return globals.offscreen;
  }
}

export async function initApplication(): Promise<void> {
  await logger.addLine();
  await logger.info('initApplication is fired');

  await core.ensureApplicationId();
  await storage.cached.init();
  await chrome.alarms.clearAll();

  if (await SyncWorker.validate()) {
    await SyncWorker.register(1);
  }

  await OffScreenWorker.register();
  await DataWorker.register();
  await initOffScreen();

  return initPopup();
}

export async function initInstalledApplication(): Promise<void> {
  const local = await chrome.storage.local.get('migrate');

  await logger.addLine();
  await logger.info('initInstalledApplication is fired');

  // if migrate needed!
  if (local.migrate) {
    chrome.tabs.create({ url: 'whats-new.html' });
  }

  return initApplication();
}

export async function openPopup(): Promise<chrome.windows.Window | chrome.tabs.Tab | void> {
  const local = await chrome.storage.local.get(['tabInfo', 'settings']);
  const settings = local.settings?.value as ISettingsArea ;
  const tabInfo = local.tabInfo as ITabInfo;
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
  if (newValue.time !== oldValue?.time && newValue.id !== await core.getApplicationId()) {
    await chrome.storage.session.remove(PushWorker.infoKey);

    return PushWorker.register();
  }
}

export async function onSyncInfoChanged(newValue: ISyncInfo) {
  const identity = await storage.local.get<IdentityInfo>('identityInfo') || {
    fileId: null,
    enabled: false,
    token: null,
    passphrase: null,
    encrypted: false,
    applicationId: null
  };

  if (identity.locked && newValue?.enabled && newValue.token && !newValue.encrypted && identity.encrypted) {
    identity.locked = false;
  }

  if (!identity.locked && newValue?.enabled && newValue.token && newValue.encrypted && !identity.passphrase) {
    identity.locked = true;

    await SyncWorker.lock();
    await ensureOptionPage();
  }

  if (!newValue.encrypted) {
    identity.passphrase = null;
  }

  identity.enabled = newValue?.enabled;
  identity.applicationId = newValue?.applicationId;
  identity.encrypted = newValue?.encrypted;
  identity.token = newValue?.token;
  identity.fileId = newValue?.fileId;

  await storage.local.sensitive('identityInfo', identity);
}

export async function onIdentityInfoChanged(oldInfo: IdentityInfo, newInfo: IdentityInfo) {
  if (oldInfo?.token && (!newInfo || !newInfo.token || !newInfo.fileId)) {
    await SyncWorker.deregister();

    return SyncWorker.removeCache(oldInfo.token);
  }

  if (newInfo?.token && (await SyncWorker.validate(newInfo))) {
    if (!oldInfo?.token && newInfo.applicationId && newInfo.applicationId !== await core.getApplicationId()) {
      return SyncWorker.register(1);
    }

    return SyncWorker.register();
  }

  return await SyncWorker.deregister();
}

export async function onAppDisconnected() {
  await PushWorker.deregister();
  await chrome.storage.session.set({ pushInfo: new Date().getTime() });

  return PushWorker.register(1);
}

export async function onAppConnected(port: chrome.runtime.Port) {
  if (port.name === PushWorker.name) {
    port.onDisconnect.addListener(async () => onAppDisconnected());
  }
}

export async function onIdleActiveStateChanged() {
  const alarms = await chrome.alarms.getAll();
  const pushAlarm = alarms?.find(i => i.name === PushWorker.name);
  const syncAlarm = alarms?.find(i => i.name === SyncWorker.name);

  if (!pushAlarm && syncAlarm && await SyncWorker.validate()) {
    const now = new Date().getTime();
    const period = ((PushWorker.period * 2) * 6e+4);
    const scheduled = new Date(syncAlarm.scheduledTime);
    const start = new Date(now - period);
    const end = new Date(now + period);

    if (scheduled < start || scheduled > end) {
      await PushWorker.deregister();
      await chrome.storage.session.remove(PushWorker.infoKey);

      return PushWorker.register();
    }
  }
}
