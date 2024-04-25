import './assets/migration.scss';
// import { migrate } from 'core/utils/migrate';

function closeWindow() {
  window.close();
}

chrome.storage.local.get(['migrate', 'oldNotes']).then(async (local) => {
  const content = document.getElementById('content') as HTMLDivElement;
  const closeBtn = document.getElementById('close-window') as HTMLInputElement;
  const oldNotes = localStorage.notes || local.oldNotes;

  content.hidden = false;
  closeBtn.disabled = false;

  closeBtn.addEventListener('click', () => closeWindow());
});

// chrome.storage.local.get(['migrate', 'oldNotes'], function(result) {
//   oldNotes = localStorage.notes || result.oldNotes;

//   console.log('result', result);
//   console.log('localStorage.notes', localStorage.notes);

//   countDown();

//   document.body.style.display = 'initial';
//   document.body.parentElement.style.display = 'initial';
// });


// let oldNotes: string;

// async function startMigrate() {
//   const whats = document.getElementById('whats-new');
//   const finished = document.getElementById('finished');
//   const progress = document.getElementById('progress');

//   // await migrate(oldNotes);

//   setTimeout(() => {
//     progress.classList.add('hidden');
//     finished.classList.remove('hidden');
//     whats.classList.remove('hidden');

//     // chrome.storage.local.clear();
//     // localStorage.clear();
//   }, 8000);
// }

// function startMigration() {
//   const progressThumb = document.getElementById('progress-thumb');

//   setTimeout(() => {
//     progressThumb.classList.remove('hidden');
//     startMigrate();
//   }, 1000);
// }

// function cancelMigration(countdown: HTMLElement, interval: NodeJS.Timeout, e: PointerEvent) {
//   e.preventDefault();
//   clearInterval(interval);
//   countdown.classList.add('disabled');

//   this.value = ' Start  ';

//   this.onclick = () => {
//     const seconds: number = 30;
//     const countdownSeconds: HTMLElement = document.getElementById('countdown-seconds');

//     countdown.classList.remove('disabled');
//     countdownSeconds.innerText = seconds.toString();
//     this.value = 'Cancel';
//     // countDown();
//   };
// }

// function countDown() {
//   let seconds = 5;
//   const countdown: HTMLElement = document.getElementById('countdown');
//   const countdownSeconds: HTMLElement = document.getElementById('countdown-seconds');
//   const countdownCancel:HTMLElement = document.getElementById('countdown-cancel');
//   const progress = document.getElementById('progress');

//   countdown.classList.remove('hidden');
//   const interval = setInterval(() => {
//     if (!--seconds) {
//       countdown.classList.add('hidden');
//       progress.classList.remove('hidden');
//       clearInterval(interval);
//       startMigration();
//     }

//     countdownSeconds.innerText = seconds.toString();
//   }, 1000);

//   countdownCancel.onclick = cancelMigration.bind(countdownCancel, countdown, interval);
// }

// function closeWindow() {
//   window.close();
// }

// (() => {
//   chrome.storage.local.get(['migrate', 'oldNotes'], function(result) {
//     oldNotes = localStorage.notes || result.oldNotes;

//     console.log('result', result);
//     console.log('localStorage.notes', localStorage.notes);

//     countDown();

//     document.body.style.display = 'initial';
//     document.body.parentElement.style.display = 'initial';
//   });
// })();
