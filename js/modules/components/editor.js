class Editor {
  constructor (element, controls) {
    const tags = ['a', 'b', 'i', 'u', 'strong', 'br', 'strike'].join('|'); // Allowed tags
    const attributes = ['href'].join('|'); // Allowed attributes

    this.element = element;
    this.controls = controls;
    this.rules = [
      { // Replace paragraph to <br/>
        pattern: '<\/(li|p|h[0-9])>', 
        replacement: '<br/>'
      },
      { // Remove all attributes except allowed.
        pattern: `(?!<[^<>]+)(\\s*[\\S]*\\b(?!${attributes})\\b\\S+=("[^"]*"|'[^']*')(?=\\W*(>|\\s[^>]+\\s*>)))`, 
        replacement: ''
      },
      { // Remove all tags except allowed.
        pattern: `((<)\\s?(\/?)\\s?(${tags})\\s*(>|\\s[^>]+\\s*>))|<[^>]+>`,
        replacement: '$2$3$4$5'
      },
      { // Replace tab space
        pattern: '\t',
        replacement: '<span style="white-space:pre">\t</span>'
      },
    ];

    this.init();

    // Add global events
    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('keydown', this.$onHandleInput.bind(this));
  }

  /**
   * @param {*} value
   * 
   * Sets html value
   */
  set value(value) {
    this.element.innerHTML = value;
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
   * Init the controller
   * 
   * Init controlls and events.
   */
  init() {
    //https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
    //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
    //https://bear.app/

    for (let i = 0; i < this.controls.length; i++) {
      const item = this.controls[i];

      item.onmousedown = this.$precommand;
      item.onmouseup = this.$command;
    }
  }

  $precommand(e) {
    // cancel paste.
    e.preventDefault();
  }

  $command(e) {
    let action = this.getAttribute('action');

    // cancel event.
    e.preventDefault();
    document.execCommand(action);
  }

  $onPaste(e) {
    var clipboard = (e.originalEvent || e).clipboardData;
    var data = clipboard.getData('text/html'); // || clipboard.getData('text/plain');

    if (data) {
      // cancel paste.
      e.preventDefault();

      for (let index = 0; index < this.rules.length; index++) {
        const rule = this.rules[index];
        data = data.replace(new RegExp(rule.pattern, 'igm'), rule.replacement);
      }

      document.execCommand('insertHTML', false, data);
    }
  }

  $onHandleInput(e) {
    if (e.key === 'Tab') {
      var selection = window.getSelection();
      // var selectionLength = selection.extentOffset - selection.anchorOffset;
      var selectionLines = selection.getRangeAt(0).getClientRects().length;

      e.preventDefault();

      if(selectionLines > 1) {
        document.execCommand(e.shiftKey && 'outdent' || 'indent', true, null);
      } else {
        document.execCommand(e.shiftKey && 'delete' || 'insertText', true, '\t');
      }
    }
  }
}


