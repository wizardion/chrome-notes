class StyleRemover extends Helper {
  constructor (element) {
    super(element);
  }

  /**
   * Executes command, removes all html tags within the selected text.
   */
  command() {
    let selection = window.getSelection();
    let text = selection.toString();

    if(text) {
      document.execCommand("insertHTML", false, text);

      selection.collapse(selection.focusNode, selection.focusOffset);
      selection.extend(selection.focusNode, selection.focusOffset - text.length);

      return true;
    }
  }
}