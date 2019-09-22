class Editor extends TextProcessor {
  constructor (element, controls) {
    super(element);

    this.$value = this.element.innerHTML;
    this.controls = controls;

    this.customEvents = {'change': null};
    this.$helpers = {
      link: new LinkAdapter()
    };

    this.init();

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
  }

  /**
   * Init the controller
   * 
   * Init controlls and events.
   */
  init() {
    for (let i = 0; i < this.controls.length; i++) {
      const item = this.controls[i];
      const action = item.getAttribute('action');
      const helper = this.$helpers[action];

      item.onmousedown = this.$preCommand;

      if (helper) {
        item.onmouseup = helper.command.bind(helper);
      } else {
        item.onmouseup = this.$command;
      }
    }
  }

  $preCommand(e) {
    e.preventDefault();
  }

  $command(e) {
    let action = this.getAttribute('action');

    // cancel event.
    e.preventDefault();
    document.execCommand(action);
  }

  $preProcessInput(e) {
    var selection = window.getSelection();
    var textSelected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;

    // 'Space' or 'Enter'
    if (!textSelected && (e.keyCode === 32 || e.keyCode === 13)) {
      const helper = this.$helpers['link'];
      
      if (helper.test(selection) && helper.exec(selection)) {
        e.preventDefault();
      }
    }
  }

  /**
   * @param {*} value
   * 
   * Sets html value
   */
  set value(value) {
    this.$value = value;
    this.element.innerHTML = this.$value;
  }

  /**
   * Gets html value
   */
  get value() {
    return this.element.innerHTML;
  }

  /**
   * @param {*} name
   * @param {*} callback
   * 
   * Sets html event listener
   */
  addEventListener(name, callback) {
    var event = this.customEvents[name];
    
    if (name in this.customEvents) {
      this.customEvents[name] = callback;
      return;
    }

    this.element.addEventListener(name, callback);
  }

  /**
   * Focus
   * 
   * Sets focus of element
   */
  focus() {
    this.element.focus();
  }

  /**
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
    if (this.element.innerHTML != this.$value && this.customEvents['change']) {
      this.customEvents['change'](super.$onChange());
      this.$value = this.element.innerHTML;
    }
  }
}


