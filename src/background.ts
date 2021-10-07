import {DbNote} from './modules/db/note';

chrome.runtime.onInstalled.addListener(function() {
  console.log('app installed');

  chrome.alarms.getAll((alarms) => {
    console.log('all', alarms);
  });

  chrome.alarms.clearAll((aaa) => {
    console.log('removed', aaa);
  });

  chrome.alarms.create('alert', {periodInMinutes: 1});
  chrome.alarms.create('sync', {periodInMinutes: 0.5});
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'sync') {
    return startSync();
  }

  console.log("Got an alarm!", {
    'name': alarm.name,
    'periodInMinutes': alarm.periodInMinutes,
    'scheduledTime': new Date(alarm.scheduledTime).toLocaleTimeString()
  });
});

function startSync() {
  var db = window.openDatabase


  console.log({
    'startSync.db': db
  })
  // var request:IDBOpenDBRequest = indexedDB.open('TsNote', 1);

  // request.onerror = () => {
  //   console.log({
  //     'onerror': 1
  //   });
  // };
  // request.onsuccess = () => {
  //   var db = request.result;

  //   console.log({
  //     'onsuccess': db
  //   });
  // };
  // DbNote.loadSync(sync);
}

// function sync(notes: DbNote[]) {
//   console.log({
//     'notes': notes
//   })
// }

// chrome.storage.local.get('signed_in', function(data) {
//   if (data.signed_in) {
//     chrome.browserAction.setPopup({popup: 'popup.html'});
//   } else {
//     chrome.browserAction.setPopup({popup: 'popup_sign_in.html'});
//   }
// });