import './styles/settings.scss';
import storage from './modules/storage/storage';
import {Encryptor} from './modules/encryption/encryptor';
import {SettingsControls} from './modules/interfaces';
import * as lib from './modules/sync/lib';
// import {migrate} from './modules/storage/migrate';

const controls: SettingsControls = new SettingsControls();
var mode:string = storage.get('mode', true) || '0';
var popupMode:string = storage.get('popupMode');
var __lock__: boolean = true;
var __internalKey__: string;


(() => {
  if(popupMode) {
    controls.buttons.back.style.display = '';
  }
  
  for (let i = 0; i < controls.blocks.views.length; i++) {
    const view: HTMLInputElement = <HTMLInputElement>controls.blocks.views[i];

    if (view.value === mode) {
      view.checked = true;
    }
    
    view.onchange = viewChanged;
  }

  controls.buttons.generate.disabled = true;
  controls.inputs.password.disabled = true;
  controls.buttons.erase.onclick = (e) => {e.preventDefault(); eraseData();};
  controls.buttons.cancel.onclick = (e) => {e.preventDefault(); cancel();};
  // controls.buttons.lock.onclick = (e) => {e.preventDefault(); lockData();};
  controls.checkboxes.sync.onchange = syncChanged;

  controls.blocks.maxItems.innerText = (chrome.storage.sync.MAX_ITEMS - 12).toString();
  controls.blocks.maxEach.innerText = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 192).toString();
  controls.blocks.maxBytes.innerText = bytesToSize(chrome.storage.sync.QUOTA_BYTES - 0).toString();

  chrome.storage.local.get(['syncEnabled', 'internalKey', 'restSyncedItems'], function(local) {
    controls.checkboxes.sync.checked = (local.syncEnabled === true);
    syncChanged.call(controls.checkboxes.sync);
    fillProgress(local.restSyncedItems || 0);

    chrome.storage.sync.get('secretKey', async (sync) => {
      if (!sync.secretKey || (local.internalKey && await new Encryptor(local.internalKey).verify(sync.secretKey))) {
        controls.inputs.password.value = local.internalKey || '';
        unlockControls(local.internalKey);
      } else {
        lockControls(sync.secretKey);
      }
    });
  });

  // TODO removes temp variable passed to this page.
  storage.remove('popupMode');
})();


function fillProgress(count: number) {
  const colors: {[key: number]: string} = {0: 'green', 65: 'yellow', 85: 'red'}
  const max_sync_items: number = lib.default.max;
  const percentage: number = count? Math.round(100 - (count / max_sync_items * 100)) : 0;
  const colorKeys = Object.keys(colors);

  for (let i = colorKeys.length - 1; i >= 0; i--) {
    const key = parseInt(colorKeys[i]);
    const color = colors[key];

    if (percentage >= key) {
      controls.blocks.progressBar.classList.add(color);
      break;
    }
  }

  controls.blocks.progressBar.style.width = `calc(${percentage}% - 2px)`;
  controls.blocks.progressBar.parentElement.setAttribute('title', `your storage is full on ${percentage}%`);
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

function viewChanged() {
  if (controls.buttons.back) {
    controls.buttons.back.style.display = getBackButtonVisibility(Number(mode), Number(this.value));
  }

  if (chrome && chrome.action && chrome.storage) {
    if (this.value === '3' || this.value === '4') {
      chrome.action.setPopup({popup: ''});
    } else {
      chrome.action.setPopup({popup: 'popup.html'});
    }

    if (chrome && chrome.storage) {
      chrome.storage.local.set({mode: this.value});
    }
  }

  storage.set('mode', this.value, true);
}

function syncChanged() {
  if (this.checked) {
    controls.blocks.info.classList.remove('hidden');
    controls.blocks.keyInfo.classList.remove('hidden');
  } else {
    controls.blocks.info.classList.add('hidden');
    controls.blocks.keyInfo.classList.add('hidden');
  }

  chrome.storage.local.set({syncEnabled: this.checked});
}

function unlockControls(internalKey: string) {
  controls.buttons.generate.disabled = false;
  controls.inputs.password.disabled = false;
  controls.blocks.unlockMessage.style.display = 'none';
  // controls.inputs.password.value = internalKey || '';
  controls.buttons.save.value = 'Save';
  controls.buttons.save.classList.add('dangerous');

  controls.inputs.password.onchange = null;
  controls.buttons.generate.onclick = generateKey;
  controls.inputs.password.oninput = keyChanged;
  controls.buttons.save.onclick = saveChanges;

  controls.blocks.locked.classList.add('hidden');
  controls.blocks.unlocked.classList.remove('hidden');

  __lock__ = false;
  __internalKey__ = internalKey;
}

function lockControls(secretKey: string) {
  controls.buttons.generate.disabled = true;
  controls.inputs.password.disabled = false;
  controls.blocks.unlockMessage.style.display = 'inherit';
  controls.buttons.save.value = 'Unlock';
  controls.buttons.save.classList.remove('dangerous');
  controls.buttons.cancel.classList.add('hidden');

  controls.blocks.locked.classList.remove('hidden');
  controls.blocks.unlocked.classList.add('hidden');

  controls.buttons.save.onclick = null;
  controls.inputs.password.onchange = checkKey.bind(controls.inputs.password, secretKey);
  controls.inputs.password.focus();

  __lock__ = true;
  __internalKey__ = null;
}

function checkKey(secretKey: string) {
  const element: HTMLInputElement = this;
  const value = element.value.trim();
  var cryptor = new Encryptor(value);

  if (!value) {
    controls.blocks.saveMessage.classList.add('hidden');
    controls.blocks.passwordValidator.innerText = '';
    return element.setCustomValidity('');
  }
  
  cryptor.verify(secretKey).then((valid) => {
    if (valid) {
      controls.blocks.saveMessage.classList.remove('hidden');
      controls.blocks.passwordValidator.innerText = '';
      controls.buttons.save.onclick = saveChanges;
      element.setCustomValidity('');
    } else {
      controls.blocks.saveMessage.classList.add('hidden');
      controls.blocks.passwordValidator.innerText = 'Your password entered is incorrect.';
      element.setCustomValidity('Your password entered is incorrect.');
    }
  }).catch((message) => {
    controls.blocks.saveMessage.classList.add('hidden');
    controls.blocks.passwordValidator.innerText = message;
    element.setCustomValidity(message);
  }); 
}

function keyChanged() {
  var element: HTMLInputElement = this;
  var value = element.value.trim();
  var tester = new RegExp(element.getAttribute('pattern'));

  if (__internalKey__ && value === __internalKey__) {
    controls.blocks.saveMessage.classList.add('hidden');
    return (controls.blocks.passwordValidator.innerText = '');
  }

  if (!element.validity.patternMismatch && tester.test(value)) {
    let checker = Encryptor.check(value);

    checker.catch((message) => {
      controls.blocks.passwordValidator.innerText = message;
      element.setCustomValidity(message);
    });

    checker.then(() => {
      controls.blocks.passwordValidator.innerText = '';
      controls.blocks.saveMessage.classList.remove('hidden');

      if (__internalKey__) {
        controls.buttons.cancel.classList.remove('hidden');
      }
    });
  } else {
    controls.blocks.passwordValidator.innerText = 'Your password entered is not valid.';
  }
}

function generateKey() {
  Encryptor.generateKey().then((key: string) => {
    var index = Math.floor(Math.random() * key.length - 1);

    key = [key.slice(0, index), '-', key.slice(index)].join('');
    controls.inputs.password.value = key;
    controls.blocks.passwordValidator.innerText = '';
    controls.blocks.saveMessage.classList.remove('hidden');
  });
}

function saveChanges() {
  var internalKey = controls.inputs.password.value;

  if (__lock__) {
    unlockControls(internalKey);
  }

  chrome.storage.local.set({internalKey: internalKey});
  controls.blocks.saveMessage.classList.add('hidden');
}

function cancel() {
  controls.inputs.password.value = __internalKey__;
  controls.blocks.saveMessage.classList.add('hidden');
}

function lockData() {
  var internalKey = controls.inputs.password.value;

  lockControls(internalKey);
  chrome.storage.local.set({internalKey: null});
  controls.inputs.password.value = '';
}

function eraseData() {
  if (confirm('Are you sure to delete all data? All sync and lock notes will be lost.')) {
    // //TODO remove locked data as well.
    // controls.buttons.erase.setAttribute('disabled', 'disabled');

    // chrome.storage.local.clear().finally(() => {
    //   chrome.storage.sync.clear().finally(async() => {
    //     controls.buttons.erase.removeAttribute('disabled');
    //   });
    // });
  }
}
