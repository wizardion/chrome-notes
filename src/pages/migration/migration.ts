import 'styles/migration.scss';
import { migrate } from 'core/utils/migrate';


let oldNotes: string;

async function startMigrate() {
  const whats = document.getElementById('whats-new');
  const finished = document.getElementById('finished');
  const progress = document.getElementById('progress');

  await migrate(oldNotes);

  setTimeout(() => {
    progress.classList.add('hidden');
    finished.classList.remove('hidden');
    whats.classList.remove('hidden');

    chrome.storage.local.clear();
    localStorage.clear();
  }, 8000);
}

function startMigration() {
  const progressThumb = document.getElementById('progress-thumb');

  setTimeout(() => {
    progressThumb.classList.remove('hidden');
    startMigrate();
  }, 1000);
}

function cancelMigration(countdown: HTMLElement, interval: NodeJS.Timeout, e: PointerEvent) {
  e.preventDefault();
  clearInterval(interval);
  countdown.classList.add('disabled');

  this.value = ' Start  ';

  this.onclick = () => {
    const seconds: number = 30;
    const countdownSeconds: HTMLElement = document.getElementById('countdown-seconds');

    countdown.classList.remove('disabled');
    countdownSeconds.innerText = seconds.toString();
    this.value = 'Cancel';
    // countDown();
  };
}

function countDown() {
  let seconds = 30;
  const countdown: HTMLElement = document.getElementById('countdown');
  const countdownSeconds: HTMLElement = document.getElementById('countdown-seconds');
  const countdownCancel:HTMLElement = document.getElementById('countdown-cancel');
  const progress = document.getElementById('progress');

  countdown.classList.remove('hidden');
  const interval = setInterval(() => {
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

function closeWindow() {
  window.close();
}

function clearInterface() {
  const html = document.body.parentElement;
  const body = document.createElement('body');
  const close = document.createElement('input');

  close.type = 'button';
  close.classList.add('close');
  close.value = 'Close';
  close.onclick = closeWindow;

  document.body.remove();
  body.appendChild(close);
  html.appendChild(body);
}

(() => {
  chrome.storage.local.get(['migrate', 'oldNotes'], function(result) {
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
