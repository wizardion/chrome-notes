class StyleAdapter extends Helper {
  constructor (element, command, template) {
    super(element);

    this.$command = command;
    this.$template = template;
    this.$rule = this.$command.replace(/(.)/gi, '\\$1');
    this.$commandRegex = new RegExp(`(${this.$rule})([^${this.$rule[0] + this.$rule[1]}]+)(${this.$rule})`, 'i');
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
    let regex = new RegExp(`\\w+(${this.$rule})$`, 'i');
    let result = regex.test(source);

    return result;
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

    let [lastNode, text] = this.$findNode(focusNode, source);

    if (text) {
      let styledHtml = this.$template.replace(/\$\{(\w+)\}/gi, text);
      let lastText = lastNode.data;

      if (lastNode == focusNode) {
        lastText = source.substr(0, source.length - 2);
      }

      selection.collapse(focusNode, source.length);
      selection.extend(lastNode, lastText.substr(0, lastText.lastIndexOf(this.$command)).length);

      document.execCommand('insertHTML', false, styledHtml);
      return true;
    }
  }
}