class Editor extends HtmlElement {
  constructor (selector=new String) {
    super(selector);

    const allowedTags = ['a', 'b', 'strong', 'br'];
    const allowedAttributes = ['href'];

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

    // Add events
    this.event('paste', this.$onPaste.bind(this));
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


