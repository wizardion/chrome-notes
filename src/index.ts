import { tracker } from './modules/notes/components/tracker';
tracker.track('init', 'start');

import {ISTNote} from './modules/notes/components/interfaces';
import {Base} from './modules/notes/base';
import storage from './modules/storage/storage';
import {buildEditor, getSelected} from './builder';
import './styles/style.scss';


tracker.track('init', 'import');
chrome.storage.local.get(['syncEnabled', 'internalKey', 'cachedList'], function(local) {
  tracker.track('init', `local.get: ${local.cachedList}`.substring(0, 75) + ' ...');

  var notes: HTMLElement = <HTMLElement>document.getElementById('notes');
  var editor: Base = buildEditor(mode);

  notes.classList.remove('hidden');

  if (local.cachedList) {
    tracker.track('init', `cache`);
    editor.initFromCache(local.cachedList);
  }

  if (isNew) {
    editor.selectNew(description, selection);
  } else if (selected) {
    editor.selectFromCache(selected);
  } else {
    editor.showList();
  }

  if (local.syncEnabled && !!local.internalKey) {
    editor.unlock();
  }

  editor.init();

  notes.classList.remove('transparent');
  
  if (chrome && chrome.storage) {
    chrome.storage.local.get(['mode'], function(result) {
      chrome.storage.local.set({mode: result.mode || '0'});
      storage.set('mode', result.mode || '0', true);
    });
  }

  tracker.track('init', 'Done');
  tracker.print();
});

tracker.track('init', 'chrome.storage');
const mode: number = Number(storage.get('mode', true) || '0');
const isNew = storage.get('new');
const description = storage.get('description');
const selection = storage.get('selection');
const selected:ISTNote = getSelected(storage.get('selected'));

tracker.track('init', 'storage');
