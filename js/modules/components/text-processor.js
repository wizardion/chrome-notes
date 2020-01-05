class TextProcessor {
  constructor (element) {
    const allowedTags = ['a', 'li', 'ul', 'ol', 'b', 'i', 'u', 'code', 'q', 'blockquote'].join('|'); // Allowed tags
    const attributes = ['href'].join('|'); // Allowed attributes

    // https://www.regextester.com/93930
    this.rules = [
      //#region old
          // {
          //   name: 'Trim html before cutting',
          //   pattern: '(<[^>]+>)[\\r\\n]+(?=<[^>]+>)',
          //   replacement: '$1'
          // },
          // {
          //   name: 'Replace innesessary html symbols',
          //   pattern: `(\\S)(&nbsp;)(\\S)`, 
          //   replacement: '$1 $3'
          // },
      // {
      //   name: 'Replace all space-symbols to simple space',
      //   // pattern: `(\\s)`, 
      //   pattern: `(([\\t\v\\f \\u00a0\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u200b\\u2028\\u2029\\u3000]))`, 
      //   replacement: ' '
      // },
      //#endregion
      {
        name: 'Remove styles and scripts',
        pattern: /<\s*(style|script)[^>]*>(((?!<\s*\/(style|script)\s*>).)*)<\s*\/(style|script)\s*>/gi,
        replacement: ''
      },
      {
        name: 'Replace BR',
        pattern: /<\s*br\s*[^\<\>]*\s*\/?\s*>/gi,
        replacement: '\n'
      },
      {
        name: 'Remove all attributes except allowed',
        pattern: new RegExp(`(?!<[^<>]+)(\\s*[\\S]*\\b(?!${attributes})\\b\\S+=("[^"]*"|'[^']*')(?=\\W*(>|\\s[^>]+\\s*>)))`, 'ig'),
        replacement: ''
      },
      {
        name: 'Replace headers',
        pattern: /<\s*(h[1-9])(\s([^\>]*))?\s*>(((?!<\s*\/?\s*\1\s*>).)*)<\s*\/?\s*\1\s*>/gi,
        replacement: '<b$2>$4</b>'
      },
      {
        name: 'Replace unsopported bold tags',
        pattern: /<\s*(\/?)(strong)\s*>/gi,
        replacement: '<$1b>'
      },
      {
        name: 'Separate blocks',
        pattern: /(<\s*\/?\w+\s*\/?\s*>)/gi,
        replacement: '$1 ',
        optional: true
      },
      // TODO
      {
        name: 'Remove all tags except allowed',
        pattern: new RegExp(`(\\<)\\s*(\\/?)\\s*(${allowedTags})\\s*(\\s([^\\>]*))?\\s*(\\/?)\\s*(\\>)|<[^>]+>`, 'gi'),
        replacement: '$1$2$3$4$6$7'
      },
      {
        name: 'Replace empty tags',
        pattern: /<(\s*\w+\s*)><\s*\/\1>/gi,
        replacement: ''
      }
    ];

    this.element = element;
    
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
      code: new StyleAdapter(this.element, '```', '\n<code>${text}</code>\n'),
      quote: new StyleAdapter(this.element, `'''`, '\n<q>${text}</q>\n'),
    };

    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('blur', this.$onChange.bind(this));
    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));

    // document.execCommand('defaultParagraphSeparator', false, 'br');
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
   * @param {*} text
   * Removes html except allowed tags and attributes and merges the html tags into plane text.
   */
  $removeHtml(data, text) {
    for (let index = 0; index < this.rules.length; index++) {
      const rule = this.rules[index];
      
      if(text || !rule.optional) {
        data = data.replace(rule.pattern, rule.replacement);
      }
    }

    var extra = data.match(/(<(p)>){2,}/ig);

    if (extra) {
      let count = this.$findMax(extra);

      for(let i = count; i > 1; i--) {
        data = data.replace(new RegExp(`(<(p)>){${i}}([^<>]*)(<\/(p)>){${i}}`, 'ig'), '$1$3$4');
      }
    }

    return text? this.$merge(data, this.$escapeTags(text)) : data;
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

  $merge(html, text) {
    let cursor = 0;
    let spaceRegex = /(\s)/g;
    let list = text.split(spaceRegex);
    // (<\s*\/?\s*[A-Z][A-Z0-9]*\b(\s\w+\=\"[^\<\>]+\")*\s*\/?\s*>) - more demanding rule in case of issues.
    let tagTester = /(<\s*\/?\s*[A-Z][A-Z0-9]*\b[^\<\>]*>)/gi;
    let closeTagTester = /(<\s*\/\s*[A-Z][A-Z0-9]*\b[^\<\>]*>)/gi;
    let elements = html.match(/(<\s*\/?\s*[A-Z][A-Z0-9]*\b[^\<\>]*>)|([^\s\<\>]+)|([\S\<\>]+)/gi);
    let stacks = {
      open: [],
      close: [],
      split: null
    };

    print(html);
    print(text);
    print(elements);
    print(list);

    if(!elements) {
      return '';
    }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const isTag = !!element.match(tagTester);

      if(!isTag) {
        let hasBloks = false;
        let needs = false;

        if(stacks.close.length > 0) {
          for (let t = 0; t < stacks.close.length; t++) {
            const tag = stacks.close[t];
            
            if(tag.match(/<\s*\/\s*(ul|ol|q|code)\s*>/gi)) {
              hasBloks = true;
              break;
            }
          }

          list.splice(cursor, 0, stacks.close.join(''));
          stacks.close = [];
          cursor += 1;
          needs = hasBloks;
        }

        if(stacks.open.length > 0) {
          for (let t = 0; t < stacks.close.length; t++) {
            const tag = stacks.close[t];
            
            if(tag.match(/<\s*\/\s*(ul|ol|q|code)\s*>/gi)) {
              needs = false;
              break;
            }
          }
          
          for (let g = cursor; g < list.length; g++) {
            const tword = list[g];

            if(needs && tword.match(/\n/gi)) {
              list[g] = '';
              needs = false;
            }

            if(!tword.match(spaceRegex) && tword.length > 0) {
              break;
            }
            
            cursor = g + 1;
          }

          list.splice(cursor, 0, stacks.open.join(''));
          stacks.open = [];
          cursor += 1;
        }

        for (let g = cursor; g < list.length; g++) {
          const word = list[g];
          const isSpace = spaceRegex.test(word) || word.length === 0;

          if(needs && word.match(/\n/gi)) {
            list[g] = '';
            needs = false;
          }

          if(!isSpace && word === element) {
            cursor = g + 1;
            stacks.split = null;
            break;
          }

          if(!isSpace && word !== element) {
            let index = word.indexOf(element);

            if(index !== -1) {
              cursor = g + 1;
              stacks.split = word.substring(index + element.length);
              break;
            }

            console.log('%c Error on merging html into plane text', 'background: transparent; color: red;');
            return text;
          }
        }

        if(stacks.split !== null) {
          list[cursor - 1] = element;
          list.splice(cursor, 0, stacks.split);
          stacks.split - null;
        }
      } else {
        let stack = !!element.match(closeTagTester)? stacks.close : stacks.open;
        stack.push(element);
      }
    }
    
    if(stacks.open.length > 0) {
      list.splice(cursor, 0, stacks.open.join(''));
      stacks.open = [];
    }

    if(stacks.close.length > 0) {
      list.splice(cursor, 0, stacks.close.join(''));
      stacks.close = [];
    }

    var result = list.join('').replace(/(<\/(li)>)[\n\r](<(li)>)/gi, '$1$3');

    console.log(`{${result}}`)
    console.log('=========================================================');

    return result;
  }

  /**
   * Internal method: EscapeTags.
   * 
   * @param {*} e
   * Removes html tages by replacing it with escaped text.
   */
  $escapeTags(value) {
    const tags = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    };

    return value.replace(/[&<>]/g, t => tags[t] || t);
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
        return document.execCommand('insertHTML', false, this.$removeHtml(html, text));
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
    print(this.element.outerText)
    print(this.$removeHtml(this.element.innerHTML))
    print(this.$removeHtml(this.element.innerHTML, this.element.innerText))

    // return this.$removeHtml(this.element.innerHTML, this.element.innerText);
    return this.$removeHtml(this.element.innerHTML);
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