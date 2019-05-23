class SearchModule extends Controller {
  constructor(button, element) {
    super();

    this.$notes = null;

    this.button = button;
    this.element = element;
    this.settings = localStorage.searching? JSON.parse(localStorage.searching) : {
      value: '',
      visible: false
    };
  }

  /**
   * Property: Notes.
   * 
   * @param {*} value
   * The passed in value.
   * 
   * Sets notes to the controller.
   */
  set notes(value) {
    this.$notes = value;
  }

  /**
   * Init the controller
   * 
   * Init controlls and events  
   */
  init() {
    if (this.settings.visible) {
      this.element.style.display = 'inherit';
      this.element.focus();
    }

    if (this.settings.value) {
      this.element.value = this.settings.value;
      this.$busy = this.settings.visible && this.settings.value.length > 0;
    }

    this.events = {
      oninput: this._inputeventhandler.bind(this),
      keydown: this._keydowneventhandler.bind(this),
      onblur: this._blureventhandler.bind(this),
    };

    this.element.addEventListener('input', this.events.oninput);
    this.element.addEventListener('keydown', this.events.keydown);
    this.element.addEventListener('blur', this.events.onblur);
    this.button.addEventListener('click', this._toggleVisibility.bind(this));
  }

  start() {
    if (!this.$busy) {
      this.init();

      for (var i = 0; i < this.$notes.length; i++) {
        const item = this.$notes[i].self;
        this.lockItem(item);
      }
    } else {
      this.element.focus();
    }
  }

  focus() {
    this.element.focus();
  }

  /**
   * Search notes withing the key
   * 
   * Do search notes living visible only found notes.
   */
  search() {
    for (var i = 0; i < this.$notes.length; i++) {
      const item = this.$notes[i];

      if (this.$busy) {
        this.lockItem(item.self);
      }
      
      item.self.style.display = this.matched(item)? '' : 'none';
    }
  }

  /**
   * Lock the Item
   * 
   * It disables the sorting functionality to prevent unnecessary bad dependencies
   */
  lockItem(item) {
    // item.sortButton.disabled = true;
    item.sortButton.setAttribute('disabled', 'disabled');
  }

  complete() {
    localStorage.removeItem('searching');

    this.element.value = '';
    this.events = null;
    this.$busy = false;
  }

  /**
   * Is Matched
   * 
   * Checks if the item is matched searching functionality
   */
  matched(item) {
    var t_index = item.title.toLowerCase().indexOf(this.settings.value);
    var d_index = item.description.toLowerCase().indexOf(this.settings.value);
  
    return (t_index !== -1 || d_index !== -1);
  }

  //#region Privat Methods
  _toggleVisibility() {
    if (this.settings.visible) {
      this._hide();
      this._cancel();
    } else {
      this._show();
    }

    localStorage.searching = JSON.stringify(this.settings);
  }

  _show(){
    this.$busy = this.settings.value.length > 0;
    this.settings.visible = true;
    this.element.style.display = 'inherit';
    this.element.focus();
    this.search();
  }

  _hide() {
    this.settings.visible = false;
    this.element.style.display = 'none';
  }

  _cancel() {
    this.$busy = false;
    this._hide();

    for (var i = 0; i < this.$notes.length; i++) {
      const item = this.$notes[i];

      item.self.style.display = '';
      item.self.sortButton.disabled = false;
      item.self.sortButton.removeAttribute('disabled');
    }
  }
  //#endregion

  //#region Event Handlers
  _inputeventhandler(){
    this.settings.value = this.element.value.trim().toLowerCase();
    this.$busy = this.settings.value.length > 0;

    if (this.settings.value.length > 0) {
      this.search();
    } else {
      this._cancel();
    }

    localStorage.searching = JSON.stringify(this.settings);
  }

  _keydowneventhandler(e){
    // Escape pressed
    if (e.keyCode == 27) {  
      e.stopImmediatePropagation();
      e.preventDefault();

      this._cancel();
      this.complete();
      return false;
    }
  }

  _blureventhandler(e) {
    e.stopImmediatePropagation();
    e.preventDefault();

    if (this.settings.visible) {
      setTimeout(this.element.focus.bind(this.element), 10);
    }
  }
  //#endregion
}
