class CommandAdapter extends StyleAdapter {
  constructor (element, rule, template) {
    super(element, rule, template);

    let tagRegex = /<(\w+)>/gi;
    let tags = tagRegex.exec(template);

    this.$nodeName = tags[tags.index].toUpperCase();
    this.$reverce = this.$reverse(this.$command);
    this.$nodeRegex = new RegExp(`<(${this.$nodeName})[^>]+>`, 'gi');
  }

  /**
   * @param {*} selection
   * 
   * Checks if selection contains a serving HTML element
   */
  $containsNode(selection) {
    let container = selection.rangeCount > 0 && selection.getRangeAt(0).commonAncestorContainer;

    return (container &&  ((container.nodeName === this.$nodeName || container.parentNode.nodeName === this.$nodeName) ||
        (container.innerHTML && container.innerHTML.match(this.$nodeRegex))));        
  }

  /**
   * Executes command, replaces selection into command link format [text](url)
   */
  command() {
    let selection = window.getSelection();
    let text = selection.toString();
    let containsNode = this.$containsNode(selection);

    console.log({
      'contains': containsNode
    });

    // selection is empty
    // if (!text.length) {
    //   return;
    // }

    // return document.execCommand("insertHTML", false, text);

    // unlink
    if (containsNode) {
      // return document.execCommand("unlink", false);
      
      // return document.execCommand('formatBlock', false, 'br');
      // return document.execCommand('insertText', false, 'text');
      // return document.execCommand('insertHTML', false, '<b>text</b>');

      // document.execCommand('insertText', false, 'select_text');
      // document.execCommand("insertHTML", false, text);
      return;
    }

    if (text.length || this.$primitive) {
      let styledHtml = this.$template.replace(/\$\{(\w+)\}/gi, text);
      document.execCommand('insertHTML', false, styledHtml);
      return true;
    }

    

    // create an auto link
    // if (!containsLink && text.match(this.$linkRegex)) {
    //   let linkHtml = text.replace(this.$linkRegex, '$1<a href="$2">$2</a>$4');

    //   return document.execCommand('insertHTML', false, linkHtml);
    // }

    // create a custom link
    // let customLink = this.$primitive? `${this.$command}` : `${this.$command}${text}${this.$reverce}`;

    // document.execCommand('insertHTML', false, customLink);
    // selection.collapse(selection.focusNode, selection.focusOffset);
    // selection.extend(selection.focusNode, selection.focusOffset);

    // this.exec(selection);
  }
}