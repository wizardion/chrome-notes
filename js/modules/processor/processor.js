class Processor {
  constructor (element, controls) {
    this.element = element;
    this.$types = {
      element: 1,
      attr: 2,
      text: 3
    };

    this.$helpers = {};

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    // document.addEventListener('keydown', this.$preProcessInput.bind(this));
    // this.element.addEventListener('keyup', this.$postProcessInput.bind(this));

    this.$timer = null;

    //#region TEST_DATA
    var value = this.element.innerHTML;
    setInterval(function () {
      // if(value !== this.element.innerHTML) { TextProcessor.log(this.element); value = this.element.innerHTML; }
    }.bind(this), 5)
    //#endregion
  }

  //#region Handlers
  $preProcessInput(e) {
    let selection = window.getSelection();

    // console.log(e);

    if (e.keyCode === code.r && (e.ctrlKey || e.metaKey)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && code.allowed.indexOf(e.keyCode) < 0) {
      // e.preventDefault();
      return;
    }

    if (code.allowed.indexOf(e.keyCode) < 0) {
      this.element.spellcheck = false;
      clearInterval(this.$timer);

      e.preventDefault();

      this.$processInput(e, selection);

      this.$timer = setTimeout(function(){
        this.element.spellcheck = true;
        console.log('spellcheck')
      }.bind(this), 10000);
    }
  }

  $processInput(e, selection) {
    var nodes = this.$getNodes(selection);

    // console.log(selection)
    // console.log(e)
    // console.log(nodes)

    // Input method - New
    if (e.key.length === 1 && nodes.left === nodes.right && 
      nodes.left === this.element && this.element.childNodes.length === 0) {
        let textNode = document.createTextNode(e.key);

        nodes.left.appendChild(textNode);
        return selection.setBaseAndExtent(textNode, nodes.start + 1, textNode, nodes.start + 1);
    }

    // Input method
    if (e.key.length === 1 && nodes.left === nodes.right && nodes.left.data) {
      nodes.left.data = nodes.left.data.substring(0, nodes.start) + e.key + nodes.left.data.substring(nodes.end);
      return selection.setBaseAndExtent(nodes.left, nodes.start + 1, nodes.left, nodes.start + 1);
    }

    // Enter command
    if (e.keyCode === code.enter) {
      return this.$enter(selection, nodes);
    }

    // Backspace command
    if (e.keyCode === code.back) {
      return this.$backspace(selection, nodes);
    }

    // DELETE command
    if (e.keyCode === code.del && nodes.left === nodes.right) {
      return this.$delete(selection, nodes);
    }
  }
  //#endregion

  //#region Commands
  $delete(selection, nodes) {
    let left = nodes.left.data.substring(0, nodes.start);
    let right = nodes.left.data.substring(nodes.end + nodes.step);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.left.data = left + right;
    selection.setBaseAndExtent(nodes.left, nodes.start, nodes.left, nodes.start);
  }

  $backspace(selection, nodes) {
    if (!this.$canMoveBackward(nodes)) {
      console.log('The End!');
      return;
    }

    if (!nodes.selected && nodes.start - nodes.step < 0) {
      console.log('The node is ended!');
      return;
    }

    if (nodes.selected && nodes.left !== nodes.right) {
      console.log('Multipules nodes selected!');
      return;
    }

    let left = nodes.left.data.substring(0, nodes.start - nodes.step);
    let right = nodes.left.data.substring(nodes.end);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.left.data = left + right;
    selection.setBaseAndExtent(nodes.left, nodes.start - nodes.step, nodes.left, nodes.start - nodes.step);
  }

  $enter(selection, nodes) {
    let value = nodes.left.data.length === nodes.start? '\n\n' : '\n';
    let left = nodes.left.data.substring(0, nodes.start) + value;
    let right = nodes.left.data.substring(nodes.end);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.left.data = left + right;
    selection.setBaseAndExtent(nodes.left, nodes.start + 1, nodes.left, nodes.start + 1);
  }
  //#endregion

  //#region Internal Functions
  $getNodes(selection) {
    var range = document.createRange();
    var selected = selection.toString().length;

    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    
    let [leftNode, rightNode, start, end] = (!range.collapsed)? 
      [selection.anchorNode, selection.focusNode, selection.anchorOffset, selection.focusOffset] : 
      [selection.focusNode, selection.anchorNode, selection.focusOffset, selection.anchorOffset];

    return {
      left: leftNode,
      right: rightNode,
      previousSibling: leftNode.previousSibling,
      nextSibling: rightNode.nextSibling,
      start: start,
      end: end,
      selected: selected,
      step: (selected > 0)? 0 : 1
    }
  }

  $canMoveBackward(nodes) {
    return !((!nodes.selected && nodes.start - nodes.step < 0) && !nodes.previousSibling && 
        (nodes.left === this.element || nodes.left.parentNode === this.element));
  }

  $canMoveForward(nodes) {
    return true;
  }
  //#endregion
}
