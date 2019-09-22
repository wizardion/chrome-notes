class LinkAdapter extends Helper {
  constructor () {
    super();

    this.commandRegex = /\[([^()]+)\]\(([\S]+)\)$/i;
    this.linkRegex = /^(\s*)((https?\:\/\/|www\.)[^\s]+)(\s*)$/i;
  }

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} selection
   * 
   * checks if selection contains an HTML Link element
   */
  $containsLink(selection) {
    let container = selection.rangeCount > 0 && selection.getRangeAt(0).commonAncestorContainer;

    return (container && container.nodeName === 'A' || container.parentNode.nodeName === 'A') ||
           (container && container.innerHTML && container.innerHTML.match(/<(a)[^>]+>/ig));
  }

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} node
   * @param {*} source
   * 
   * checks all node behind and extracts the command link
   */
  $findLink(node, source) {
    let lastNode = node;

    do {
      let test = this.commandRegex.test(source);

      if (test === true) {
        lastNode = node;
        break;
      }

      node = node.previousSibling? node.previousSibling :
        node.parentNode !== this.element? node.parentNode.previousSibling : null;

      if(node) {
        source = (node.data || node.outerHTML) + source;
      }
    } while(node);

    let [html, text, url] = source.split(this.commandRegex, 3);

    return [lastNode, text, url];
  }

  /**
   * @param {*} selection
   * 
   * Returns the executed test of selection if it can contain the link formated text.
   */
  test(selection) {
    let focusNode = selection.focusNode;
    let source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
    let regex = /([^()]+)\]\(([\S]+)\)$/i;

    return regex.test(source);
  }

  /**
   * Executes command, replaces selection into command link format [text](url)
   */
  command() {
    let selection = window.getSelection();
    let text = selection.toString();
    let containsLink = this.$containsLink(selection);

    // selection is empty
    if (!text.length) {
      return;
    }

    // unlink
    if (containsLink) {
      return document.execCommand("unlink", false);
    }

    // create an auto link
    if (!containsLink && text.match(this.linkRegex)) {
      let linkHtml = text.replace(this.linkRegex, '$1<a href="$2">$2</a>$4');

      return document.execCommand('insertHTML', false, linkHtml);
    }

    // create a custom link
    let customLink = `[${text.replace(/\n/ig, '<br>')}](url)`;

    document.execCommand('insertHTML', false, customLink);
    selection.collapse(selection.focusNode, selection.focusOffset - 1);
    selection.extend(selection.focusNode, selection.focusOffset - 3);
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

    let [lastNode, text, url] = this.$findLink(focusNode, source);
    let lastText = (lastNode == focusNode)? focusNode.data.substr(0, selection.focusOffset) : lastNode.data;

    lastText = lastText.substr(0, lastText.lastIndexOf('['));

    if (text && url) {
      let linkHtml = `<a href="${url}">${text}</a> `;

      selection.collapse(focusNode, source.length);
      selection.extend(lastNode, lastText.length);

      document.execCommand('insertHTML', false, linkHtml);
      return true;
    }
  }
}