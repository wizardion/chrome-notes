class TextProcessor {
  constructor (element) {
    const pasteTags = ['a', 'li', 'ul', 'ol', 'b', 'i', 'u', 'p', 'div123', 'br'].join('|'); // Allowed tags
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
      // {
      //   name: 'Replace paragraph',
      //   pattern: '(?!^)(<)\\s*(\/)\\s*(dt|p)((\\s[^>]*>|>))',
      //   replacement: '<br><br>'
      //   // pattern: '(?!^)(<)\\s*(\/)\\s*(dt)((\\s[^>]*>|>))',
      //   // replacement: '<br>'
      // },
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
        pattern: `<p><\/p>|<b><\/b>|<i><\/i>`,
        replacement: ''
      },
      {
        name: 'Replace innesessary html symbols',
        pattern: `(\\S)(&nbsp;)(\\S)`, 
        replacement: '$1 $3'
      },
    ];
    this.$helpers = {
      link: new LinkAdapter()
    };

    this.element = element;

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
   * Removes html except allowed tags and attributes.
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

      console.log(`%c EXTRA`, 'color: darkred;');

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

  $toString(html) {
    let pattern = {
      // '(\\{|\\*)': '\$1',
      '<\/?(br)([\s]+[^>]*)?>': '\n',
      '<\/?(b)([\s]+[^>]*)?>': '**',
      '<\\/?(i)([\s]+[^>]*)?>': '*',
      '<\\/?(strike)([\s]+[^>]*)?>': '~~',
      '([^\n])<(ul)([\s]+[^>]*)?>': '$1\n',
      '<(li)([\s]+[^>]*)?>': '- {',
      '<\\/(li)([\s]+[^>]*)?>': '}'
    };

    // html = encodeURI(html);
    html = RegExp.escape(html);

    for(var key in pattern) {
      const command = pattern[key];
      const regex = new RegExp(key, 'gi');

      html = html.replace(regex, command);
    }

    return html.replace(/<\/?[^>]+>/gi, '');
  }

  $toHtml(text) {
    let pattern = {
      '([^\\*]|^)\\*\\*([^\\*]+)\\*\\*(?=[^\\*]|$)': '$1<b>$2</b>',
      '([^\\*]|^)\\*([^\\*]+)\\*(?=[^\\*]|$)': '$1<i>$2</i>',
      '([^\\*]|^)\\*\\*\\*([^\\*]+)\\*\\*\\*(?=[^\\*]|$)': '$1<b><i>$2</i></b>',
    };

    for(var key in pattern) {
      const command = pattern[key];
      const regex = new RegExp(key, 'gi');

      text = text.replace(regex, command);
    }

    // replace lists

    // return text.replace(/^\- ([^\-]+)\n/igm, '<li>$1</li>');
    return text.replace(/\- \{([^\-\{\}]+)\}/g, '<li>$1</li>').replace(/\&86/g, '{');
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
      var html = clipboard.getData('text/html') || text;

      if (html) {
        return document.execCommand('insertHTML', false, this.$removeHtml(html));
      }
    }

    return document.execCommand('insertText', false, text.replace(/^\s|\s$/ig, ''));
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
      for(var key in this.$helpers) {
        const helper = this.$helpers[key];

        if (helper.test(selection) && helper.exec(selection)) {
          return e.preventDefault();
        }
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
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
    var text = this.$toString(this.element.innerHTML);

    console.log(this.$toHtml(text));
    
    return this.$toString(text);
    // return this.$removeHtml(this.element.innerHTML);
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

    var text = this.$toString(this.element.innerHTML);
    var html = this.$toHtml(text);
    let encodedtext = text.replace(/[&<>]/g, function (tag) {
      return tagsToReplace[tag] || tag;
    });

    logDiv.innerHTML += '<hr>'
    logDiv.innerHTML += encodedtext.replace(tagRegex, '<span class="error">$1</span>').
                                  replace(symbRegex, '<span class="html-symbol">$1</span>').
                                  replace(/( )( )/ig, '$1&nbsp;').
                                  replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>').replace(/ /gi, '&nbsp;') + '"';
    
    var code = document.createElement('pre')
    code.innerHTML = '<hr>' + html;
    logDiv.appendChild(code);


    var source = document.createElement('div');
    let encodedSource = html.replace(/[&<>]/g, function (tag) {
      return tagsToReplace[tag] || tag;
    });

    source.innerHTML += '<hr>'
    source.innerHTML += encodedSource.replace(tagRegex, '<span class="error">$1</span>').
                                  replace(symbRegex, '<span class="html-symbol">$1</span>').
                                  replace(/( )( )/ig, '$1&nbsp;').
                                  replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>') + '"';

    logDiv.appendChild(source);

    // console.log({
    //   'encodedStr': encodedStr.replace(tagRegex, '<span class="error">$1</span>')
    // });
    var logDiv = document.getElementById('expression-result').innerHTML = `<i>html tags: - <b>${(tags && tags.length) || 0};</b></i>&nbsp;&nbsp;&nbsp;<i>symbols: - <b>${(sTags && sTags.length || 0)};</b></i>`;
  }
}