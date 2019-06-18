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
        replacement: '<br/><br/>'
      },
      { // Remove all attributes except allowed.
        pattern: `(?!<[^<>]+)(\\s*[\\S]*\\b(?!${attributes})\\b\\S+=("[^"]*"|'[^']*')(?=\\W*(>|\\s[^>]+\\s*>)))`, 
        replacement: ''
      },
      { // Remove all tags except allowed.
        pattern: `((<)\\s?(\/?)\\s?(${tags})\\s*((\/?)>|\\s[^>]+\\s*(\/?)>))|<[^>]+>`,
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

  $containsLink(selection) {
    var container = selection.rangeCount > 0 && selection.getRangeAt(0).commonAncestorContainer;

    return (container && container.nodeName === 'A' || container.parentNode.nodeName === 'A') ||
           (container && container.innerHTML && container.innerHTML.match(/<(a)[^>]+>/ig));
  }

  $getHtml(selection) {
    var content = selection.rangeCount > 0 && selection.getRangeAt(0).cloneContents();

    if (content) {
      let div = document.createElement('div');

      div.appendChild(content);
      return div.innerHTML;
    }

    return '';
  }

  $createPopup() {
    var popup = {
      element: document.createElement('div'),
      input: document.createElement('input'),
      save: document.createElement('input'),
    }

    popup.element.className = 'url-popup';
    popup.save.className = 'button save-note';
    
    popup.input.type = 'text';
    popup.save.type = 'button';

    popup.element.appendChild(document.createTextNode('Enter URL: '));
    popup.element.appendChild(popup.save);
    popup.element.appendChild(popup.input);
    
    this.element.parentNode.appendChild(popup.element);
    popup.input.focus();

    return popup;
  }

  $link() {
    var selection = window.getSelection();
    var text = selection.toString();
    var containsLink = this.$containsLink(selection);
    var regex = /^(\s*)((https?\:\/\/|www\.)[^\s]+)(\s*)$/i;

    // selection is empty
    if (!text.length) {
      return;
    }

    // unlink
    if (containsLink) {
      console.log(`1. unlink`);
      return document.execCommand("unlink", false);
    }

    // create an auto link
    if (!containsLink && text.match(regex)) {
      let linkHtml = text.replace(regex, '$1<a href="$2">$2</a>$4');

      console.log(`2. insertHTML`);
      return document.execCommand('insertHTML', false, linkHtml);
    }

    // create a custom link
    // let customHtml = text.replace(/\b(.*)\b/im, '[$1](url)');
    // let html = this.$getHtml(selection);
    // let customLink = `[${html}](url)`;
    let customLink = `[${text.replace(/\n/ig, '<br>')}](url)`;

    // console.log({
    //   'html': this.$getHtml(selection),
    //   // 'container': selection.getRangeAt(0).commonAncestorContainer,
    //   'text': text,
    // });

    // console.log(`2. insertCustomLink${customLink}`);
    // \[([^()]+)\]\(([^()]+)\) // find url
    return document.execCommand('insertHTML', false, customLink);

    

    // create a custom link
    // this.popup = this.$createPopup();
    
    // if (!containsLink && text.match(regex)) {
    //   let linkHtml = text.replace(regex, '$1<a href="$2">$2</a>$4');
    //   // let url = text.replace(regex, '$1');

    //   console.log(`insertHTML: [${linkHtml}]`);
      
    //   // document.execCommand('createLink', false, url);
    //   return document.execCommand('insertHTML', false, linkHtml);
    // }

    // var clonedSelection = range.cloneContents();
    // var div = document.createElement('div');
    // div.appendChild(clonedSelection);
    // var innerHTML = div.innerHTML;
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

    console.log(`${data}`)

    if (data) {
      // cancel paste.
      e.preventDefault();

      for (let index = 0; index < this.rules.length; index++) {
        const rule = this.rules[index];
        data = data.replace(new RegExp(rule.pattern, 'igm'), rule.replacement);

        console.log(`${data}`)
      }

      document.execCommand('insertHTML', false, data);
    }
  }

  $exec(selection) {
    var text = selection.focusNode.data.substr(0, selection.focusOffset);
    var focusNode = selection.focusNode;
    // var range = selection.getRangeAt(0);

    console.log({
      'text': text
    })

    // console.log({
    //   // 'text': text.replace(/\[([^()]+)\]\(([^()]+)\)/ig, '<a $2>$1</a>'),
    //   'text': text,
    //   // 'range.substr': text.substr(0, range.endOffset),
    //   'substr': text.substr(0, selection.focusOffset),
    //   'toString': selection.toString(),
    //   'selection': selection,
    //   // 'range': range,
    // })

    if (text[text.length - 1] === ')') {
      // selection.

      var link = text.replace(/\[([^()]+)\]\(([^()]+)\)/ig, '&nbsp;<a href="$2"> $1</a> ');

      setTimeout(function() {
        // var link = text.replace(/\[([^()]+)\]\(([^()]+)\)/ig, ' <a href="$2"> $1</a> ');

        selection.collapse(focusNode, 0);
        selection.extend(focusNode, text.length);

        document.execCommand('insertHTML', false, link);
      }.bind(this), 1000)

      // selection.collapse(selection.focusNode, 0);
      // selection.extend(selection.focusNode, text.length);
      // 

      // selection.focusNode.data = link;

      console.log({
        'text': link,
        'selection': selection,
      });

      // return document.execCommand('insertHTML', false, link);

      return true;
    }
  }

  $onHandleInput(e) {
    // console.log({'keyCode': e.keyCode})

    // if (e.keyCode === 13) { // 'Enter'
    //   e.preventDefault();

    //   document.execCommand('insertHTML', false, '<br/>');
    // }

    if (e.keyCode === 32 || e.keyCode === 13) { // 'Enter'
      var selection = window.getSelection();

      if (this.$exec(selection)) {
        // e.preventDefault();
      }

      // e.preventDefault();

      // document.execCommand('insertHTML', false, '<br/>');

      // this.$exec(selection);
    }

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


