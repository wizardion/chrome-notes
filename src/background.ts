// import db from './modules/db/db'

// document.addEventListener('DOMContentLoaded', function () {
//   db.init();
//   console.log('DOMContentLoaded');
// });

chrome.alarms.create('alarmName', {periodInMinutes: 2});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log("Got an alarm!", {
    'name': alarm.name,
    'periodInMinutes': alarm.periodInMinutes,
    'scheduledTime': new Date(alarm.scheduledTime).toLocaleTimeString()
  });
});