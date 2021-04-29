// import db from './modules/db/db'

chrome.runtime.onInstalled.addListener(function() {
  // console.log('app installed');

  chrome.alarms.getAll((alarms) => {
    console.log('all', alarms);
  });

  chrome.alarms.clearAll((aaa) => {
    console.log('removed', aaa);
  });

  chrome.alarms.create('start-1', {periodInMinutes: 1});
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log("Got an alarm!", {
    'name': alarm.name,
    'periodInMinutes': alarm.periodInMinutes,
    'scheduledTime': new Date(alarm.scheduledTime).toLocaleTimeString()
  });
});