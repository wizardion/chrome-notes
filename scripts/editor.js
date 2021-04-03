class Editor {
  constructor(element) {
    this.element = element;
    this.value = '';
    this.cursor = 0;
    this.line = 0;

    this.eLine = null; //tmp

    this.background = {
      cursor: null,
      line: null,
    };

    this.init();
  }

  init() {
    this.element.style.zIndex = '1';

    this.background.cursor = document.createElement('div');
    this.background.cursor.style.background = 'black';
    this.background.cursor.style.width = '1px';
    this.background.cursor.style.position = 'absolute';

    this.background.line = document.createElement('span');
    this.background.line.style.position = 'absolute';
    this.background.line.style.zIndex = '0';
    
    this.eLine = document.createElement('span');
    this.eLine.classList.add('line');

    this.element.parentNode.insertBefore(this.background.line, this.element);
    this.element.parentNode.insertBefore(this.background.cursor, this.element);
    this.element.appendChild(this.eLine);

    this.element.addEventListener('keydown', this.onkeyDown.bind(this));
    this.element.addEventListener('focusin', this.onFocus.bind(this));
    this.element.addEventListener('focusout', this.onBlur.bind(this));
  }

  onFocus() {

  }

  onBlur() {

  }

  onkeyDown(e) {
    if (!(e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
      e.preventDefault();
      this.value = this.value.slice(0, -1);
      this.cursor -= 1;
    }
    
    if (!(e.ctrlKey || e.metaKey) && e.key.length === 1) {
      e.preventDefault();
      this.value += e.key;
      this.cursor += 1;
    }

    this.render();
  }

  render() {
    var lines = [];
    
    
    this.eLine.innerText = this.value;
    this.renderCursor();
  }

  renderCursor() {
    // this.background.line.innerText = this.value;
    // var top = this.element.offcetTop;


  }
}