class Editor {
  constructor (element, controls) {
    const tags = ['a', 'b', 'i', 'u', 'strong', 'br', 'strike'].join('|'); // Allowed tags
    const attributes = ['href'].join('|'); // Allowed attributes

    this.element = element;
    this.controls = controls;
    this.customEvents = {'descriptionChanged': null}
    this.rules = [
      { // Replace paragraph to <br/> // https://www.regextester.com/93930
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
    this.element.addEventListener('blur', this.$onChange.bind(this));
    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('keydown', this.$onHandleInput.bind(this));
    this.element.addEventListener('keyup', this.$onCancelHandling.bind(this));
    // this.element.addEventListener('focus', this.$onCancelHandling.bind(this));
    // this.element.addEventListener('blur', this.$onCancelHandling.bind(this));
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
      const action = item.getAttribute('action');

      item.onmousedown = this.$precommand;

      if (['link'].indexOf(action) === -1) {
        item.onmouseup = this.$command;
      } else {
        item.onmouseup = this.$link.bind(this);
      }
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

  $link() {
    var selection = window.getSelection();
    var text = selection.toString();
    var regex = /^(\s*)(((https?\:\/\/|www\.)[^\s]+)([\,\.]+\s*)|((https?\:\/\/|www\.)[^\s]+)(\s*))$/i
    var range = selection.getRangeAt(0);

    var focusNode = selection.focusNode;
    
    var parentElement = selection.focusNode.parentElement;
    var previousSibling = selection.focusNode.previousSibling;
    var nextSibling = selection.focusNode.nextSibling;

    var siblings = [
      focusNode.previousSibling && focusNode.previousSibling.tagName,
      focusNode.parentElement && focusNode.parentElement.tagName,
      focusNode.nextSibling && focusNode.nextSibling.tagName,
    ]


    var clonedSelection = range.cloneContents();
          var div = document.createElement('div');
          div.appendChild(clonedSelection);

    // if (text.match(/(?!\w+)(\s*)(((https?\:\/\/|www\.)[^\s]+)([\,\.]+\s+)|((https?\:\/\/|www\.)[^\s]+)(\s*))(?=\w+)?/ig)) {
    //   console.log('"$1[$3$6]$5$8"')
    // }

    regex = /(?!\w+)(\s*)(((https?\:\/\/|www\.)[^\s]+)([\,\.]+\s+)|((https?\:\/\/|www\.)[^\s]+)(\s*))(?=\w+)?/ig

    // console.log({
    //   '': text.match(regex),
    //   'innerHTML': div.innerHTML,
    //   'text': text,
    //   'selection': selection,
    //   'tagName': parentElement.tagName,
    //   'range': range,
    // });

    console.log({
      'siblings': siblings.indexOf('A') > -1,
      'text': text,
      'hasLink': (parentElement && parentElement.tagName === 'A') || (previousSibling && previousSibling.tagName === 'A') || (nextSibling && nextSibling.tagName === 'A')
    });

    if (siblings.indexOf('A') > -1) {
      console.log('unlink...');
      // document.execCommand("unlink", false, false); 
    }

    // Create link
    if (siblings.indexOf('A') === -1 && text.match(regex)) {
      let linkHtml = text.replace(regex, '$1<a href="$3$6">$3$6</a>$5$8');
      let url = text.replace(regex, '$3$6');

      console.log(`insertHTML: [${linkHtml}]`);

      // document.execCommand('insertHTML', false, linkHtml);
      // document.execCommand('unlink', false, text);
      // document.execCommand('createLink', false, url);
    }

    // this.popup = document.createElement('input');

    // this.popup.classList.add('url-popup');

    // this.element.parentNode.appendChild(this.popup);

    // this.popup.focus();
  }

  $onChange() {
    // this.$onCancelHandling({type: 'changed'});

    if (this.customEvents['descriptionChanged']) {
      this.customEvents['descriptionChanged'](this.element.innerHTML.replace(/contentEditable=["']\w+["']/igm, ''));
    }
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
    // console.log({'keyCode': e.keyCode})

    if (e.keyCode === 91 || e.keyCode == 17) { // when ctrl is pressed
      var links = this.element.getElementsByTagName('a');

      e.preventDefault();

      for (let i = 0; i < links.length; i++) {
        const link = links[i];

        link.contentEditable = false;

        console.log({
          'contentEditable': link.contentEditable
        });
      }
    }

    if (e.keyCode === 9) { // 'Tab'
      var selection = window.getSelection();
      var selectionLines = selection.getRangeAt(0).getClientRects().length;

      e.preventDefault();

      if(selectionLines > 1) {
        document.execCommand(e.shiftKey && 'outdent' || 'indent', true, null);
      } else {
        document.execCommand(e.shiftKey && 'delete' || 'insertText', true, '\t');
      }
    }
  }

  $onCancelHandling(e) {
    if (e.keyCode === 91 || e.keyCode == 17 || e.type === 'changed') { // when ctrl is pressed
      // var links = this.element.getElementsByTagName('a');
      var links = this.element.querySelectorAll('[contentEditable]');

      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        link.removeAttribute('contentEditable');

        console.log({
          'contentEditable': link.contentEditable
        });
      }
    }
  }
}


