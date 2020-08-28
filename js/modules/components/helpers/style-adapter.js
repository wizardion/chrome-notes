class StyleAdapter extends CommandAdapter {
  constructor (element, rule, template, keyCode) {
    super(element, keyCode);

    let tagRegex = /<(\w+)>/gi;
    let tags = tagRegex.exec(template);

    this.$rules = {
      start: rule,
      end: this.$reverse(rule),
    };

    this.$command = this.$rules.start;
    this.$template = template;
    this.$primitive = !template.match(/\$\{text\}/gi);

    this.$rule = this.$rules.end.replace(/(.)/gi, '\\$1');

    let escStart = this.$rules.start.replace(/(.)/gi, '\\$1');
    let excludeRule = (this.$rules.start !== this.$rules.end)?  `${escStart}|${this.$rule}` : `${escStart}`;
    
    this.$nodeName = tags[1].toUpperCase();
    this.$nodeRegex = new RegExp(`<\/?${this.$nodeName}[^>]*>`, 'gi');
    this.$commandRegex = new RegExp(`(${escStart})(((?!${excludeRule})[\\w\\s\\W\\S])*)(${this.$rule})$`, 'i');
  }

  /**
   * Internal method: reverse.
   * 
   * @param {*} value
   * 
   * returns reversed rule value
   */
  $reverse(value) {
    var result = '';

    for (var i = value.length - 1; i >= 0; i--) {
      result += value[i];
    }

    return result;
  }

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} node
   * @param {*} source
   * 
   * checks all node behind and extracts the command link
   */
  $findNode(node, source) {
    let lastNode = node;

    do {
      if (this.$commandRegex.test(source)) {
        lastNode = node;
        break;
      }

      node = node.previousSibling? node.previousSibling :
        node.parentNode !== this.$element? node.parentNode.previousSibling : null;

      if(node) {
        source = (node.data || node.outerHTML) + source;
      }
    } while(node);

    let [html, url, text] = source.split(this.$commandRegex, 3);

    return [lastNode, text];
  }

  /**
   * @param {*} selection
   * 
   * Returns the executed test of selection if it can contain the link formated text.
   */
  test(selection) {
    let focusNode = selection.focusNode;
    let source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
    let regex = new RegExp(this.$primitive? `(${this.$rule})$` : `[\\w\\s\\W\\S]+(${this.$rule})$`, 'i');
    let t = regex.test(source);

    return t;
  }

  /**
   * @param {*} selection
   * 
   * Replace selection into HTML Link Element
   */
  exec(selection) {
    let focusNode = selection.focusNode;
    let source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);

    if (!source) {
      return;
    }

    if (this.$primitive) {
      selection.collapse(focusNode, source.length);
      selection.extend(focusNode, source.length - this.$command.length);
      this.command('insertHTML', false, this.$template);
      return true;
    }

    let [lastNode, text] = this.$findNode(focusNode, source);

    if (text) {
      let styledHtml = this.$template.replace(/\$\{(\w+)\}/gi, text);
      let lastText = lastNode.data;

      if (lastNode == focusNode) {
        lastText = source.substr(0, source.length - this.$command.length);
      }

      selection.collapse(focusNode, source.length);
      selection.extend(lastNode, lastText.substr(0, lastText.lastIndexOf(this.$command)).length);
      this.command('insertHTML', selection, styledHtml);
      return true;
    }
  }
}