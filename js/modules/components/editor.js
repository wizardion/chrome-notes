class Editor {
  constructor (element, controls) {
    const allowedTags = ['a', 'b', 'strong', 'br'];
    const allowedAttributes = ['href'];

    this.element = element;
    this.controls = controls;
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

    this.init();

    // Add events
    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('keydown', this.$onHandleInput.bind(this));

    return this.element;
  }

  init() {
    //https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
    //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
    //https://bear.app/

    for (let i = 0; i < this.controls.length; i++) {
      const item = this.controls[i];

      item.onmousedown = this.precommand;
      item.onmouseup = this.command;
    }
  }

  precommand(e) {
    // cancel paste.
    e.preventDefault();
  }

  command(e) {
    let action = this.getAttribute('action');

    // cancel event.
    e.preventDefault();

    console.log(`action: ${action}`);
    document.execCommand(action);
  }

  $onPaste(e) {
    var clipboard = (e.originalEvent || e).clipboardData;
    // var data = clipboard.getData('text/html') || clipboard.getData('text/plain');
    var data = clipboard.getData('text/html');

    if (data) {
      // cancel paste.
      e.preventDefault();

      for (let index = 0; index < this.rules.length; index++) {
        const rule = this.rules[index];
        data = data.replace(rule.pattern, rule.replacement);
      }

      document.execCommand('insertHTML', false, data);
    }
  }

  $onHandleInput(e) {
    if (e.key === 'Tab') {
      var selection = window.getSelection();
      // var selectionLength = selection.extentOffset - selection.anchorOffset;
      var selectionLines = selection.getRangeAt(0).getClientRects().length;

      e.preventDefault();

      if(selectionLines > 1) {
        document.execCommand(e.shiftKey && 'outdent' || 'indent', true, null);
      } else {
        document.execCommand(e.shiftKey && 'delete' || 'insertText', true, '\t');
      }
    }
  }
}


