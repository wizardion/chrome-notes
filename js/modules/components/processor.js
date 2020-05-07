class Processor {
  constructor (element, controls) {
    this.element = element;

    this.$helpers = {};

    // this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    document.addEventListener('keydown', this.$preProcessInput.bind(this));
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

    if (e.keyCode === code.r && e.ctrlKey) {
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

    // Input method
    if (e.key.length === 1 && nodes.firstNode === nodes.secondNode && nodes.firstNode.data) {
      nodes.firstNode.data = nodes.firstNode.data.substring(0, nodes.start) + e.key + nodes.firstNode.data.substring(nodes.end);
      selection.setBaseAndExtent(nodes.firstNode, nodes.start + 1, nodes.firstNode, nodes.start + 1);
    }

    // Enter command
    if (e.keyCode === code.enter) {
      let value = nodes.firstNode.data.length === nodes.start? '\n\n' : '\n';
      nodes.firstNode.data = nodes.firstNode.data.substring(0, nodes.start) + value + nodes.firstNode.data.substring(nodes.end);
      selection.setBaseAndExtent(nodes.firstNode, nodes.start + 1, nodes.firstNode, nodes.start + 1);
    }

    // Backspace command
    if (e.keyCode === code.back && nodes.firstNode === nodes.secondNode) {
      let length = (nodes.length > 0)? 0 : 1;
      nodes.firstNode.data = nodes.firstNode.data.substring(0, nodes.start - length) + nodes.firstNode.data.substring(nodes.end);
      selection.setBaseAndExtent(nodes.firstNode, nodes.start - length, nodes.firstNode, nodes.start - length);
    }

    // DELETE command
    if (e.keyCode === code.del && nodes.firstNode === nodes.secondNode) {
      let length = (nodes.length > 0)? 0 : 1;
      nodes.firstNode.data = nodes.firstNode.data.substring(0, nodes.start) + nodes.firstNode.data.substring(nodes.end + length);
      selection.setBaseAndExtent(nodes.firstNode, nodes.start, nodes.firstNode, nodes.start);
    }
  }
}
