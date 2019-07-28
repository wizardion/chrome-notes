class Editor extends BaseEditor {
  constructor (element, controls) {
    super(element, controls);

    // const tags = ['a', 'li', 'ul', 'ol', 'b', 'i', 'u', 'strong', 'strike', 'div', 'br'].join('|'); // Allowed tags
    const pasteTags = ['a', 'li', 'ul', 'ol', 'b', 'i', 'u', 'div', 'br'].join('|'); // Allowed tags
    const attributes = ['href'].join('|'); // Allowed attributes

    
    // https://www.regextester.com/93930
    this.rules = [
      {
        name: 'Trim html before cutting',
        pattern: '(<[^>]+>)[\\r\\n]+(?=<[^>]+>)',
        replacement: '$1'
      },
      {
        name: 'Remove styles and scripts',
        pattern: '<\\s*(style|script)[^>]*>[^<]*<\\s*\/(style|script)\\s*>',
        replacement: ''
      },
      {
        name: 'Remove all attributes except allowed',
        pattern: `(?!<[^<>]+)(\\s*[\\S]*\\b(?!${attributes})\\b\\S+=("[^"]*"|'[^']*')(?=\\W*(>|\\s[^>]+\\s*>)))`, 
        replacement: ''
      },
      {
        name: 'Replace headers',
        pattern: `(<\\s*)(h[0-9])(\\s*>)`,
        replacement: '$1b$3'
      },
      {
        name: 'Replace headers ends',
        pattern: `(<\\s*\/\\s*)(h[0-9])(\\s*>)`,
        replacement: '$1b$3<br><br>'
      },
      {
        name: 'Replace paragraph',
        pattern: '(?!^)(<)\\s*(\/)\\s*(dt|p)((\\s[^>]*>|>))',
        replacement: '<br><br>'
      },
      {
        name: 'Replace unsopported bold tags',
        pattern: `(<\\s*\/?)(strong)(\\s*>)`,
        replacement: '$1b$3'
      },
      {
        name: 'Remove all tags except allowed',
        pattern: `((<)\\s?(\/?)\\s?(${pasteTags})\\s*((\/?)>|\\s[^>]+\\s*(\/?)>))|<[^>]+>`,
        replacement: '$2$3$4$5'
      },
      {
        name: 'Replace empty tags',
        pattern: `<div><\/div>|<b><\/b>|<i><\/i>`,
        replacement: ''
      },
      {
        name: 'Replace innesessary html symbols',
        pattern: `(\\S)(&nbsp;)(\\S)`, 
        replacement: '$1 $3'
      },
    ];
    //#region Old
    /* this.rules = [
      { // Replace paragraph to <br/> // https://www.regextester.com/93930
        // pattern: '<\/(li|p|h[0-9])>', 
        // replacement: '<br/><br/>'
        pattern: '<\/(p|h[0-9])>', 
        replacement: '<br>'
      },
      { // Remove all attributes except allowed.
        pattern: `(?!<[^<>]+)(\\s*[\\S]*\\b(?!${attributes})\\b\\S+=("[^"]*"|'[^']*')(?=\\W*(>|\\s[^>]+\\s*>)))`, 
        replacement: ''
      },
      { // Remove all tags except allowed.
        pattern: `((<)\\s?(\/?)\\s?(${tags})\\s*((\/?)>|\\s[^>]+\\s*(\/?)>))|<[^>]+>`,
        replacement: '$2$3$4$5'
      },
      // { // Replace tab space
      //   pattern: '\t',
      //   replacement: '<span style="white-space:pre">\t</span>'
      // },
      // { // Replace double spaces
      //   types: [1, 2],
      //   pattern: '([ ])([ ])',
      //   replacement: '$1&nbsp;'
      // },
    ]; */
    //#endregion

    this.init();

    // Global events
    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('copy', this.$onCopy.bind(this));
    this.element.addEventListener('blur', this.$onChange.bind(this));
    this.element.addEventListener('keydown', this.$onHandleInput.bind(this));
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

    var i = 123;

    for (let i = 0; i < this.controls.length; i++) {
      const item = this.controls[i];
      const action = item.getAttribute('action');

      item.onmousedown = this.$precommand;

      if (['link'].indexOf(action) === -1) {
        item.onmouseup = this.$command;
      } else {
        // item.onmouseup = this.$link.bind(this);
      }
    }
  }
  
  /**
   * @param {*} value
   * 
   * Sets html value
   */
  set value(value) {
    this.element.innerHTML = value;
    this.log();
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

  $findMax(data) {
    let longest = 0;
    let max;

    for(let i = 0; i < data.length; i++) {
      if (data[i].length > longest) { 
        max = i;
        longest = data[i].length;
      }
    }

    return data[max].split(/\w+/ig).length - 1;
  }

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} data
   * Removes html exept allowed tags and attributes.
   */
  $removeHtml(data) {
    var len = 155
    console.log(`%c${Array(len).fill('-').join('')}`, 'color: darkgreen;');
    console.log(data);
    

    for (let index = 0; index < this.rules.length; index++) {
      const rule = this.rules[index];
      data = data.replace(new RegExp(rule.pattern, 'ig'), rule.replacement);

      console.log(`%c${Array(30).fill('-').join('')} ${rule.name} ${Array((len - 30) - (rule.name.length + 2)).fill('-').join('')}`, 'color: darkgreen;');
      console.log(data);
    }

    var extra = data.match(/(<(div)>){2,}/ig);

    if (extra) {
      let count = this.$findMax(extra);

      for(let i = count; i > 1; i--) {
        let name = `Replace extra {${i}}`;
        data = data.replace(new RegExp(`(<(div)>){${i}}([^<>]*)(<\/(div)>){${i}}`, 'ig'), '$1$3$4');

        console.log(`%c${Array(30).fill('-').join('')} ${name} ${Array((len - 30) - (name.length + 2)).fill('-').join('')}`, 'color: darkgreen;');
        console.log(data);
      }
    }

    console.log(`%c${Array(len).fill('-').join('')}`, 'color: darkgreen;');

    return data;
  }

  $onPaste(e) {
    // https://www.freecodecamp.org/news/three-ways-to-find-the-longest-word-in-a-string-in-javascript-a2fb04c9757c/
    var clipboard = (e.originalEvent || e).clipboardData;
    var text = clipboard.getData('text/plain');

    e.preventDefault();

    if (localStorage.allowPasteHtml || true) {
      var html = clipboard.getData('text/html') || text;

      if (html) {
        return document.execCommand('insertHTML', false, this.$removeHtml(html));
      }
    }

    if (text) {
      return document.execCommand('insertText', false, text.replace(/^\s|\s$/ig, ''));
    }
  }

  $onCopy(e) {
    // var selection = window.getSelection();
    // var data = selection.focusNode.innerHTML || selection.focusNode.data;

    // if (selection.rangeCount > 0) {
    //   var range = selection.getRangeAt(0);
    //   var clonedSelection = range.cloneContents();
    //   var div = document.createElement('div');

    //   div.appendChild(clonedSelection);
      
    //   console.log({
    //     'html': div.innerHTML,
    //     'range': range,
    //     'clonedSelection': clonedSelection,
    //   });
    // }
  }

  /**
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
    if (this.customEvents['change']) {
      let data = this.$removeHtml(this.element.innerHTML);
      this.customEvents['change'](data);
      // this.customEvents['change'](this.element.innerHTML);
    }
  }

  

  $onHandleInput(e) {}
}


