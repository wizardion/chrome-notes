class TextProcessor {
  constructor (element) {
    this.element = element;
    this.$html = new HtmlHelper();
    
    //SWEET STYLES https://support.discordapp.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-
    this.$helpers = {
      link: new LinkAdapter(),
      italic: new StyleAdapter(this.element, '*', '<i>${text}</i> '),
      bold: new StyleAdapter(this.element, '**', '<b>${text}</b> '), 
      boldItalic: new StyleAdapter(this.element, '***', '<b><i>${text}</i></b> '),
      strike: new StyleAdapter(this.element, '~~', '<strike>${text}</strike> '),
      underline: new StyleAdapter(this.element, '__', '<u>${text}</u> '),
      underlineItalic: new StyleAdapter(this.element, '__*', '<u><i>${text}</i></u> '),
      underlineBold: new StyleAdapter(this.element, '__**', '<u><b>${text}</b></u> '),
      underlineBoldItalic: new StyleAdapter(this.element, '__***', '<u><b><i>${text}</i></b></u> '),
      code: new StyleAdapter(this.element, '`', '\b<code>${text}</code>\b'),
      pre: new StyleAdapter(this.element, '```', '\b<pre>${text}</pre>\b'),
      quote: new StyleAdapter(this.element, `'''`, '\b<q>${text}</q>\b'),
      line: new StyleAdapter(this.element, `---`, '\b<hr>\b'),
    };

    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('blur', this.$onChange.bind(this));
    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));

    document.execCommand('defaultParagraphSeparator', false, 'p');
    //#region TEST_DATA
    this.element.addEventListener('input', this.log.bind(this));
    setTimeout(function () {
      this.log();
    }.bind(this), 250)
    //#endregion
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

    if (!linkRegex.test(text) && (localStorage.allowPasteHtml === undefined || localStorage.allowPasteHtml === true)) {
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

    // 'Tab' execute a custom command
    if (!e.shiftKey && !textSelected && (e.keyCode === 9)) {
      for(var key in this.$helpers) {
        const helper = this.$helpers[key];

        console.log({
          'key': key,
          'command': helper.$command,
        });

        if (helper.test(selection) && helper.exec(selection)) {
          return e.preventDefault();
        }
      }
    }

    // Delete key or Enter - removes the last element in the list on delete key
    if (!e.shiftKey && (e.keyCode === 46 || e.keyCode === 13) && focusNode.nodeName === 'LI') {
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
    if ((e.keyCode === 9)) {
      let selectionLines = selection.getRangeAt(0).getClientRects().length;
      e.preventDefault();

      if(selectionLines > 1) {
        document.execCommand(e.shiftKey && 'outdent' || 'indent', true, null);
      } else {
        // document.execCommand(e.shiftKey && 'delete' || 'insertText', true, '\t');
        document.execCommand(e.shiftKey && 'delete' || 'insertHTML', true, '    ');
      }
    }
  }

  /**
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
    // var text = this.$toString(this.element.innerHTML);

    // console.log(this.$toHtml(text));
    
    // return this.$toString(text);
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