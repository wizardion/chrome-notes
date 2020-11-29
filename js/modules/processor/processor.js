class Processor {
  constructor (element, controls) {
    this.element = element;
    this.$types = {
      element: 1,
      attr: 2,
      text: 3
    };

    this.$helpers = {};

    this.element.addEventListener('paste', this.$onPaste.bind(this));
    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    // document.addEventListener('keydown', this.$preProcessInput.bind(this));
    // this.element.addEventListener('keyup', this.$postProcessInput.bind(this));

    this.$timer = null;
    this.$history = [];

    //#region TEST_DATA
    var value = this.element.innerHTML;
    var cursor = null;
    var start = null;

    setTimeout(function(){
      setInterval(function () {
        if (document.activeElement === this.element) {
          var nodes = this.$getNodes(window.getSelection());

          if(value !== this.element.innerHTML || (cursor !== nodes.left || start !== nodes.start) || 1) {
            cursor = nodes.left;
            start = nodes.start;
            TextProcessor.log(this.element, {node: nodes.left, start: nodes.start}); 
            value = this.element.innerHTML;
          }
        }
      // }.bind(this), 250);
      }.bind(this), 1000);
    }.bind(this), 10);
    //#endregion
  }

  //#region Handlers
  $preProcessInput(e) {
    let selection = window.getSelection();

    // console.log(e);

    // Tmp
    if (e.keyCode === code.r && (e.ctrlKey || e.metaKey || e.altKey)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey || e.altKey) && code.sysKeys.indexOf(e.keyCode) >= 0) {
      // e.preventDefault();
      return;
    }

    // if ((e.ctrlKey || e.metaKey) && !isAllowed && e.keyCode !== code.back) {
    //   e.preventDefault();
    //   return;
    // }

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

    // Input method - New
    if (e.key.length === 1 && nodes.left === nodes.right &&
      nodes.left === this.element && this.element.childNodes.length === 0) {
        let textNode = document.createTextNode(e.key);

        nodes.left.appendChild(textNode);
        return selection.setBaseAndExtent(textNode, nodes.start + 1, textNode, nodes.start + 1);
    }

    // Input method
    if (!e.metaKey && e.key.length === 1 && nodes.left === nodes.right && nodes.left.nodeType === Node.TEXT_NODE) {
      if (!this.$history.length) {
        this.$setHistory(nodes.left, nodes.start);
      }

      nodes.left.data = nodes.left.data.substring(0, nodes.start) + e.key + nodes.left.data.substring(nodes.end);

      this.$setHistory(nodes.left, nodes.start + 1);
      return selection.setBaseAndExtent(nodes.left, nodes.start + 1, nodes.left, nodes.start + 1);
    }

    // Enter command
    if (e.keyCode === code.enter) {
      return this.$enter(selection, nodes);
    }

    // metaKey + Backspace command
    if (e.metaKey && e.keyCode === code.back && !nodes.selected) {
      let data = nodes.left? nodes.left.data.substring(0, nodes.start - 1) : '';
      let index = data.lastIndexOf(' ');

      nodes.step = 0;
      nodes.start = index < 0? 0 : index;
      nodes.selected = 2;
      return this.$backspace(selection, nodes);
    }

    // Backspace command
    if (e.keyCode === code.back) {
      return this.$backspace(selection, nodes);
    }

    // metaKey + Backspace command
    if (e.metaKey && e.keyCode === code.del && !nodes.selected && nodes.start < nodes.left.length) {
      let data = nodes.left? nodes.left.data.substring(nodes.start + 1) : '';
      let index = data.indexOf(' ');

      nodes.step = 0;
      nodes.end = nodes.start + index < 0? nodes.left.length : index + 2;
      nodes.selected = 2;
      return this.$delete(selection, nodes);
    }

    // DELETE command
    if (e.keyCode === code.del) {
      return this.$delete(selection, nodes);
    }

    // DELETE command
    if (e.metaKey && e.shiftKey && e.keyCode === code.z) {
      return this.$getHistory(selection, 1);
    }
    
    // DELETE command
    if (e.metaKey && e.keyCode === code.z) {
      return this.$getHistory(selection, -1);
    }

    throw 'Unhandled Exception!';
  }

  $onPaste(e) {
    var clipboard = (e.originalEvent || e).clipboardData;
    let selection = window.getSelection();
    var nodes = this.$getNodes(selection);
    var text = clipboard.getData('text/plain');

    e.preventDefault();

    if (nodes.left && nodes.left.nodeType === Node.TEXT_NODE) {
      this.$setData(selection, nodes, nodes.start, nodes.end, text);
    }
  }
  //#endregion

  //#region Commands
  $delete(selection, nodes) {
    if (!this.$canMoveForward(nodes)) {
      console.log('The End!');
      return;
    }

    this.$setData(selection, nodes, nodes.start, nodes.end + nodes.step);
  }

  $backspace(selection, nodes, level=null) {
    if (!this.$canMoveBackward(nodes)) {
      console.log('The End!');
      return;
    }

    this.$setData(selection, nodes, nodes.start - nodes.step, nodes.end);
  }

  $enter(selection, nodes) {
    this.$setData(selection, nodes, nodes.start, nodes.end, '\n');
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

  // $getSize(node) {
  //   var height = 0;

  //   if (!this.$render) {
  //     this.$render = document.createElement('div');
  //     // this.$render = this.element.cloneNode();
  //     this.$render.style.width = this.element.offsetWidth - 10;
  //     // this.$render.style.height = 'auto';
  //     // this.$render.style.minHeight = 'auto';
  //     this.$render.style.position = 'fixed';
  //     this.$render.style.whiteSpace = 'pre-wrap';
  //     this.$render.style.visibility = 'hidden';
  //     this.$render.style.top = 2;
  //     this.$render.style.zIndex = -1;
  //     this.$render.style.background = 'yellow';
      
  //     document.body.appendChild(this.$render);
  //   }

  //   this.$render.innerHTML = 'a'
  //   height = this.$render.offsetHeight;
  //   this.$render.innerHTML = node.data;

  //   return parseInt(this.$render.offsetHeight / height);
  // }

  $canMoveBackward(nodes) {
    var resutl = !(
      (!nodes.selected && nodes.start - nodes.step < 0) && 
      !nodes.previousSibling && 
      (nodes.left === this.element || nodes.left.parentNode === this.element)
    );
    
    return resutl;
  }

  $canMoveForward(nodes) {
    if (!nodes.selected && !nodes.nextSibling &&
      nodes.left.nodeType === Node.TEXT_NODE && nodes.start >= nodes.left.length) {
        return false;
    }

    var resutl = !(
      !nodes.nextSibling && nodes.left && nodes.left.nodeType !== Node.TEXT_NODE &&
      (nodes.left === this.element || nodes.left.parentNode === this.element)
    );

    return resutl;
  }

  //TODO need to rewrite
  $isInList(node) {
    return node && (node.nodeName === 'LI' || 
           node.parentNode && node.parentNode.nodeName === 'LI')
  }

  $setData(selection, nodes, start, end, value='') {
    let left = nodes.left.data.substring(0, start) + value;
    let right = nodes.left.data.substring(end);

    this.$setHistory(nodes.left, nodes.start);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.left.data = left + right;
    nodes.start = start + value.length;
    selection.setBaseAndExtent(nodes.left, nodes.start, nodes.left, nodes.start);
  }

  $setHistory(node, start){
    var data = {
      html: this.element.innerHTML,
      start: start,
      possition: this.$getPossition(node),
      nodes: this.element.childNodes
    };

    if (this.$currentHistory && this.$currentHistory < this.$history.length - 1) {
      this.$history = this.$history.splice(0, this.$currentHistory);
    }

    this.$history.push(data);
    this.$currentHistory = this.$history.length - 1;
  }

  $getHistory(selection, step){
    // var data = this.$history.pop();
    this.$currentHistory += step;

    console.log({
      'c0': this.$currentHistory
    });

    if(this.$currentHistory < 0) {
      this.$currentHistory = 0;
    }

    if(this.$currentHistory >= this.$history.length) {
      this.$currentHistory = this.$history.length - 1;
    }

    var data = this.$history[this.$currentHistory];

    console.log({
      'c': this.$currentHistory,
      'h': this.$history
    });

    if (data) {
      this.element.innerHTML = data.html;
      var node = this.$getNode(data.possition);      

      selection.setBaseAndExtent(node, data.start, node, data.start);
    }
  }

  $getPossition(node) {
    var children = 0;
    var nodes = 0;

    while (node.parentNode && node.parentNode !== this.element) {
      children++;
      node = node.parentNode;
    }

    while (node && node.previousSibling) {
      nodes++;
      node = node.previousSibling;
    }

    return {children: children, nodes: nodes};
  }

  $getNode(possition) {
    var node = this.element.childNodes[possition.nodes];

    for (var i = 0; i < possition.children; i++) {
      node = node.firstChild;
    }

    return node;
  }
  //#endregion
}
