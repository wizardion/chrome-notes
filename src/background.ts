import db from './modules/db/db'

chrome.runtime.onInstalled.addListener(function() {
  console.log('app installed', db.add);

  chrome.alarms.getAll((alarms) => {
    console.log('all', alarms);
  });

  chrome.alarms.clearAll((aaa) => {
    console.log('removed', aaa);
  });

  // chrome.alarms.create('start-1', {periodInMinutes: 1});
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log("Got an alarm!", {
    'name': alarm.name,
    'periodInMinutes': alarm.periodInMinutes,
    'scheduledTime': new Date(alarm.scheduledTime).toLocaleTimeString()
  });
});

// chrome.storage.local.get('signed_in', function(data) {
//   if (data.signed_in) {
//     chrome.browserAction.setPopup({popup: 'popup.html'});
//   } else {
//     chrome.browserAction.setPopup({popup: 'popup_sign_in.html'});
//   }
// });