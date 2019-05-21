class SearchModule extends Module {
  constructor(listControls) {
    super();

    this.notes = null;
    this.element = null;
    this.listControls = listControls;
  }

  init(value=null) {
    this.element = document.createElement('input');

    this.element.type = 'text';
    this.element.className = 'search-notes';
    this.element.placeholder = 'Enter keyword';
    this.element.maxLength = 30;
    this.element.value = value;
    
    this.listControls.appendChild(this.element);
    this.element.focus();

    if(this.element.value) {
      this.value = this.element.value.trim().toLowerCase();
    }

    this.events = {
      oninput: this._inputhandler.bind(this),
      onkeyup: this._keyuphandler.bind(this),
      onblur: this._blurhandler.bind(this),
    };

    document.addEventListener('input', this.events.oninput);
    document.addEventListener('keyup', this.events.onkeyup);
    document.addEventListener('blur', this.events.onblur);

    this.$busy = true;
  }

  start() {
    if (!this.$busy) {
      this.init();

      for (var i = 0; i < this.notes.length; i++) {
        const item = this.notes[i].self;
        this.lockItem(item);
      }
    } else {
      this.element.focus();
    }
  }

  focus() {
    this.element.focus();
  }

  search() {
    for (var i = 0; i < this.notes.length; i++) {
      const item = this.notes[i];

      item.self.style.display = this.matched(item)? '' : 'none';
    }
  }

  lockItem(item) {
    item.sortButton.disabled = true;
    item.sortButton.setAttribute('disabled', 'disabled');
  }

  complete() {
    document.removeEventListener('input', this.events.oninput);
    document.removeEventListener('keyup', this.events.onkeyup);
    document.removeEventListener('blur', this.events.blur);
  
    this.listControls.removeChild(this.element);
    localStorage.removeItem('searching');
  
    for (var i = 0; i < this.notes.length; i++) {
      const item = this.notes[i];

      item.self.sortButton.disabled = false;
      item.self.sortButton.removeAttribute('disabled');
    }

    this.element = null;
    this.events = null;
    this.$busy = false;
  }

  matched(item) {
    var t_index = item.title.toLowerCase().indexOf(this.value);
    var d_index = item.description.toLowerCase().indexOf(this.value);
  
    return (t_index !== -1 || d_index !== -1);
  }

  _cancel() {
    for (var i = 0; i < this.notes.length; i++) {
      this.notes[i].self.style.display = '';
    }
  }

  _inputhandler(){
    this.value = this.element.value.trim().toLowerCase();

    if (this.value.length > 0) {
      this.search();
    } else {
      this._cancel();
    }
  
    localStorage.searching = this.element.value;
  }

  _keyuphandler(e){
    e.preventDefault();

    if (e.keyCode == 27) {
      this._cancel();
      this.complete();
      return false;
    }
  }

  _blurhandler(e) {
    if (this.searchMode.input.value.trim().length === 0) {
      this.complete();
    }
  }
}
