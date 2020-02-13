class TextProcessor {
  constructor (element) {
    this.element = element;
    this.$html = new HtmlHelper();
    // this.$sysKeys = [65, 67, 86, 88, 90,   82];
    // this.$sysKeys = [code.a, code.c, code.v, code.z, code.x, code.right, code.left, code.up, code.down,   code.r];
    this.$sysKeys = [code.a, code.c, code.v, code.x, code.right, code.left, code.up, code.down, code.ctrl,   code.r];
    
    //SWEET STYLES https://support.discordapp.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-
    this.$helpers = {
      link: new LinkAdapter(),
      italic: new StyleAdapter(this.element, '*', '<i>${text}</i> ', code.i),
      bold: new StyleAdapter(this.element, '**', '<b>${text}</b> ', code.b),
      boldItalic: new StyleAdapter(this.element, '***', '<b><i>${text}</i></b> '),
      strikethrough: new StyleAdapter(this.element, '~~', '<strike>${text}</strike> ', code.y),
      underline: new StyleAdapter(this.element, '__', '<u>${text}</u> ', code.u),
      
      underlineItalic: new StyleAdapter(this.element, '__*', '<u><i>${text}</i></u> '),
      underlineBold: new StyleAdapter(this.element, '__**', '<u><b>${text}</b></u> '),
      underlineBoldItalic: new StyleAdapter(this.element, '__***', '<u><b><i>${text}</i></b></u> '),
      code: new StyleAdapter(this.element, '`', '<code>${text}</code>'),
      pre: new StyleAdapter(this.element, '```', '<pre>${text}</pre>'),
      quote: new StyleAdapter(this.element, `'''`, '<q>${text}</q>'),
      line: new StyleAdapter(this.element, `---`, '<hr> '),
      removeFormat: new StyleRemover(),
      undo: new CommandAdapter(this.element, code.z),
      // redo: new CommandAdapter(this.element, code.z),
    };

    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('blur', this.$onChange.bind(this));
    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    this.element.addEventListener('keyup', this.$postProcessInput.bind(this));

    document.execCommand('defaultParagraphSeparator', false, 'p');
    //#region TEST_DATA
    this.element.addEventListener('input', this.log.bind(this));
    setTimeout(function () {
      this.log();
    }.bind(this), 250)
    //#endregion
  }

  /**
   * Internal method: SetUneditable.
   * 
   * @param {*} tagName
   * Makes all elements not editable/executable by tag name.
   */
  $setUneditable(tagName) {
    const links = this.element.getElementsByTagName(tagName);

    for(let i = 0; i < links.length; i++) {
      links[i].setAttribute('contenteditable', 'false');
    }
  }

  /**
   * Internal method: OnPaste.
   * 
   * @param {*} tagName
   * Removes from elements not editable/executable functionality by tag name.
   */
  $setEditable(tagName) {
    const links = this.element.getElementsByTagName(tagName);

    for(let i = 0; i < links.length; i++) {
      links[i].removeAttribute('contenteditable');
    }
  }

  /**
   * Internal method: OnPaste.
   * 
   * @param {*} e
   * Removes html except allowed tags and attributes.
   */
  $onPaste(e) {
    var clipboard = (e.originalEvent || e).clipboardData;
    var text = clipboard.getData('text/plain');
    let linkRegex = /^(\s*)((https?\:\/\/|www\.)[^\s]+)(\s*)$/i;

    e.preventDefault();

    if(!linkRegex.test(text) && (localStorage.allowPasteHtml === undefined || localStorage.allowPasteHtml === true)) {
      var html = clipboard.getData('text/html');

      if (html) {
        return document.execCommand('insertHTML', false, this.$html.removeHtml(html, text));
      }
    }

    console.log('============TEXT============');
    console.log(text);
    console.log('============END_TEXT============');

    return document.execCommand('insertText', false, text);
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

    if(e.ctrlKey && e.keyCode === code.ctrl && !e.shiftKey) {
      this.$setUneditable('A');
    } else {
      this.$setEditable('A');
    }

    // custom commands
    if (e.ctrlKey && this.$sysKeys.indexOf(e.keyCode) < 0) {
      e.preventDefault();
      
      for(var key in this.$helpers) {
        const helper = this.$helpers[key];

        if (e.keyCode === helper.keyCode) {
          return helper.command(key, selection);
        }
      }
    }

    // 'Tab' execute a custom command
    if (!e.ctrlKey && !e.shiftKey && !textSelected && e.keyCode === code.tab) {
      for(var key in this.$helpers) {
        const helper = this.$helpers[key];

        if (helper.test(selection) && helper.exec(selection)) {
          return e.preventDefault();
        }
      }
    }

    // Delete key or Enter - removes the last element in the list on delete key
    if (!e.shiftKey && (e.keyCode === code.del || e.keyCode === code.enter) && focusNode.nodeName === 'LI') {
      let command = {'UL': 'insertUnorderedList', 'OL': 'insertOrderedList'};

      if (focusNode.parentNode && command[focusNode.parentNode.nodeName]) {
        
        if(focusNode.nextSibling) {
          e.preventDefault();
          return document.execCommand(command[focusNode.parentNode.nodeName], false);
        } else {
          e.preventDefault();
          return document.execCommand(command[focusNode.parentNode.nodeName], false);
        }
      }
    }

    // 'Tab' shifts spaces toward/backward
    if ((e.keyCode === code.tab)) {
      e.preventDefault();
      document.execCommand(e.shiftKey && 'delete' || 'insertHTML', true, '    ');

      // let selectionLines = selection.getRangeAt(0).getClientRects().length;
      // e.preventDefault();

      // if(selectionLines > 1) {
      //   document.execCommand(e.shiftKey && 'outdent' || 'indent', true, null);
      // } else {
      //   // document.execCommand(e.shiftKey && 'delete' || 'insertText', true, '\t');
      //   document.execCommand(e.shiftKey && 'delete' || 'insertHTML', true, '    ');
      // }
    }
  }

  $postProcessInput(e) {
    this.$shiftKey = false;
    this.$ctrlKey = false;

    this.$setEditable('A');
  }

  /**
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
    return this.$html.removeHtml(this.element.innerHTML).replace(/^([ ]*)[\r\n]$/gi, '$1');
  }

  log(sessions, test) {
    var tagRegex = /(&lt\;\/?[^&]+&gt\;)/ig;
    var symbRegex = /(&amp\;\w+\;)/ig;
    var logDiv = document.getElementById('expression');
    var tagsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    };

    let encodedStr = this.element.innerHTML.replace(/[&<>]/g, function (tag) {
      return tagsToReplace[tag] || tag;
    });

    var tags = encodedStr.match(tagRegex);
    var sTags = encodedStr.match(symbRegex);
    
    // logDiv.innerHTML = '"' + encodedStr.replace(/[ ]/ig, '&nbsp;').
    //                          replace(tagRegex, '<span class="error">$1</span>').
    //                          replace(symbRegex, '<span class="html-symbol">$1</span>').
    //                          replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>') + '"';

    logDiv.innerHTML = '"' + encodedStr.replace(tagRegex, '<span class="error">$1</span>').
                                        replace(symbRegex, '<span class="html-symbol">$1</span>').
                                        replace(/( )( )/ig, '$1&nbsp;').
                                        replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>') + '"';

    // var text = this.$toString(this.element.innerHTML);
    // var html = this.$toHtml(text);
    // let encodedtext = text.replace(/[&<>]/g, function (tag) {
    //   return tagsToReplace[tag] || tag;
    // });

    // logDiv.innerHTML += '<hr>'
    // logDiv.innerHTML += encodedtext.replace(tagRegex, '<span class="error">$1</span>').
    //                               replace(symbRegex, '<span class="html-symbol">$1</span>').
    //                               replace(/( )( )/ig, '$1&nbsp;').
    //                               replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>').replace(/ /gi, '&nbsp;') + '"';
    
    // var code = document.createElement('pre')
    // code.innerHTML = '<hr>' + html;
    // logDiv.appendChild(code);


    // var source = document.createElement('div');
    // let encodedSource = html.replace(/[&<>]/g, function (tag) {
    //   return tagsToReplace[tag] || tag;
    // });

    // source.innerHTML += '<hr>'
    // source.innerHTML += encodedSource.replace(tagRegex, '<span class="error">$1</span>').
    //                               replace(symbRegex, '<span class="html-symbol">$1</span>').
    //                               replace(/( )( )/ig, '$1&nbsp;').
    //                               replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>') + '"';

    // logDiv.appendChild(source);

    // console.log({
    //   'encodedStr': encodedStr.replace(tagRegex, '<span class="error">$1</span>')
    // });
    var logDiv = document.getElementById('expression-result').innerHTML = `<i>html tags: - <b>${(tags && tags.length) || 0};</b></i>&nbsp;&nbsp;&nbsp;<i>symbols: - <b>${(sTags && sTags.length || 0)};</b></i>`;
  }
}

var print = function (value, color) {

  // console.log(`%c ${new Array(210).join('-')}`, 'background: transparent; color: silver');
  console.log();

  if(color) {
    if(typeof value === 'object') {
      console.log(`%c ${value.join? `[${value.join('|')}]` : JSON.stringify(value)}`, `background: transparent; color: ${color};`);
    } else {
      console.log(`%c ${value}`, `background: transparent; color: ${color};`);
    }
  } else {
    console.log(value);
  }
};