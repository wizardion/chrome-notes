class Editor extends TextProcessor {
  constructor (element, controls) {
    super(element);

    this.$value = this.element.innerHTML;
    this.controls = controls;

    this.customEvents = {'change': null};

    this.init();

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
  }

  /**
   * Init the controller
   * 
   * Init controlls and events.
   */
  init() {
    for (let i = 0; i < this.controls.length; i++) {
      const item = this.controls[i];
      const action = item.getAttribute('action');

      item.onmousedown = this.$preCommand;

      if (['link'].indexOf(action) === -1) {
        item.onmouseup = this.$command;
      } else {
        item.onmouseup = this.$link.bind(this);
      }
    }
  }

  $preCommand(e) {
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
    let customLink = `[${text.replace(/\n/ig, '<br>')}](url)`;

    // console.log(`2. insertCustomLink${customLink}`);
    document.execCommand('insertHTML', false, customLink);
    selection.collapse(selection.focusNode, selection.focusOffset - 1);
    selection.extend(selection.focusNode, selection.focusOffset - 3);
  }

  $makeLink() {

  }

  $preProcessInput(e) {
    var selection = window.getSelection();

    // 'Space'
    if (e.keyCode === 32) {
      var focusNode = selection.focusNode;
      var source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
      var character = source && source[source.length - 1];

      console.log({
        'source': source
      });
      
      if (character === ')') {
        e.preventDefault();
        this.$exec(selection);
      }
    }
    // if (e.keyCode === 32) {
    //   var data = selection.focusNode.data || selection.focusNode.innerHTML;
    //   var selected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;
      
    //   data = data.substr(0, selection.focusOffset);

    //   // console.log({
    //   //   'data': data,
    //   //   'data2': data2,
    //   // });

    //   if (!selected && data.length > 0 && data[data.length - 1] === ')') {
    //     e.preventDefault();
    //     // return document.execCommand('insertHTML', false, '!');
    //     this.$exec(selection);
    //   }
    // }
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

      console.log({
        'text': text,
        'link': link,
        'split': source.split(regex),
        'source': source,
      });

      if (link) {
        let linkHtml = link.replace(regex, '<a href="$3">$2</a> ');
        // document.execCommand('insertText', false, ' ');

        selection.collapse(focusNode, text.length);
        selection.extend(focusNode, text.length + link.length);

        document.execCommand('insertHTML', false, linkHtml);

        // document.execCommand('insertText', false, ' ');

        // selection.collapse(focusNode, 1);
        // selection.extend(focusNode, 1);

        return true;
      }
    }
  }

  /**
   * @param {*} value
   * 
   * Sets html value
   */
  set value(value) {
    this.$value = value;
    this.element.innerHTML = this.$value;
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
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
    if (this.element.innerHTML != this.$value && this.customEvents['change']) {
      this.customEvents['change'](super.$onChange());
      this.$value = this.element.innerHTML;
    }
  }
}


