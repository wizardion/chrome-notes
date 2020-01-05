class HtmlHelper {
  constructor () {
    const allowedTags = ['a', 'li', 'ul', 'ol', 'b', 'i', 'u', 'code', 'q', 'blockquote'].join('|'); // Allowed tags
    const attributes = ['href'].join('|'); // Allowed attributes

    this.$testers = {
      end: /\n/g,
      space: /(\s)/g,
      blocks: /<\s*\/\s*(ul|ol|q|code)\s*>/gi,
      tags: /(<\s*\/?\s*[A-Z][A-Z0-9]*\b[^\<\>]*>)/gi,
      closingTag: /(<\s*\/\s*[A-Z][A-Z0-9]*\b[^\<\>]*>)/gi
    };

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
  }

  /**
   * Public method: RemoveHtml.
   * 
   * @param {*} data
   * @param {*} text
   * Removes html except allowed tags and attributes and merges the html tags into plane text.
   */
  removeHtml(data, text) {
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
   * Internal method: Merge.
   * 
   * @param {*} html
   * @param {*} text
   * Intelligently merges the HTML data tags from html to displayed plain text.
   */
  $merge(html, text) {
    let cursor = 0;
    let list = text.split(this.$testers.space);
    let elements = html.match(/(<\s*\/?\s*[A-Z][A-Z0-9]*\b[^\<\>]*>)|([^\s\<\>]+)|([\S\<\>]+)/gi);
    let tags = {
      opening: [],
      closing: []
    }

    print(html);
    print(text);
    print(elements);
    print(list);

    if(!elements) {
      return '';
    }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const isTag = !!element.match(this.$testers.tags);

      if(!isTag) {
        let hasBloks = false;

        if(tags.closing.length > 0) {
          [cursor, hasBloks] = this.$fillClosingTags(list, tags, cursor);
        }

        if(tags.opening.length > 0) {
          [cursor, hasBloks] = this.$fillOpeningTags(list, tags, cursor);
        }

        try {
          cursor = this.$moveCursor(list, element, hasBloks, cursor);
        } catch(err) {
          console.log(`%c ${err}`, 'background: transparent; color: red;');
          return text;
        }
      } else {
        let stack = !!element.match(this.$testers.closingTag)? tags.closing : tags.opening;
        stack.push(element);
      }
    }
    
    if(tags.opening.length > 0) {
      list.splice(cursor, 0, tags.opening.join(''));
      tags.opening = [];
    }

    if(tags.closing.length > 0) {
      list.splice(cursor, 0, tags.closing.join(''));
      tags.closing = [];
    }

    var result = list.join('').replace(/(<\/(li)>)[\n\r](<(li)>)/gi, '$1$3');

    console.log(`{${result}}`)
    console.log('=========================================================');

    return result;
  }

  /**
   * Internal method: HasBlocks.
   * 
   * @param {*} tags
   * Returns True if tag list contains an HTML block element.
   */
  $hasBlocks(tags) {
    for (let t = 0; t < tags.length; t++) {
      const tag = tags[t];
      
      if(tag.match(this.$testers.blocks)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Internal method: FillClosingTags.
   * 
   * @param {*} list
   * @param {*} tags
   * @param {*} cursor
   * Fills the list with closing tags.
   */
  $fillClosingTags(list, tags, cursor) {
    let hasBloks = this.$hasBlocks(tags.closing);
    
    list.splice(cursor, 0, tags.closing.join(''));
    cursor += 1;
    tags.closing = [];

    return [cursor, hasBloks];
  }

  /**
   * Internal method: FillOpeningTags.
   * 
   * @param {*} list
   * @param {*} tags
   * @param {*} cursor
   * Fills the list with opening tags
   * Removes the new lines in the list if the next elemnt has html blocks.
   */
  $fillOpeningTags(list, tags, cursor) {
    let hasBloks = !this.$hasBlocks(tags.opening);

    for (let g = cursor; g < list.length; g++) {
      const word = list[g];

      if(hasBloks && word.match(this.$testers.end)) {
        list[g] = '';
        hasBloks = false;
        print('hasBloks 1: g: ' + g)
      }

      if(!word.match(this.$testers.space) && word.length > 0) {
        break;
      }
      
      cursor = g + 1;
    }

    list.splice(cursor, 0, tags.opening.join(''));
    tags.opening = [];
    cursor += 1;

    return [cursor, hasBloks];
  }

  /**
   * Internal method: MoveCursor.
   * 
   * @param {*} list
   * @param {*} element
   * @param {*} hasBloks
   * @param {*} cursor
   * Moves the current cursor to the next element. 
   * Splits the current element in the list if required element has less size.
   * Removes the new lines in the list if the next elemnt has html blocks.
   */
  $moveCursor(list, element, hasBloks, cursor) {
    let splitingWord = null;

    for (let g = cursor; g < list.length; g++) {
      const word = list[g];
      const isSpace = word.match(this.$testers.space) || word.length === 0;

      if(hasBloks && word.match(this.$testers.end)) {
        list[g] = '';
        hasBloks = false;
        print('hasBloks 2: g: ' + g)
      }

      if(!isSpace && word === element) {
        cursor = g + 1;
        break;
      }

      if(!isSpace && word !== element) {
        let index = word.indexOf(element);

        if(index !== -1) {
          cursor = g + 1;
          splitingWord = word.substring(index + element.length);
          break;
        }

        throw `Error on merging html into plane text. Did not find the element: ${element}, current element is: ${word}`;
      }
    }

    if(splitingWord !== null) {
      list[cursor - 1] = element;
      list.splice(cursor, 0, splitingWord);
    }

    return cursor;
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
}