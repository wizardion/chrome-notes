class StyleAdapter extends CommandAdapter {
  constructor (element, rule, template, keyCode) {
    super(element, keyCode);

    let tagRegex = /<(\w+)>/gi;
    let tags = tagRegex.exec(template);

    this.$rules = {
      start: rule,
      end: this.$reverse(rule),
    };

    this.$command = this.$rules.start;
    this.$template = template;
    this.$primitive = !template.match(/\$\{text\}/gi);

    this.$rule = this.$rules.end.replace(/(.)/gi, '\\$1');

    let escStart = this.$rules.start.replace(/(.)/gi, '\\$1');
    let excludeRule = (this.$rules.start !== this.$rules.end)?  `${escStart}|${this.$rule}` : `${escStart}`;
    
    this.$nodeName = tags[1].toUpperCase();
    this.$nodeRegex = new RegExp(`<\/?${this.$nodeName}[^>]*>`, 'gi');
    this.$commandRegex = new RegExp(`(${escStart})(((?!${excludeRule})[\\w\\s\\W\\S])*)(${this.$rule})$`, 'i');
  }

  /**
   * Internal method: reverse.
   * 
   * @param {*} value
   * 
   * returns reversed rule value
   */
  $reverse(value) {
    var result = '';

    for (var i = value.length - 1; i >= 0; i--) {
      result += value[i];
    }

    return result;
  }

  /**
   * Internal method: RemoveHtml.
   * 
   * @param {*} node
   * @param {*} source
   * 
   * checks all node behind and extracts the command link
   */
  $findNode(node, source) {
    let lastNode = node;

    do {
      if (this.$commandRegex.test(source)) {
        lastNode = node;
        break;
      }

      node = node.previousSibling? node.previousSibling :
        node.parentNode !== this.$element? node.parentNode.previousSibling : null;

      if(node) {
        source = (node.data || node.outerHTML) + source;
      }
    } while(node);

    let [html, url, text] = source.split(this.$commandRegex, 3);

    return [lastNode, text];
  }

  /**
   * Internal method: GetNodes.
   * 
   * @param {*} selection
   * Returns the first and last nodes of selection in a proper order.
   */
  $getNodes(selection) {
    var range = document.createRange();

    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    
    let [firstNode, secondNode, start, end] = (!range.collapsed)? 
      [selection.anchorNode, selection.focusNode, selection.anchorOffset, selection.focusOffset] : 
      [selection.focusNode, selection.anchorNode, selection.focusOffset, selection.anchorOffset];

    return {
      firstNode: firstNode,
      secondNode: secondNode,
      start: start,
      end: end,
    }
  }

  /**
   * Internal method: ToHtml.
   * 
   * @param {*} selection
   * Returns the html from selected text.
   */
  $toHtml(selection) {
    var nodes = this.$getNodes(selection);
    let nodeTypes = { // https://www.w3schools.com/jsref/prop_node_nodetype.asp
      text: 3,        //https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
      element: 1,
    };

    if(nodes.firstNode !== nodes.secondNode) {
      let sibling = nodes.secondNode.previousSibling;
      let list = [];

      if(nodes.firstNode.nodeType === nodeTypes.text) {
        list.push(nodes.firstNode.data.substring(nodes.start));
      }

      //TODO needs to think about the sibling nodes with the same tag
      while(sibling && sibling !== nodes.firstNode && sibling !== nodes.firstNode.parentNode) {
        if(sibling.nodeType === nodeTypes.text) {
          list.push(sibling.data);
        }
  
        if(sibling.nodeType === nodeTypes.element) {
          list.push(sibling.outerHTML);
        }
  
        sibling = sibling.previousSibling;
      }

      if(nodes.secondNode.nodeType === nodeTypes.text) {
        list.push(nodes.secondNode.data.substring(0, nodes.end));
      }
  
      return list.join('');
    }

    return nodes.firstNode.data.substring(nodes.start, nodes.end);
  }

  /**
   * @param {*} selection
   * 
   * Returns the executed test of selection if it can contain the link formated text.
   */
  test(selection) {
    let focusNode = selection.focusNode;
    let source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);
    let regex = new RegExp(this.$primitive? `(${this.$rule})$` : `[\\w\\s\\W\\S]+(${this.$rule})$`, 'i');
    let t = regex.test(source);

    return t;
  }

  /**
   * Replaces selection into command link format.
   */
  command2() {
    let selection = window.getSelection();
    let text = selection.toString();
    let inside = this.isInside(selection);

    if(text.length && inside) {
      document.execCommand('removeFormat', false);
      // document.execCommand('insertHTML', false, text);
      // // document.execCommand('insertText', false, text);

      // selection.collapse(selection.focusNode, 0);
      // selection.extend(selection.focusNode, text.length);
    }

    if(text.length && !inside) {
      let html = this.$toHtml(selection);
      
      // document.execCommand('insertHTML', false, `${this.$rules.start}${html.replace(this.$nodeRegex, '')}${this.$rules.end}`);
      this.command('insertHTML', false, this.$template.replace(/\$\{(\w+)\}/gi, html));

      selection.collapse(selection.focusNode, 0);
      selection.extend(selection.focusNode, text.length);
    }
  }

  /**
   * @param {*} selection
   * 
   * Replace selection into HTML Link Element
   */
  exec(selection) {
    let focusNode = selection.focusNode;
    let source = focusNode.data && focusNode.data.substr(0, selection.focusOffset);

    if (!source) {
      return;
    }

    if (this.$primitive) {
      selection.collapse(focusNode, source.length);
      selection.extend(focusNode, source.length - this.$command.length);
      this.command('insertHTML', false, this.$template);
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
      this.command('insertHTML', selection, styledHtml);
      return true;
    }
  }
}