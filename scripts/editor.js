class Editor {
  constructor(element) {
    this.$element = element;

    this.init();
  }

  init() {
    this.$element = document.getElementById('editor');

    this.$element.addEventListener('keydown', onkeyDown);
    this.$element.addEventListener('focusin', onFocus);
    this.$element.addEventListener('focusout', onBlur);
    document.addEventListener('paste', onPaste);

    this.$cursor = document.createElement('div');
    this.$cursor.classList.add('cursor');

    this.$code = document.createElement('div');
    this.$code.classList.add('editor-code');

    this.$line = document.createElement('pre');
    this.$line.classList.add('editor-line');

    this.$span = document.createElement('span');
    this.$span.classList.add('editor-span');

    this.$element.appendChild(editor.cursor);
    this.$element.appendChild(editor.code);
  }
}