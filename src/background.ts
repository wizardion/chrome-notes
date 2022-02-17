import idb from './modules/db/idb';
import {IDBNote} from './modules/db/interfaces';
import {migrate} from './modules/storage/migrate';

var notes: IDBNote[];
var time: number;

interface IWindow {
  top: number;
  left: number;
  width: number;
  height: number;
}

chrome.runtime.onInstalled.addListener(function() {
  console.log('app was installed');
  chrome.alarms.clearAll((alarm) => {});

  chrome.alarms.create('alert', {periodInMinutes: 1});
  chrome.alarms.create('sync', {periodInMinutes: 2});

  chrome.storage.local.get(['mode', 'migrate', 'oldNotes'], function(result) {
    if (result.migrate && result.oldNotes) {
      migrate(result.oldNotes);
      return chrome.storage.local.clear();
    }
    
    if (result.migrate) {
      chrome.action.setPopup({popup: ''}, ()=>{});
      chrome.storage.local.set({mode: 4});
      return chrome.tabs.create({url: chrome.runtime.getURL('migration.html')});
    }

    setPopup(Number(result.mode));
  });
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   // 2. A page requested user data, respond with a copy of `user`
//   if (message === 'get-user-data') {
//     if (notes) {
//       sendResponse(notes);
//     } else {
//       sendResponse(null);
//       // initNotes(sendResponse);
//     }
//   }
// });

// chrome.runtime.onConnect.addListener(function(port) {
//   port.onMessage.addListener(function(msg) {
//     if (msg.joke === "Knock knock") {
//       port.postMessage({joke: "notes", notes: notes});
//     }
//   });
// });

// chrome.tabs.onRemoved.addListener((tabId: number) => {
//   chrome.storage.local.get('tabInfo', function(result) {
//     if (result.tabInfo && result.tabInfo.id === tabId) {
//       console.log('remove.tabInfo');
//       chrome.storage.local.remove('tabInfo');
//     }
//   });
// });

// chrome.tabs.onDetached.addListener((tabId: number) => {
//   chrome.storage.local.get('tabInfo', function(result) {
//     if (result.tabInfo && result.tabInfo.id === tabId) {
//       console.log('remove.tabInfo');
//       chrome.storage.local.remove('tabInfo');
//     }
//   });
// });

// chrome.tabs.onAttached.addListener((tabId: number) => {
//   findTab(tabId, (tab: chrome.tabs.Tab) => {
//     console.log('onAttached.save.info', tab);
//   });
// });

// chrome.tabs.onUpdated.addListener((tabId: number, info: object) => {
//   console.log('onUpdated', tabId, info);
// });

chrome.action.onClicked.addListener(() => {
  var url = chrome.runtime.getURL('popup.html');

  chrome.storage.local.get(['mode', 'window', 'migrate'], function(result) {
    let mode: number = Number(result.mode);
    let window: IWindow = result.window;

    if (result.migrate) {
      return openMigration();
    }

    openPopup(mode, window);

    // -----------------------------------------------------------------------------------------------
    // if (result.tabInfo) {
    //   getOpenedTab(result.tabInfo.id, (tab: chrome.tabs.Tab) => {
    //     console.log('update.tab', tab);
    //     // chrome.storage.local.remove('tabInfo');
    //   }, () => {
    //     console.log('not.found.create');
    //     chrome.tabs.create({url: chrome.runtime.getURL('popup.html')});
    //   });
    // } else {
    //   console.log('first.create');
    //   chrome.tabs.create({url: chrome.runtime.getURL('popup.html')});
    // }
    // -----------------------------------------------------------------------------------------------
    // chrome.tabs.query({url: url, currentWindow: true}, function (tabs) {
    //   if (tabs.length) {

    //     let tab = tabs[0];
  
    //     openPopup(mode, window, tab && tab.id);
    //   } else {
    //     chrome.tabs.query({url: url}, function (allTabs) {
    //       let tab = allTabs[0];
          
    //       openPopup(mode, window, tab && tab.id, tab && tab.windowId);
    //     });
    //   }
    // });
  });
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
    if (key === 'mode' && oldValue !== newValue) {
      setPopup(Number(newValue));
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'get-sync-notes') {
    sendResponse({working: !!notes, time: time});
  }
});

chrome.runtime.onUpdateAvailable.addListener(function() {
  console.warn('update is available');
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  time = new Date().getTime();

  if (alarm.name === 'sync') {
    return startSync();
  } else {
    chrome.storage.local.get(['mode'], function(result) {
      setPopup(Number(result.mode));
    });
  }
});

// function getOpenedTab(tabId: number, findback: Function, noneback?: Function) {
//   chrome.tabs.query({}, function (tabs) {
//     for(let i = 0; i < tabs.length; i++) {
//       if (tabs[i].id === tabId) {
//         return findback(tabs[i]);
//       }
//     }

//     if (noneback) {
//       noneback();
//     }
//   });
// }

function initNotes(callback?: Function) {
  idb.getSync((data: IDBNote[]) => {
    notes = data;

    if (callback && notes) {
      callback(notes);
    }
  });
}

function startSync() {
  initNotes((notes: IDBNote[]) => {
    console.log('startSync.notes', notes.length);

    for (let i = 0; i < notes.length; i++) {
      const item: IDBNote = notes[i];
      
      // console.log('note:', {
      //   'id': item.id,
      //   'title': item.title,
      //   'sync': item.sync,
      // });

      chrome.storage.sync.set(item);
    }
  });
}

function setPopup(mode: number) {
  if (mode === 3 || mode === 4) {
    chrome.action.setPopup({popup: ''}, ()=>{});
  } else {
    chrome.action.setPopup({popup: 'popup.html'}, ()=>{});
  }
}

function openPopup(mode: number, window?: IWindow, tabId?: number, windowId?: number) {
  if (tabId) {
    if (windowId) {
      chrome.windows.update(windowId, {focused: true});
    }

    return chrome.tabs.update(tabId, {active: true});
  }

  if (mode === 3) {
    return chrome.tabs.create({url: chrome.runtime.getURL('popup.html')});
  }

  if (mode === 4) {
    if (window) {
      chrome.windows.create({
        focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup',
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      });
    } else {
      chrome.windows.create({focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup'});
    }
  }
}

function openMigration() {
  var url = chrome.runtime.getURL('migration.html');

  chrome.tabs.query({url: url, currentWindow: true}, function (tabs) {
    if (tabs.length) {
      let tab = tabs[0];
      
      chrome.tabs.update(tab.id, {active: true});
    } else {
      chrome.tabs.query({url: url}, function (allTabs) {
        if (tabs.length) {
          let tab = allTabs[0];

          if (tab.windowId) {
            chrome.windows.update(tab.windowId, {focused: true});
          }
      
          chrome.tabs.update(tab.id, {active: true});
        } else {
          chrome.tabs.create({url: url});
        }
      });
    }
  });
}
