class BaseEditor {
  constructor (element, controls) {
    const tags = ['a', 'li', 'ul', 'ol', 'b', 'i', 'u', 'strong', 'strike', 'div', 'br'].join('|'); // Allowed tags
    const pasteTags = ['li', 'ul', 'ol', 'b', 'i', 'u', 'div', 'br'].join('|'); // Allowed tags
    const attributes = ['href'].join('|'); // Allowed attributes

    // console.log(pasteTags)

    this.element = element;
    this.controls = controls;
    this.customEvents = {'change': null};
    this.pasteRules = [
      {
        name: 'Trim html before cutting',
        pattern: '(<[^>]+>)\\s+(?=<[^>]+>)',
        replacement: '$1'
      },
      {
        name: 'Replace styles and scripts',
        pattern: '<\\s*(style|script)[^>]*>[^<]*<\\s*\/(style|script)\\s*>',
        replacement: ''
      },
      {
        name: 'Replace paragraph',
        pattern: '(?!^)(<)\\s*(\/)\\s*(dt|p|h[0-9])((\\s[^>]*>|>))',
        replacement: '<br>'
      },
      {
        name: 'Remove all attributes except allowed',
        pattern: `(?!<[^<>]+)(\\s*[\\S]*\\b(?!${attributes})\\b\\S+=("[^"]*"|'[^']*')(?=\\W*(>|\\s[^>]+\\s*>)))`, 
        replacement: ''
      },
      {
        name: 'Remove all tags except allowed',
        pattern: `((<)\\s?(\/?)\\s?(${pasteTags})\\s*((\/?)>|\\s[^>]+\\s*(\/?)>))|<[^>]+>`,
        replacement: '$2$3$4$5'
      },
      // {
      //   name: 'Replace extra {2}',
      //   pattern: `(<(div)>){2}([^<>]*)(<\/(div)>){2}|(<(b)>){2}([^<>]*)(<\/(b)>){2}`, 
      //   replacement: '$1$3$4$6$8$9'
      // },
      {
        name: 'Replace empty tags',
        pattern: `<\\w+><\/\\w+>`, 
        replacement: ''
      },
    ];
    this.rules = [
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
    ];

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

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} data
   * Removes html exept allowed tags and attributes.
   */
  $removeHtml(data) {
    var rules = this.pasteRules;

    var len = 155
    console.log(`%c${Array(len).fill('-').join('')}`, 'color: darkgreen;');
    console.log(data);
    

    for (let index = 0; index < rules.length; index++) {
      const rule = rules[index];
      data = data.replace(new RegExp(rule.pattern, 'ig'), rule.replacement);

      console.log(`%c${Array(30).fill('-').join('')} ${rule.name} ${Array((len - 30) - (rule.name.length + 2)).fill('-').join('')}`, 'color: darkgreen;');
      console.log(data);
    }

    var extra = data.match(/(<(div)>){2,}/ig);

    if (extra) {
      let longest = 0;
      let max;
      let count = 0;

      for(let i = 0; i < extra.length; i++) {
        
        if (extra[i].length > longest) {
          max = i;
          longest = extra[i].length;
        }
      }

      count = extra[max].split(/\w+/ig).length - 1;

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
    var clipboard = (e.originalEvent || e).clipboardData;
    var text = clipboard.getData('text/plain');

    e.preventDefault();

    if (localStorage.allowPasteHtml || true) {
      var html = clipboard.getData('text/html') || text;

      if (html) {
        // if (!text.match(/(\\n){2,}/ig) && html.match(/(\\n){2,}/ig)) {
        //   html = html.replace(/(\\n){2,}/ig, '$1');
        // }

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
    // if (this.customEvents['change']) {
    //   let data = this.$removeHtml(this.element.innerHTML);
    //   this.customEvents['change'](data);
    // }
  }

  $onHandleInput(e) {}
}


