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
    var hasSelection = Math.abs(selection.focusOffset - selection.baseOffset) > 0;

    // 'Space'
    if (!hasSelection && e.keyCode === 32) {
      var focusNode = selection.focusNode;
      
      var source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
      var character = source && source[source.length - 1];

      // console.log({
      //   'source': source,
      // });
      
      if (character === ')') {
        e.preventDefault();
        this.$exec(selection);
      }
    }
  }

  $exec(selection) {
    var focusNode = selection.focusNode;
    var source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);

    if (!source) {
      return;
    }

    let node = focusNode;
    let lastNode = focusNode;
    let sourceHtml = source;
    let regex = /\[([^()]+)\]\(([-a-zA-Z0-9()@:%_\+.~#?&//=]+)\)/gi;

    while(node) {
      if (regex.test(sourceHtml)) {
        lastNode = node;
        console.log('===FOUND===')
        break;
      }

      node = node.previousSibling? node.previousSibling :
        node.parentNode !== this.element? node.parentNode.previousSibling : null;

      if(node) {
        sourceHtml = (node.data || node.outerHTML) + sourceHtml;
      }
    }

    let [html, text, link] = sourceHtml.split(regex, 3);

    var lastText = (lastNode == focusNode)? focusNode.data.substr(0, selection.focusOffset) : lastNode.data;
    lastText = lastText.substr(0, lastText.lastIndexOf('['));

    if (text && link) {
      let linkHtml = `<a href="${text}">${link}</a> `;

      selection.collapse(focusNode, source.length);
      selection.extend(lastNode, lastText.length);

      // document.execCommand('insertHTML', false, linkHtml);
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


