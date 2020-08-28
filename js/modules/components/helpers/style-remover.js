class StyleRemover extends Helper {
  constructor (element, keyCode) {
    super(element, keyCode);
  }

  /**
   * Internal method: EscapeTags.
   * 
   * @param {*} e
   * Removes html tages by replacing it with escaped text.
   */
  $escapeTags(value) {
    const tags = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    };

    return value.replace(/[&<>]/g, t => tags[t] || t);
  }

  /**
   * Executes command, removes all html tags within the selected text.
   */
  command() {
    let selection = window.getSelection();
    let text = selection.toString();

    if(text) {
      let scrollTop = this.$element.parentNode.scrollTop;
      
      document.execCommand('insertHTML', false, this.$escapeTags(text));
      
      selection.collapse(selection.focusNode, selection.focusOffset);
      selection.extend(selection.focusNode, selection.focusOffset - text.length);
      document.execCommand('outdent', false);

      this.$element.parentNode.scrollTop = scrollTop;
      return true;
    }
  }
}