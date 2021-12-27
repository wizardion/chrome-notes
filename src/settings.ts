import './styles/settings.scss';
import storage from './modules/storage/storage';

var mode:number = Number(storage.get('mode', true) || '0');

function viewChanged(event: Event) {
  storage.set('mode', this.value, true);
}

(() => {
  var views:NodeList = document.querySelectorAll('input[name="views"]');
  var view:HTMLInputElement = <HTMLInputElement>views[mode];

  if (isPopUpView()) {
    var backBtn:HTMLElement = document.getElementById('back');
    backBtn.style.display = '';
  }
  
  for (let i = 0; i < views.length; i++) {
    const element: HTMLInputElement = <HTMLInputElement>views[i];
    
    element.onclick = viewChanged;
  }
  
  view.checked = true;
})();

function isPopUpView(): boolean {
  var queryString = window.location.search;
  var urlParams = new URLSearchParams(queryString);
  var viewMode = urlParams.get('mode')

  return viewMode === 'popup';
}
