class CommandAdapter extends StyleAdapter {
  constructor (element, rule, template) {
    super(element, rule, template);

    this.$reverce = this.$reverse(this.$command);

    // this.$commandRegex = /\[([^\[\]]+)\]\(([\S]+)\)$/i;
    // this.$linkRegex = /^(\s*)((https?\:\/\/|www\.)[^\s]+)(\s*)$/i;
  }

  /**
   * Executes command, replaces selection into command link format [text](url)
   */
  command() {
    let selection = window.getSelection();
    let text = selection.toString();
    // let containsLink = this.$containsLink(selection);

    // selection is empty
    // if (!text.length) {
    //   return;
    // }

    if (text.length || this.$primitive) {
      let styledHtml = this.$template.replace(/\$\{(\w+)\}/gi, text);
      document.execCommand('insertHTML', false, styledHtml);
      return true;
    }

    // unlink
    // if (containsLink) {
    //   return document.execCommand("unlink", false);
    // }

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

  exec(selection) {
    let focusNode = selection.focusNode;
    let source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
    

    if (!source) {
      return;
    }

    if (this.$primitive) {
      selection.collapse(focusNode, source.length);
      selection.extend(focusNode, source.length - this.$command.length);
      document.execCommand('insertHTML', false, this.$template);
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
      document.execCommand('insertHTML', false, styledHtml);
      return true;
    }
  }
}