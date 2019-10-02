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
        item.onmouseup = this.$customCommand.bind(this, helper);
      } else {
        item.onmouseup = this.$command;
      }
    }

    document.execCommand('defaultParagraphSeparator', false, 'p');
  }

  /**
   * Internal event: PreCommand.
   * 
   * @param {*} e
   * 
   * Executes before the command to cancel the original event
   */
  $preCommand(e) {
    e.preventDefault();
  }

  /**
   * Internal event: Command.
   * 
   * @param {*} e
   * 
   * Executes the command in editor.
   */
  $command(e) {
    let action = this.getAttribute('action');

    // cancel event.
    e.preventDefault();
    document.execCommand(action);
  }

  /**
   * Internal event: CustomCommand.
   * 
   * @param {*} e
   * 
   * Executes the custom command handling the specified helper in editor.
   */
  $customCommand(helper) {
    if (this.hasFocus()) {
      helper.command(helper);
    }
  }

  /**
   * Internal event: Command.
   * 
   * @param {*} e
   * 
   * Executes before the keyboard input, handels the commands text format.
   */
  $preProcessInput(e) {
    let selection = window.getSelection();
    let textSelected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;
    let focusNode = selection.focusNode;

    // 'Space' or 'Enter'
    if (!textSelected && (e.keyCode === 32 || e.keyCode === 13)) {
      const helper = this.$helpers['link'];
      
      if (helper.test(selection) && helper.exec(selection)) {
        return e.preventDefault();
      }
    }

    // Delete key or Enter
    if (!e.shiftKey && (e.keyCode === 46 || e.keyCode === 13) && focusNode.nodeName === 'LI') {
      let command = {'UL': 'insertUnorderedList', 'OL': 'insertOrderedList'};

      if (focusNode.parentNode && command[focusNode.parentNode.nodeName]) {
        e.preventDefault();
        return document.execCommand(command[focusNode.parentNode.nodeName], false);
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
    if (name in this.customEvents) {
      this.customEvents[name] = callback;
      return;
    }

    this.element.addEventListener(name, callback);
  }

  /**
   * Focus
   * 
   * Sets focus to element
   */
  focus() {
    this.element.focus();
  }

  /**
   * HasFocus
   * 
   * Gets the result if the editor is in focus.
   */
  hasFocus() {
    return document.activeElement === this.element;
  }

  /**
   * Internal method: OnChange.
   * 
   * Fires onChange handler if custom event is configured.
   */
  $onChange() {
    let event = this.customEvents['change'];

    if (this.element.innerHTML != this.$value && event) {
      event(super.$onChange());
      this.$value = this.element.innerHTML;
    }
  }
}


