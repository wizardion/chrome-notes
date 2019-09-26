class TextProcessor {
  constructor (element) {
    const pasteTags = ['a', 'li', 'ul', 'ol', 'b', 'i', 'u', 'p23', 'div', 'br'].join('|'); // Allowed tags
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
        // pattern: '(?!^)(<)\\s*(\/)\\s*(dt)((\\s[^>]*>|>))',
        // replacement: '<br>'
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

    this.element = element;

    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('blur', this.$onChange.bind(this));

    //#region TEST_DATA
    this.element.addEventListener('input', this.log.bind(this));
    setTimeout(function () {
      this.log();
    }.bind(this), 250)
    //#endregion
  }

  $isLast(selection, offset) {
    var focusOffset = offset || selection.focusOffset;

    return focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling &&
           (selection.focusNode.parentNode === this.element || !selection.focusNode.parentNode.nextSibling);
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
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
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

    // console.log({
    //   'encodedStr': encodedStr.replace(tagRegex, '<span class="error">$1</span>')
    // });
    var logDiv = document.getElementById('expression-result').innerHTML = `<i>html tags: - <b>${(tags && tags.length) || 0};</b></i>&nbsp;&nbsp;&nbsp;<i>symbols: - <b>${(sTags && sTags.length || 0)};</b></i>`;
  }
}