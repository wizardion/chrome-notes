class BaseEditor {
  constructor (element, controls) {
    const tags = ['a', 'b', 'i', 'u', 'strong', 'strike', 'div'].join('|'); // Allowed tags
    const attributes = ['href'].join('|'); // Allowed attributes

    this.element = element;
    this.controls = controls;
    this.customEvents = {'change': null};
    this.rules = [
      { // Replace paragraph to <br/> // https://www.regextester.com/93930
        pattern: '<\/(li|p|h[0-9])>', 
        // replacement: '<br/><br/>'
        replacement: ''
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
      // { // Replace double spaces
      //   types: [1, 2],
      //   pattern: '([ ])([ ])',
      //   replacement: '$1&nbsp;'
      // },
    ];

    // Global events
    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('blur', this.$onChange.bind(this));
    this.element.addEventListener('keydown', this.$onHandleInput.bind(this));
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
   * Internal method: RemoveHtml.
   * 
   * @param {*} data
   * Removes html exept allowed tags and attributes.
   */
  $removeHtml(data) {
    for (let index = 0; index < this.rules.length; index++) {
      const rule = this.rules[index];
      data = data.replace(new RegExp(rule.pattern, 'igm'), rule.replacement);
    }

    return data;
  }

  $onPaste(e) {
    var clipboard = (e.originalEvent || e).clipboardData;
    var html = clipboard.getData('text/html');
    // var text = clipboard.getData('text/plain');

    if (html) {
      e.preventDefault();
      document.execCommand('insertHTML', false, this.$removeHtml(html));
    }
  }

  /**
   * Internal method: OnChange.
   * 
   * Fires on content blur
   */
  $onChange() {
    if (this.customEvents['change']) {
      let data = this.$removeHtml(this.element.innerHTML);

      // this.customEvents['descriptionChanged'](this.element.innerHTML.replace(/contentEditable=["']\w+["']/igm, ''));
      this.customEvents['change'](data);
    }
  }

  $onHandleInput(e) {}
}


