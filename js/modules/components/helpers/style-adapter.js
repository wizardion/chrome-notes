class StyleAdapter extends Helper {
  constructor () {
    super();

    this.$commandRegex = /(\*\*)([^\*]+)(\*\*)$/i;
  }

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} node
   * @param {*} source
   * 
   * checks all node behind and extracts the command link
   */
  $findStyle(node, source) {
    let lastNode = node;

    do {
      if (this.$commandRegex.test(source)) {
        lastNode = node;
        break;
      }

      node = node.previousSibling? node.previousSibling :
        node.parentNode !== this.element? node.parentNode.previousSibling : null;

      if(node) {
        source = (node.data || node.outerHTML) + source;
      }
    } while(node);

    let [html, url, text] = source.split(this.$commandRegex, 3);

    console.log({
      '': source.split(this.$commandRegex, 3)
    });

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
    let regex = /(\*\*)$/i;

    return regex.test(source);
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

    let [lastNode, text] = this.$findStyle(focusNode, source);

    if (text) {
      let styledHtml = `<b>${text}</b> `;
      let lastText = (lastNode == focusNode)? source : lastNode.data;

      if (lastNode == focusNode) {
        lastText = lastText.substr(0, lastText.length - 2);
      }

      selection.collapse(focusNode, source.length);
      selection.extend(lastNode, lastText.substr(0, lastText.lastIndexOf('**')).length);

      document.execCommand('insertHTML', false, styledHtml);
      return true;
    }
  }
}