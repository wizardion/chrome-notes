class Editor {
  constructor (element, controls) {
    const tags = ['a', 'b', 'i', 'u', 'strong', 'br', 'strike', 'div'].join('|'); // Allowed tags
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
    // this.element.addEventListener('blur', this.$onChange.bind(this));
    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('keydown', this.$onHandleInput.bind(this));
    // this.element.addEventListener('keyup', this.$onCancelHandling.bind(this));
    // this.element.addEventListener('focus', this.$onCancelHandling.bind(this));
    // this.element.addEventListener('blur', this.$onCancelHandling.bind(this));
    this.element.addEventListener('input', this.log.bind(this));
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

  $removeHtml(data) {
    for (let index = 0; index < this.rules.length; index++) {
      const rule = this.rules[index];
      data = data.replace(new RegExp(rule.pattern, 'igm'), rule.replacement);
    }

    return data;
  }

  $onChange() {
    // ----------Remove all----------
    let data = this.$removeHtml(this.element.innerHTML);
    // ------------------------------

    // this.$onCancelHandling({type: 'changed'});

    if (this.customEvents['descriptionChanged']) {
      // this.customEvents['descriptionChanged'](this.element.innerHTML.replace(/contentEditable=["']\w+["']/igm, ''));
      this.customEvents['descriptionChanged'](data);
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
    var focusNode = selection.focusNode;
    var source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
    var character = source && source[source.length - 1];

    if (!source) {
      return;
    }

    // focusNode.previousSibling.outerHTML
    // focusNode.previousSibling.previousSibling.data
    // focusNode.previousSibling.previousSibling.previousSibling: null;

    // console.log({
    //   'selection': focusNode
    // });

    if (character === ')') {
      let regex = /(\[([^()]+)\]\(([^()]+)\))/i;
      let node = focusNode;
      // let sourceHtml = [];
      let sourceHtml = '';

      console.log({
        'node': node
      })

      while(node) {
        sourceHtml = (node.data || node.outerHTML) + sourceHtml;
        
        node = node.previousSibling? node.previousSibling : 
          node.parentNode !== this.element? node.parentNode.previousSibling : null;

        console.log({
          'node': node
        });

        if (regex.test(sourceHtml)) {
          console.log('===FOUND===')
          break;
        }
      }

      console.log({
        'sourceHtml': sourceHtml,
        'insertHtml': this.$removeHtml(sourceHtml),
      });

      let [text, link] = source.split(regex, 2);

      // console.log({
      //   'text': text,
      //   'link': link,
      //   'split': source.split(regex),
      //   'source': source,
      // });

      if (link) {
        let linkHtml = link.replace(regex, '<a href="$3">$2</a>');
        document.execCommand('insertText', false, ' ');

        selection.collapse(focusNode, text.length);
        selection.extend(focusNode, text.length + link.length);

        document.execCommand('insertHTML', false, linkHtml);

        selection.collapse(focusNode, 1);
        selection.extend(focusNode, 1);

        return true;
      }
    }
  }


  $isLast(selection, offset) {
    var focusNode = selection.focusNode;
    var focusOffset = offset || selection.focusOffset;

    if (focusNode === this.element) {
      console.log(focusNode);
    }

    return focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling;
  }

  $onHandleInput(e) {
    console.log({'keyCode': e.keyCode})

    var selection = window.getSelection();

    //#region test1
    // console.log({
    //   'isLast': selection,
    // });

    // Remove <br>
    // if (selection.focusNode.nextSibling && selection.focusNode.nextSibling.nodeName === 'BR') {
    //   console.log('removeChild');
    //   this.element.removeChild(selection.focusNode.nextSibling);
    //   this.log();
    // }
    
    

    // if (e.keyCode === 8) { // 'Backspace'
    //   var data = selection.focusNode.data;
    //   e.preventDefault();
      
    //   console.log({
    //     'data': data[data.length - 2] === '\n',
    //     'focusOffset': selection.focusOffset,
    //     'focusNode': selection.focusNode.data,
    //   });

    //   if (data.length > 1 && data[data.length - 1] === ' ' && data[data.length - 2] === '\n') {
    //     selection.collapse(selection.focusNode, data.length);
    //     selection.extend(selection.focusNode, data.length - 1 );
    //     document.execCommand('insertHTML', false, '\n');
    //   } else {
    //     document.execCommand('delete', false);
    //   }

    //   // document.execCommand('delete', false);
    // }
    //#endregion

    if (e.keyCode === 8) { // 'Backspace'
      var data = selection.focusNode.data || selection.focusNode.innerHTML;

      e.preventDefault();

      // if (data.length === selection.focusOffset && data.length > 1 && data[data.length - 1] !== '\n' && data[data.length - 2] === '\n') {
      if (this.$isLast(selection) && data[data.length - 1] !== '\n' && data[data.length - 2] === '\n') {
        selection.collapse(selection.focusNode, data.length);
        selection.extend(selection.focusNode, data.length - 1 );
        document.execCommand('insertHTML', false, '\n');
      } else {
        document.execCommand('delete', false);
      }
    }

    if (e.keyCode === 46) { // 'Delete'
      var data = selection.focusNode.data || selection.focusNode.innerHTML;
      data = data.substr(selection.focusOffset - 1);

      if (this.$isLast(selection, selection.focusOffset + 1) && 
          data[1] !== '\n' && data[0] === '\n' && data.length === 2) {
        e.preventDefault();

        selection.collapse(selection.focusNode, selection.focusOffset);
        selection.extend(selection.focusNode,selection.focusOffset + 1);
        document.execCommand('insertHTML', false, '\n');
      }
    }

    if (e.keyCode === 13) { // 'Enter'
      var last = this.$isLast(selection);
      var br = last? '\n\n' : '\n';

      console.log({
        'isLast': last,
      });

      e.preventDefault();
      return document.execCommand('insertHTML', false, br);
    }

    if (e.keyCode === 32) { // 'Enter'
      var data = selection.focusNode.data || selection.focusNode.innerHTML;
      data = data.substr(0, selection.focusOffset);

      // console.log({
      //   'selection': selection.focusNode,
      // });

      // if (data.length > 1 && data[data.length - 2] === ' ') {
        // e.preventDefault();
        // return document.execCommand('insertHTML', false, '&nbsp;');
      // }
    }

    //#region Rest
    // if (e.keyCode === 32 || e.keyCode === 13) { // 'Enter'
    //   var selection = window.getSelection();

    //   if (this.$exec(selection)) {
    //     e.preventDefault();
    //     return;
    //   }
    // }

    // if (e.keyCode === 91 || e.keyCode == 17) { // when ctrl is pressed
    //   var links = this.element.getElementsByTagName('a');

    //   e.preventDefault();

    //   for (let i = 0; i < links.length; i++) {
    //     const link = links[i];

    //     link.contentEditable = false;

    //     console.log({
    //       'contentEditable': link.contentEditable
    //     });
    //   }
    // }

    // if (e.keyCode === 9) { // 'Tab'
    //   var selection = window.getSelection();
    //   var selectionLines = selection.getRangeAt(0).getClientRects().length;

    //   e.preventDefault();

    //   if(selectionLines > 1) {
    //     document.execCommand(e.shiftKey && 'outdent' || 'indent', true, null);
    //   } else {
    //     document.execCommand(e.shiftKey && 'delete' || 'insertText', true, '\t');
    //   }
    // }
    //#endregion Rest
  }

  log() {

    // if (selection.focusNode === this.element) {
      // console.log('log.removeChild2');
      
      // var children = this.element.children;

      // for(let i = 0; i < children.length; i++) {
      //   const item = children[i];

      //   if (item.nodeName === 'BR') {
      //     console.log(item)
      //     this.element.removeChild(item);
      //     // this.log()
      //   }
      // }

    // }


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

  // $onCancelHandling(e) {
  //   if (e.keyCode === 91 || e.keyCode == 17 || e.type === 'changed') { // when ctrl is pressed
  //     // var links = this.element.getElementsByTagName('a');
  //     var links = this.element.querySelectorAll('[contentEditable]');

  //     for (let i = 0; i < links.length; i++) {
  //       const link = links[i];
  //       link.removeAttribute('contentEditable');

  //       console.log({
  //         'contentEditable': link.contentEditable
  //       });
  //     }
  //   }
  // }
}


