class LinkAdapter extends Helper {
  constructor () {
    super();
  }

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} selection
   * 
   * checks if selection contains an HTML Link element
   */
  $containsLink(selection) {
    var container = selection.rangeCount > 0 && selection.getRangeAt(0).commonAncestorContainer;

    return (container && container.nodeName === 'A' || container.parentNode.nodeName === 'A') ||
           (container && container.innerHTML && container.innerHTML.match(/<(a)[^>]+>/ig));
  }

  /**
   * @param {*} selection
   * 
   * Returns the executed test of selection if it can contain the link formated text.
   */
  test(selection) {
    var focusNode = selection.focusNode;
      
    var source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
    var character = source && source[source.length - 1];

    return (character === ')');
  }

  /**
   * Executes command, replaces selection into command link format [text](url)
   */
  command() {
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

  /**
   * @param {*} selection
   * 
   * Replace selection into HTML Link Element
   */
  exec(selection) {
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

    let [html, text, url] = sourceHtml.split(regex, 3);

    var lastText = (lastNode == focusNode)? focusNode.data.substr(0, selection.focusOffset) : lastNode.data;
    lastText = lastText.substr(0, lastText.lastIndexOf('['));

    if (text && url) {
      let linkHtml = `<a href="${url}">${text}</a> `;

      selection.collapse(focusNode, source.length);
      selection.extend(lastNode, lastText.length);

      document.execCommand('insertHTML', false, linkHtml);
    }
  }
}