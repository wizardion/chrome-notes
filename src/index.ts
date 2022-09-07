import { tracker } from './modules/notes/components/tracker';
tracker.track('init', 'start');

import {ISTNote} from './modules/notes/components/interfaces';
import {Base} from './modules/notes/base';
import storage from './modules/storage/storage';
import {buildEditor, getSelected} from './screen-builder';
import './styles/style.scss';


tracker.track('init', 'import');
chrome.storage.local.get(['syncEnabled', 'internalKey', 'syncLocked', 'cachedList'], function(local) {
  tracker.track('init', `local.get: ${local.cachedList}`.substring(0, 75) + ' ...');

  var notes: HTMLElement = <HTMLElement>document.getElementById('notes');
  var editor: Base = buildEditor();
  
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

  if (local.syncEnabled && !!local.internalKey && !local.syncLocked) {
    editor.unlock();
  }

  editor.init();
  notes.classList.remove('transparent');

  tracker.track('init', 'Done');
  tracker.print();
});

tracker.track('init', 'chrome.storage');
const isNew = storage.get('new');
const description = storage.get('description');
const selection = storage.get('selection');
const selected:ISTNote = getSelected(storage.get('selected'));

tracker.track('init', 'storage');
