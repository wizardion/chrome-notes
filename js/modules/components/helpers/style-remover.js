class StyleRemover extends Helper {
  constructor (element) {
    super(element);
  }

  command() {
    let selection = window.getSelection();
    let text = selection.toString();

    if(text) {
      // return document.execCommand("removeFormat", false);
      
      document.execCommand("insertHTML", false, text);

      selection.collapse(selection.focusNode, selection.focusOffset);
      selection.extend(selection.focusNode, selection.focusOffset - text.length);

      return true;
    }
  }
}