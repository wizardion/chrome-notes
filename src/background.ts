import idb from './modules/db/idb';
import {IDBNote} from './modules/db/interfaces';

var notes: IDBNote[];
var time: number;

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'get-sync-notes') {
    sendResponse({working: !!notes, time: time});
  }
});

chrome.runtime.onUpdateAvailable.addListener(function() {
  console.warn('update is available');
});

chrome.runtime.onInstalled.addListener(function() {
  console.log('app was installed');
  chrome.alarms.clearAll((alarm) => {});

  chrome.alarms.create('alert', {periodInMinutes: 1});
  chrome.alarms.create('sync', {periodInMinutes: 0.5});
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  time = new Date().getTime();

  if (alarm.name === 'sync') {
    return startSync();
  }
});

function initNotes(callback?: Function) {
  if (!notes) {
    return idb.getSync((data: IDBNote[]) => {
      notes = data;

      if (callback && notes) {
        callback(notes);
      }
    });
  }

  if (callback) {
    callback(notes);
  }
}

function startSync() {
  initNotes((notes: IDBNote[]) => {
    for (let i = 0; i < notes.length; i++) {
      const item = notes[i];
      
      console.log('note:', item);
    }

    // console.log('notes', notes);
    // notes.forEach((item: IDBNote)=> {
    //   console.log('note:', item);
    // });
  });
}

// chrome.storage.local.get('signed_in', function(data) {
//   if (data.signed_in) {
//     chrome.browserAction.setPopup({popup: 'popup.html'});
//   } else {
//     chrome.browserAction.setPopup({popup: 'popup_sign_in.html'});
//   }
// });