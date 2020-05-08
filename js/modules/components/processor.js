class Processor {
  constructor (element, controls) {
    this.element = element;

    this.$helpers = {};

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    // document.addEventListener('keydown', this.$preProcessInput.bind(this));
    // this.element.addEventListener('keyup', this.$postProcessInput.bind(this));

    this.$timer = null;

    //#region TEST_DATA
    setInterval(function () {
      TextProcessor.log(this.element);
    }.bind(this), 250)
    //#endregion
  }

  $preProcessInput(e) {
    let selection = window.getSelection();

    // console.log({
    //   'e': e
    // })

    if (e.keyCode === code.r && e.ctrlKey) {
      return;
    }

    if (e.ctrlKey && code.allowed.indexOf(e.keyCode) < 0) {
      e.preventDefault();
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
      }.bind(this), 1000);
    }
  }

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
      length: (end - start)
    }
  }

  $processInput(e, selection) {
    var nodes = this.$getNodes(selection);

    // console.log(selection)
    // console.log(e)
    console.log(nodes)

    // Input method - New
    if (e.key.length === 1 && nodes.firstNode === nodes.secondNode && 
      nodes.firstNode === this.element && this.element.childNodes.length === 0) {
        let textNode = document.createTextNode(e.key);

        nodes.firstNode.appendChild(textNode);
        return selection.setBaseAndExtent(textNode, nodes.start + 1, textNode, nodes.start + 1);
    }

    // Input method
    if (e.key.length === 1 && nodes.firstNode === nodes.secondNode && nodes.firstNode.data) {
      nodes.firstNode.data = nodes.firstNode.data.substring(0, nodes.start) + e.key + nodes.firstNode.data.substring(nodes.end);
      return selection.setBaseAndExtent(nodes.firstNode, nodes.start + 1, nodes.firstNode, nodes.start + 1);
    }

    // Enter command
    if (e.keyCode === code.enter) {
      return this.$enter(selection, nodes);
    }

    // Backspace command
    if (e.keyCode === code.back && nodes.firstNode === nodes.secondNode) {
      return this.$backspace(selection, nodes);
    }

    // DELETE command
    if (e.keyCode === code.del && nodes.firstNode === nodes.secondNode) {
      return this.$delete(selection, nodes);
    }
  }

  //#region commmans
  $delete(selection, nodes) {
    let length = (nodes.length > 0)? 0 : 1;
    let left = nodes.firstNode.data.substring(0, nodes.start);
    let right = nodes.firstNode.data.substring(nodes.end + length);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.firstNode.data = left + right;
    selection.setBaseAndExtent(nodes.firstNode, nodes.start, nodes.firstNode, nodes.start);
  }

  $backspace(selection, nodes) {
    let length = (nodes.length > 0)? 0 : 1;
    let left = nodes.firstNode.data.substring(0, nodes.start - length);
    let right = nodes.firstNode.data.substring(nodes.end);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.firstNode.data = left + right;
    selection.setBaseAndExtent(nodes.firstNode, nodes.start - length, nodes.firstNode, nodes.start - length);
  }

  $enter(selection, nodes) {
    let value = nodes.firstNode.data.length === nodes.start? '\n\n' : '\n';
    let left = nodes.firstNode.data.substring(0, nodes.start) + value;
    let right = nodes.firstNode.data.substring(nodes.end);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.firstNode.data = left + right;
    selection.setBaseAndExtent(nodes.firstNode, nodes.start + 1, nodes.firstNode, nodes.start + 1);
  }
  //#endregion
}
