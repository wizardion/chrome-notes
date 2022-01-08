import './styles/migration.scss';
import {migrate} from './modules/storage/migrate';


var oldNotes: string;

(() => {
  chrome.storage.local.get(['migrate'], function(result) {
    oldNotes = localStorage.notes || result.oldNotes;

    if (!oldNotes) {
      clearInterface();
    } else {
      countDown();
    }

    document.body.style.display = 'initial';
    document.body.parentElement.style.display = 'initial';
  });
})();

function clearInterface() {
  var html = document.body.parentElement;
  var body = document.createElement('body');
  var close = document.createElement('input');

  close.type = 'button';
  close.classList.add('close');
  close.value = 'Close';
  close.onclick = closeWindow;
  
  document.body.remove();
  body.appendChild(close);
  html.appendChild(body);
}

function closeWindow() {
  window.close();
}

function cancelMigration(countdown: HTMLElement, interval: NodeJS.Timeout, e: PointerEvent) {
  e.preventDefault();
  clearInterval(interval);

  countdown.classList.add('disabled');
  this.setAttribute('disabled', 'disabled');
}

function countDown() {
  var seconds: number = 30;
  var interval: NodeJS.Timeout;
  var countdown: HTMLElement = document.getElementById('countdown');
  var countdownSeconds: HTMLElement = document.getElementById('countdown-seconds');
  var countdownCancel:HTMLElement = document.getElementById('countdown-cancel');
  var progress = document.getElementById('progress');

  countdown.classList.remove('hidden');
  interval = setInterval(() => {
    if (!--seconds) {
      countdown.classList.add('hidden');
      progress.classList.remove('hidden');
      clearInterval(interval);
      startMigration();
    }

    countdownSeconds.innerText = seconds.toString();
  }, 1000);

  countdownCancel.onclick = cancelMigration.bind(countdownCancel, countdown, interval);
}

function startMigration() {
  var progressThumb = document.getElementById('progress-thumb');
  
  setTimeout(() => {
    progressThumb.classList.remove('hidden');
    startMigrate();
  }, 1000);
}

function startMigrate() {
  var whatsnew = document.getElementById('whats-new');
  var finished = document.getElementById('finished');
  var progress = document.getElementById('progress');

  migrate(oldNotes);
  
  setTimeout(() => {
    progress.classList.add('hidden');
    finished.classList.remove('hidden');
    whatsnew.classList.remove('hidden');

    chrome.storage.local.clear();
    localStorage.clear();
  }, 8000);  
}
