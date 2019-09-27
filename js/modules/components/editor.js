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
    // document.execCommand("DefaultParagraphSeparator", false, "br");
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

    // 'Space' or 'Enter'
    if (!textSelected && (e.keyCode === 32 || e.keyCode === 13)) {
      const helper = this.$helpers['link'];
      
      if (helper.test(selection) && helper.exec(selection)) {
        return e.preventDefault();
      }
    }

    // Delete key
    if (!e.shiftKey && e.keyCode === 46) {
      let focusNode = selection.focusNode;

      if (focusNode.nodeName === 'LI') {
        e.preventDefault();

        if (focusNode.parentNode && focusNode.parentNode.nodeName === 'UL') {
          return document.execCommand('insertUnorderedList', false);
        }

        if (focusNode.parentNode && focusNode.parentNode.nodeName === 'OL') {
          return document.execCommand('insertOrderedList', false);
        }
      }
    }

    // Enter
    if (!e.shiftKey && e.keyCode === 13) {
      let focusNode = selection.focusNode;

      if (focusNode.nodeName === 'LI') {
        e.preventDefault();

        if (focusNode.parentNode && focusNode.parentNode.nodeName === 'UL') {
          return document.execCommand('insertUnorderedList');
        }

        if (focusNode.parentNode && focusNode.parentNode.nodeName === 'OL') {
          return document.execCommand('insertOrderedList');
        }
      }
    }
  }

  $isLast(selection, offset) {
    var focusOffset = offset || selection.focusOffset;

    return (focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling &&
           (selection.focusNode.parentNode === this.element || !selection.focusNode.parentNode.nextSibling));
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


