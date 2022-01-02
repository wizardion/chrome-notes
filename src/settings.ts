import './styles/settings.scss';
import storage from './modules/storage/storage';

var mode:string = storage.get('mode', true) || '0';
var popupMode:string = storage.get('popupMode');
var backBtn:HTMLElement;


function initBackButton() {
  backBtn = document.getElementById('back');
  backBtn.style.display = '';
}

function getBackButtonVisibility(md: number, value: number): string {
  var index = [0, 1, 2, 3, 4].indexOf(md);

  if ((index >= 3 && md !== value) || (index < 3 && value >= 3)) {
    return 'none';
  }

  return '';
}

function viewChanged() {
  if (backBtn) {
    backBtn.style.display = getBackButtonVisibility(Number(mode), Number(this.value));
  }

  if (chrome && chrome.action && chrome.storage) {
    if (this.value === '3' || this.value === '4') {
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

  if(popupMode) {
    initBackButton();
  }
  
  for (let i = 0; i < views.length; i++) {
    const view: HTMLInputElement = <HTMLInputElement>views[i];

    if (view.value === mode) {
      view.checked = true;
    }
    
    view.onchange = viewChanged;
  }

  storage.remove('popupMode');
})();
