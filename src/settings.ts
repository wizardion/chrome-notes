import './styles/settings.scss';
import storage from './modules/storage/storage';

// var mode:number = Number(storage.get('mode', true) || '0');
var mode:string = storage.get('mode', true) || '0';

function viewChanged(event: Event) {
  if (chrome && chrome.action && chrome.storage) {
    if (this.value === '3') {
      chrome.action.setPopup({popup: ''});
    } else {
      chrome.action.setPopup({popup: 'popup.html'});
    }

    if (chrome && chrome.storage) {
      chrome.storage.local.set({mode: this.value});
    }
  }

  storage.set('mode', this.value, true);
}

(() => {
  var views:NodeList = document.querySelectorAll('input[name="views"]');

  if (isPopUpView()) {
    var backBtn:HTMLElement = document.getElementById('back');
    backBtn.style.display = '';
  }
  
  for (let i = 0; i < views.length; i++) {
    const view: HTMLInputElement = <HTMLInputElement>views[i];

    if (view.value === mode) {
      view.checked = true;
    }
    
    view.onclick = viewChanged;
  }
})();

function isPopUpView(): boolean {
  var queryString = window.location.search;
  var urlParams = new URLSearchParams(queryString);
  var viewMode = urlParams.get('mode')

  return viewMode === 'popup';
}
