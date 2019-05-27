class NewNote extends Module {
  constructor(controls) {
    super();

    this.events = {};
    this.$valid = false;
    this.showError = null;

    this.controls = {
      title: null,
      save: null,
      cancel: null,
    };

    this.parent = {
      title: controls.title,
      delete: controls.delete,
      back: controls.back,
      description: controls.description,
    };

    this.init();
  }

  /**
   * @param {*} value
   * The passed in value.
   * 
   * Adds event on save
   */
  set onSave(value) {
    this.events.onSave = value;
  }

  /**
   * @param {*} value
   * The passed in value.
   * 
   * Adds event on cancel
   */
  set onCancel(value) {
    this.events.onCancel = value;
  }

  /**
   * Init the controller
   * 
   * Init controlls and events.
   */
  init() {
    this._create();

    this.events.showSaveButton = this._bindHandler(this.controls.save, this._showbuttonhandler);
    document.addEventListener('mousemove', this.events.showSaveButton.event);

    this.events.keyDown = this._inputhandler.bind(this);
    document.addEventListener('keydown', this.events.keyDown);

    this.showError = Validator.bindRequiredAnimation(this.controls.title);
    this.controls.save.onclick = this._savebuttonhandler.bind(this);
    this.controls.cancel.onclick = this._cancelbuttonhandler.bind(this);
    this.controls.title.onkeydown = this._titleinputhandler.bind(this);
    this.controls.title.focus();
  }

  /**
   * Remove the controller
   * 
   * Removes controlls and events.
   */
  remove(force=false) {
    var callback = this.events.onCancel;
    var parent = this.controls.title.parentNode;

    if (force && callback) {
      callback();
    }

    parent.removeChild(this.controls.title);
    parent.removeChild(this.controls.save);
    parent.removeChild(this.controls.cancel);

    this.parent.title.style.display = '';
    this.parent.back.style.display = '';
    this.parent.delete.style.display = '';

    this.events.deleteButton = this._bindHandler(this.parent.delete, this._showbuttonhandler);
    document.addEventListener('mousemove', this.events.deleteButton.event);
    document.removeEventListener('keydown', this.events.keyDown);

    this.showError = null;
    this.events.keyDown = null;
  }

  /**
   * Create controls
   * 
   * Creates new controls and hides parent controls.
   */
  _create() {
    this.controls.title = document.createElement('input');
    this.controls.save = document.createElement('input');
    this.controls.cancel = document.createElement('input');

    this.controls.save.className = 'button save-note';
    this.controls.save.type = 'button';

    this.controls.title.type = 'text';
    this.controls.title.maxLength = 70;
    this.controls.title.className = 'edit-title details';
    this.controls.title.placeholder = 'Enter a Title of Note';

    this.controls.cancel.className = 'button left';
    this.controls.cancel.type = 'button';
    this.controls.cancel.value = 'Cancel';

    this.parent.title.parentNode.appendChild(this.controls.title);
    this.parent.title.parentNode.appendChild(this.controls.save);
    this.parent.title.parentNode.appendChild(this.controls.cancel);

    this.parent.title.style.display = 'None';
    this.parent.delete.style.display = 'None';
    this.parent.back.style.display = 'None';
    this.controls.save.style.visibility = 'hidden';
    this.parent.delete.style.visibility = 'hidden';

    this.parent.description.innerHTML = '';
  }

  /**
   * Bind handler
   * 
   * Binds handler into the new object.
   */
  _bindHandler(control, handler) {
    var event = {
      event: null,
      button: control
    };
    
    event.event = handler.bind(event);
    return event;
  }

  /**
   * Private Method: Save
   * 
   * Saves the new note and removes the controller.
   */
  _save() {
    var callback = this.events.onSave;

    if (this.controls.title.value.trim().length === 0) {
      return this.showError();
    }

    if (callback) {
      callback({
        id: -1,
        title: this.controls.title.value,
        description: this.parent.description.innerHTML,
        displayOrder: -1,
        updated: new Date().getTime()
      });
    }

    this.parent.title.value = this.controls.title.value;
    this.remove();
    this.parent.description.focus();
  }

  /**
   * Handler: ShowButton
   * 
   * @param {*} e
   * Displayes the button when mouse moved out from the button location.
   */
  _showbuttonhandler(e) {
    var y = this.button.offsetTop;
    var x = this.button.offsetLeft;
    var height = this.button.offsetHeight;
    var width = this.button.offsetWidth;

    if(e.pageY < y || e.pageY > (y + height) || e.pageX < x || e.pageX > (x + width)) {
      document.removeEventListener('mousemove', this.event);
      this.button.style.visibility = '';
      this.event = null;
      this.button = null;
    }
  }

  /**
   * Handler: Title Key Down
   * 
   * @param {*} e
   * Chaches the keydown event for saving canceling and move focus.
   */
  _titleinputhandler(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this.parent.description.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      this._save();
    }
  }

  /**
   * Handler: Title Key Down
   * 
   * @param {*} e
   * Chaches the keydown event canceling edit.
   */
  _inputhandler(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.remove(true);
    }
  }

  /**
   * Handler: Save Button
   * 
   * @param {*} e
   * Chaches event of Save Button.
   */
  _savebuttonhandler(e) {
    e.preventDefault();
    this._save();
  }

  /**
   * Handler: Cancel Button
   * 
   * @param {*} e
   * Chaches event of Cancel Button.
   */
  _cancelbuttonhandler(e) {
    e.preventDefault();
    this.remove(true);
  }
}
