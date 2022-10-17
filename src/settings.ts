import './styles/settings.scss';
import storage from './modules/storage/storage';
import {Encryptor} from './modules/encryption/encryptor';
import {config, SettingsControls} from './modules/interfaces';
import {Logger} from './modules/logger/logger';
import {ILog} from './modules/logger/interfaces';
import {IDBNote} from './modules/db/interfaces';
import * as idb from './modules/db/idb';
import {wait, resync, initApplication, start} from './modules/sync/sync';
import * as lib from './modules/sync/lib';
// import {migrate} from './modules/storage/migrate';

type StorageChange = chrome.storage.StorageChange;
type AreaName = chrome.storage.AreaName;
const logger: Logger = new Logger('settings.ts');
const controls: SettingsControls = new SettingsControls();


(() => {
  controls.buttons.generate.disabled = true;
  controls.inputs.password.disabled = true;

  // controls.buttons.lock.addEventListener('click', event.bind(controls.buttons.lock, lockData));
  controls.buttons.printLogs.addEventListener('click', event.bind(controls.buttons.printLogs, printLogs));
  controls.buttons.clearLogs.addEventListener('click', event.bind(controls.buttons.clearLogs, clearLogs));
  controls.buttons.erase.addEventListener('click', event.bind(controls.buttons.erase, eraseData));
  controls.buttons.cancel.addEventListener('click', event.bind(controls.buttons.cancel, cancel));
  controls.checkboxes.sync.addEventListener('change', event.bind(controls.checkboxes.sync, syncChanged));
  controls.checkboxes.dev.addEventListener('change', event.bind(controls.checkboxes.dev, devModeChanged));
  controls.inputs.password.addEventListener('input', event.bind(controls.inputs.password, keyChanged));

  controls.blocks.maxItems.innerText = (chrome.storage.sync.MAX_ITEMS - 12).toString();
  controls.blocks.maxEach.innerText = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 192).toString();
  controls.blocks.maxBytes.innerText = bytesToSize(chrome.storage.sync.QUOTA_BYTES - 0).toString();

  chrome.storage.local.get(['syncEnabled', 'restItems', 'syncProcessing', 'lastSync', 'devMode', 'internalKey'], async (local) => {
    controls.checkboxes.sync.checked = (local.syncEnabled === true);
    controls.checkboxes.dev.checked = (local.devMode === true);
    controls.blocks.syncedTime.innerText = local.lastSync? new Date(local.lastSync).toLocaleString() : '...';

    if (await checkKey(local.internalKey)) {
      controls.inputs.password.value = local.internalKey || '';
      config.internalKey = local.internalKey;
    }

    toggleSync((local.syncEnabled === true));
    devModeChanged.call(controls.checkboxes.dev);
    fillProgress(local.restItems || 0);

    if (local.syncProcessing) {
      controls.blocks.lockIndicator.classList.add('red');
      controls.blocks.lockTitle.textContent = 'Sync is processing...';
    }
    
    storage.cached.get('mode').then((cache) => {
      let mode = cache.mode.value || 0;
  
      for (let i = 0; i < controls.blocks.views.length; i++) {
        const view: HTMLInputElement = <HTMLInputElement>controls.blocks.views[i];
    
        if (parseInt(view.value) === mode) {
          view.checked = true;
        }
        
        view.addEventListener('change', event.bind(view, viewChanged));
      }
    });
  });

  // TODO removes temp variable passed to this page.
  chrome.storage.onChanged.addListener(eventOnStorageChanged);
})();

function event(fn: () => void, e: Event) {
  var disabled = this.disabled;

  if (!disabled) {
    fn.call(this);
  }

  e.preventDefault();
}

async function eventOnStorageChanged(changes: {[key: string]: StorageChange}, namespace: AreaName) {
  // logger.info('1. settings: eventOnStorageChanged');
  if (!config.processing && !config.lock && namespace === 'local') {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
      if (key === 'syncProcessing' && oldValue !== newValue) {
        if (newValue) {
          controls.blocks.lockIndicator.classList.add('red');
          controls.blocks.lockTitle.textContent = 'Sync is processing...';
        } else {
          var local = await chrome.storage.local.get(['restItems', 'internalKey']);

          logger.info('eventOnStorageChanged', local);
          printLogs();
          fillProgress(local.restItems || 0);
          await checkKey(local.internalKey);

          controls.blocks.lockIndicator.classList.remove('red');
          controls.blocks.lockTitle.textContent = '';
        }
      }

      if (key === 'lastSync' && oldValue !== newValue) {
        controls.blocks.syncedTime.innerText = newValue? new Date(newValue).toLocaleString() : '...';
      }
    }
  }
}

async function devModeChanged() {
  if (this.checked) {
    controls.blocks.devInfo.classList.remove('hidden');
    // controls.blocks.keyInfo.classList.remove('hidden');
  } else {
    controls.blocks.devInfo.classList.add('hidden');
    // controls.blocks.keyInfo.classList.add('hidden');
  }

  await chrome.storage.local.set({devMode: this.checked});
  await wait();
  // await sendSettings();
}

async function syncChanged() {
  toggleSync(this.checked);

  if (this.checked) {
    if (!config.lock && config.internalKey && await checkKey(config.internalKey)) {
      await chrome.alarms.clear('sync');
      chrome.alarms.create('sync', {periodInMinutes: config.periodInMinutes});
    }
  } else {
    await chrome.alarms.clear('sync');
  }

  await chrome.storage.local.set({syncEnabled: this.checked});
  await storage.cached.permanent('syncEnabled', this.checked);
  await wait();
}

function toggleSync(enabled?: boolean) {
  if (enabled) {
    controls.blocks.info.classList.remove('hidden');
    controls.blocks.keyInfo.classList.remove('hidden');
  } else {
    controls.blocks.info.classList.add('hidden');
    controls.blocks.keyInfo.classList.add('hidden');
  }
}

async function viewChanged() {
  const mode = parseInt(this.value);
  // if (controls.buttons.back) {
  //   controls.buttons.back.style.display = getBackButtonVisibility(Number(mode), Number(this.value));
  // }

  if (mode === 3 || mode === 4) {
    chrome.action.setPopup({popup: ''});
  } else {
    chrome.action.setPopup({popup: 'popup.html'});
  }

  await storage.cached.permanent('mode', mode);
}

function cancel() {
  controls.inputs.password.value = config.internalKey;
  controls.buttons.save.disabled = true;
  controls.buttons.cancel.disabled = true;
}

async function eraseData() {
  if (confirm('Are you sure to delete all data?\nAll sync and locked notes will be lost...')) {
    //TODO remove locked data as well.
    controls.buttons.erase.setAttribute('disabled', 'disabled');

    chrome.storage.local.clear().finally(() => {
      chrome.storage.sync.clear().finally(async() => {
        storage.cached.empty();
        controls.buttons.erase.removeAttribute('disabled');
          var data: IDBNote[] = await idb.load();
          var applicationId: number = initApplication();
          var deleted: number[] = [];

          for (let i = 0; i < data.length; i++) {
            const item = data[i];

            if (item.locked) {
              item.sync = false;
              item.locked = false;
              item.inCloud = false;

              await idb.update(item);
              deleted.push(item.id);
              // await idb.remove(item.id);
            }
          }
          
          if (deleted.length) {
            await chrome.storage.sync.set({message: {erased: deleted, secretKey: 'new', applicationId: applicationId}});
          }
          
          window.location.reload();
      });
    });
  }
}

async function clearLogs() {
  Logger.clear();
  console.clear();
}

async function printLogs() {
  var cache = await storage.cached.get();
  var local = await chrome.storage.local.get('devMode');

  logger.info('cache', cache);

  if (local.devMode) {
    Logger.load().then((logs: ILog[]) => {
      console.clear();
  
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        
        // if (['base.ts', 'popup.ts', 'db.note.ts'].indexOf(log.name) >= 0) {
        if (1) {
          Logger.print(log);
        }
      }
    });
  }
}

async function keyChanged() {
  var element: HTMLInputElement = this;
  var value = element.value.trim();
  var tester = new RegExp(element.getAttribute('pattern'));

  if ((!value && element.checkValidity()) || config.internalKey && value === config.internalKey) {
    controls.buttons.save.disabled = true;
    controls.buttons.cancel.disabled = true;
    return (controls.blocks.passwordValidator.innerText = '');
  }

  try {
    if (!element.validity.patternMismatch && tester.test(value) && await Encryptor.validate(value)) {
      controls.blocks.passwordValidator.innerText = '';
      controls.buttons.save.disabled = false;

      if (config.internalKey) {
        controls.buttons.cancel.disabled = false;
      }
    } else {
      controls.buttons.save.disabled = true;
      controls.buttons.cancel.disabled = true;
      controls.blocks.passwordValidator.innerText = 'Your password entered is not valid.';
    }
  } catch (error) {
    let message = error.message || 'Your password is not encryptable.'
    
    controls.buttons.save.disabled = true;
    controls.buttons.cancel.disabled = true;
    controls.blocks.passwordValidator.innerText = message;
    element.setCustomValidity(message);
  }
}
// ---------------------------------------------------------------------------------------------------------------------
function unlockControls() {
  if (!config.blocked) {
    controls.buttons.generate.disabled = false;
    controls.inputs.password.disabled = false;
    controls.buttons.save.disabled = true;
    controls.buttons.cancel.disabled = true;
    controls.blocks.unlockMessage.style.display = 'none';
    controls.buttons.save.value = 'Save';
    controls.buttons.save.classList.add('dangerous');
  
    controls.inputs.password.onchange = null;
    controls.buttons.generate.onclick = generateKey;
    controls.buttons.save.onclick = save;
    controls.inputs.password.setCustomValidity('');
  
    controls.blocks.locked.classList.add('hidden');
    controls.blocks.unlocked.classList.remove('hidden');
    controls.buttons.cancel.classList.remove('hidden');
  
    config.lock = false;
  } 
}

function lockControls() {
  if (!config.blocked) {
    controls.buttons.generate.disabled = true;
    controls.inputs.password.disabled = false;
    controls.blocks.unlockMessage.style.display = 'inherit';
    controls.buttons.save.value = 'Unlock';
    controls.buttons.save.classList.remove('dangerous');
    controls.buttons.cancel.classList.add('hidden');

    controls.blocks.locked.classList.remove('hidden');
    controls.blocks.unlocked.classList.add('hidden');

    controls.buttons.save.onclick = unlock;
    controls.inputs.password.value = '';
    controls.inputs.password.focus();

    config.lock = true;
    config.internalKey = null;
  }
}

function blockControls(message: string) {
  controls.inputs.password.disabled = true;
  controls.buttons.generate.disabled = true;
  controls.buttons.save.disabled = true;
  controls.buttons.cancel.disabled = true;
  controls.buttons.erase.disabled = true;
  controls.groups.synchronization.disabled = true;

  controls.buttons.save.onclick = null;
  controls.buttons.printLogs.onclick = null;
  controls.buttons.erase.onclick = null;
  controls.buttons.cancel.onclick = null
  controls.buttons.generate.onclick = null
  controls.checkboxes.sync.onchange = null;
  controls.checkboxes.dev.onchange = null
  controls.inputs.password.oninput = null;

  controls.blocks.passwordValidator.innerText = message;

  config.blocked = true;
  config.internalKey = null;
}

async function generateKey() {
  var key: string = await Encryptor.generateKey();
  var index = Math.floor(Math.random() * key.length - 1);

  controls.inputs.password.value = [key.slice(0, index), '-', key.slice(index)].join('');
  controls.blocks.passwordValidator.innerText = '';
  controls.buttons.save.disabled = false;
  controls.buttons.cancel.disabled = false;
}

async function save() {
  if (!config.lock && config.internalKey) {
    var sync = await chrome.storage.sync.get('secretKey');
    var verified = await new Encryptor(config.internalKey).verify(sync.secretKey);

    if (!verified) {
      return blockControls('Looks like you have incorrect initial key! Please refresh this page and start over.');
    }
  }

  await resyncData();
}

function lock() {
  lockControls();
  chrome.storage.local.set({internalKey: null});
  storage.cached.permanent('internalKey', null);
  controls.inputs.password.value = '';
}

async function unlock() {
  const element: HTMLInputElement = controls.inputs.password;
  const valueKey = element.value.trim();
  const sync = await chrome.storage.sync.get('secretKey');
  const cryptor = new Encryptor(valueKey);

  try {
    if (await cryptor.verify(sync.secretKey)) {
      controls.buttons.save.disabled = true;
      await unlockData(valueKey);
    } else {
      controls.buttons.save.disabled = true;
      controls.blocks.passwordValidator.innerText = 'Your password entered is incorrect.';
      element.setCustomValidity('Your password entered is incorrect.');
    }
  } catch (error) {
    controls.buttons.save.disabled = true;
    controls.blocks.passwordValidator.innerText = error.message;
    element.setCustomValidity(error.message);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
async function checkKey(internalKey?: string) {
  const key = internalKey || (await chrome.storage.local.get('internalKey') || {}).internalKey;
  const sync = await chrome.storage.sync.get('secretKey');

  if (!sync.secretKey || (key && await new Encryptor(key).verify(sync.secretKey))) {
    unlockControls();
    return true;
  } else {
    lockControls();
    return false;
  }
}

function fillProgress(count: number) {
  const colors: {[key: number]: string} = {0: 'green', 65: 'yellow', 85: 'red-fill'}
  const max_sync_items: number = lib.default.max;
  const percentage: number = count? Math.ceil(100 - (count / max_sync_items * 100)) : 0;
  const colorKeys = Object.keys(colors);

  for (let i = colorKeys.length - 1; i >= 0; i--) {
    const key = parseInt(colorKeys[i]);
    const color = colors[key];

    if (percentage >= key) {
      controls.blocks.progressThumb.classList.add(color);
      break;
    }
  }

  controls.blocks.progressThumb.style.width = `${percentage}%`;
  controls.blocks.progressThumb.parentElement.setAttribute('title', `your storage is full on ${percentage}%`);
}

function bytesToSize(bytes: number) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = Math.floor(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}

function getBackButtonVisibility(md: number, value: number): string {
  var index = [0, 1, 2, 3, 4].indexOf(md);

  if ((index >= 3 && md !== value) || (index < 3 && value >= 3)) {
    return 'none';
  }

  return '';
}

// async function sendSettings() {
//   var sync = await chrome.storage.sync.get('settings');
//   var local = await chrome.storage.local.get(['syncEnabled', 'devMode']);

//   var settings = {
//     syncEnabled: local.syncEnabled,
//     mode: local.mode,
//     devMode: local.devMode,
//   };

//   if (!sync.settings || (sync.settings.syncEnabled !== local.syncEnabled || sync.settings.devMode !== local.devMode)) {
//     await wait();
//     await chrome.storage.sync.set({settings: settings});
//     await logger.info('send settings', settings);
//   }
// }

async function resyncData() {
  var local: any;
  var internalKey = controls.inputs.password.value;

  controls.groups.synchronization.setAttribute('disabled', 'disabled');
  controls.blocks.progressThumb.classList.add('animate');
  controls.buttons.erase.disabled = true;

  var animationiteration = async () => {
    controls.blocks.progressThumb.classList.remove('animate');
    controls.groups.synchronization.removeAttribute('disabled');
    controls.blocks.progressThumb.removeEventListener('animationiteration', animationiteration);
    controls.buttons.erase.disabled = false;
    controls.buttons.save.disabled = true;
    controls.buttons.cancel.disabled = true;

    
    fillProgress(local && local.restItems || 0);
    controls.blocks.syncedTime.innerText = local && local.lastSync? new Date(local.lastSync).toLocaleString() : '...';

    config.processing = false;
    config.internalKey = internalKey;
  }

  try {
    config.processing = true;

    await wait();
    await resync(config.internalKey, internalKey);

    await chrome.storage.local.set({internalKey: internalKey});
    await storage.cached.permanent('internalKey', 'exists');
    logger.info('save-changes:', internalKey);

    // TODO unlock DB Data!
    await chrome.alarms.clear('sync');
    chrome.alarms.create('sync', {periodInMinutes: config.periodInMinutes});
    local = await chrome.storage.local.get(['restItems', 'lastSync']);
  } catch (error) {
    logger.error('Error unlocking data', error);
    controls.blocks.passwordValidator.innerText = 'Error re-syncing data! Please see dev console for details.';
  } finally {
    controls.blocks.progressThumb.addEventListener('animationiteration', animationiteration);
  }
}

async function unlockData(internalKey: string) {
  var local: any;

  controls.groups.synchronization.setAttribute('disabled', 'disabled');
  controls.blocks.progressThumb.classList.add('animate');
  controls.buttons.erase.disabled = true;

  var animationiteration = async () => {
    controls.blocks.progressThumb.classList.remove('animate');
    controls.groups.synchronization.removeAttribute('disabled');
    controls.blocks.progressThumb.removeEventListener('animationiteration', animationiteration);
    controls.buttons.erase.disabled = false;
    controls.buttons.save.disabled = true;
    controls.buttons.cancel.disabled = true;

    unlockControls();
    fillProgress(local && local.restItems || 0);
    controls.blocks.syncedTime.innerText = local && local.lastSync? new Date(local.lastSync).toLocaleString() : '...';

    config.processing = false;
    config.internalKey = internalKey;
  };

  try {
    config.processing = true;

    await wait();
    await start(internalKey);

    await chrome.storage.local.set({internalKey: internalKey});
    await storage.cached.permanent('internalKey', 'exists');
    logger.info('save-changes:', internalKey);

    // TODO unlock DB Data!
    await chrome.alarms.clear('sync');
    chrome.alarms.create('sync', {periodInMinutes: config.periodInMinutes});
    local = await chrome.storage.local.get(['restItems', 'lastSync']);
  } catch (error) {
    logger.error('Error unlocking data', error);
    controls.blocks.passwordValidator.innerText = 'Error unlocking data! Please see dev console for details.';
  } finally {
    controls.blocks.progressThumb.addEventListener('animationiteration', animationiteration);
  }
}
