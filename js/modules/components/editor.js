class Editor {
  constructor (element) {
    const allowedTags = ['a', 'b', 'strong', 'br'];
    const allowedAttributes = ['href'];

    this.element = element;
    this.controls = {};
    this.rules = [];

    // Replace to <br/>
    this.rules.push({
      pattern: new RegExp('<\/(li|p|h[0-9])>', 'gi'),
      replacement: '<br/>'
    });

    // Remove all attributes except allowed.
    var replacements = ['$1'];
    var attrPatterns = [];

    for(var i = 0; i < allowedAttributes.length; i++){
      replacements.push('$' + (i + 2));

      attrPatterns.push(
          '(?:(?:(?:(?!' + allowedAttributes.join('=|') + '=)[^>]))*((?:' + 
          allowedAttributes.join('|') + ')=[\'"][^\'"]*[\'"]\\s*)?)'
      );
    }

    this.rules.push({
      pattern: new RegExp('<(\\w+)\\s*' + attrPatterns.join('') + '[^>]*>', 'gi'),
      replacement: '<' + replacements.join(' ') + '>'
    });
    
    // Remove all tags except allowed.
    this.rules.push({
      pattern: new RegExp('(<\/?(?:' + allowedTags.join('|') + ')[^>]*>)|<[^>]+>', 'gi'),
      replacement: '$1'
    });

    // this.init();

    // Add events
    this.element.addEventListener('paste', this.$onPaste.bind(this));

    return this.element;
  }

  init() {
    var div = document.createElement('div');
    //https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
    //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
    //https://bear.app/

    this.controls = {
      bold: {name: 'B', command: 'bold'},
      italic: {name: 'I', command: 'italic'},
      underline: {name: 'U', command: 'underline'},
      strike: {name: 'A', command: 'strikeThrough'},
      bullet: {name: '.-', command: 'insertUnorderedList'},
      ordered: {name: '1-', command: 'insertOrderedList'},

      undo: {name: '<', command: 'undo'},
      redo: {name: '>', command: 'redo'}
    };

    for (let key in this.controls) {
      const control = this.controls[key];

      control.element = document.createElement('input');
      control.element.type = 'button';
      control.element.value = control.name;

      control.element.onmousedown = this.precommand.bind(control);
      control.element.onmouseup = this.command.bind(control);

      div.appendChild(control.element);
    }

    div.className = 'editor-controlls';
    this.element.parentNode.insertBefore(div, this.element);
  }

  makeBold(e) {
    // document.execCommand('bold', false, data);
    document.execCommand('bold');
  }

  precommand(e) {
    // cancel paste.
    e.preventDefault();
  }

  command(e) {
    // cancel paste.
    e.preventDefault();

    console.log(`name: ${this.command}`);
    document.execCommand(this.command);
  }

  $onPaste(e) {
    // cancel paste.
    e.preventDefault();

    // Get html data from clipboard.
    var data = (e.originalEvent || e).clipboardData.getData('text/html').toString();

    for (let index = 0; index < this.rules.length; index++) {
      const rule = this.rules[index];
      data = data.replace(rule.pattern, rule.replacement);
    }

    document.execCommand('insertHTML', false, data);
  }
}


