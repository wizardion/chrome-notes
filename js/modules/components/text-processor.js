class TextProcessor {
  constructor (element, controls) {
    this.element = element;
    this.controls = controls;
    this.customEvents = {'change': null};
  }

  $isLast(selection, offset) {
    var focusOffset = offset || selection.focusOffset;

    var a = {
      test: 123
    };

    console.log(a);

    return focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling &&
           (selection.focusNode.parentNode === this.element || !selection.focusNode.parentNode.nextSibling);
  }




}