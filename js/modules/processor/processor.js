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
    this.$history = new NodeHistory(this.element);

    this.$possition =  null;
    // this.$offsetTop = null;
    // this.$clientHeight = null;

    //#region TEST_DATA
    var value = this.element.innerHTML;
    var cursor = null;
    var start = null;

    // setTimeout(function(){
    //   setInterval(function () {
    //     if (document.activeElement === this.element) {
    //       var nodes = this.$getNodes(window.getSelection());

    //       if(value !== this.element.innerHTML || (cursor !== nodes.left || start !== nodes.start) || 1) {
    //         cursor = nodes.left;
    //         start = nodes.start;
    //         TextProcessor.log(this.element, {node: nodes.left, start: nodes.start}); 
    //         value = this.element.innerHTML;
    //       }
    //     }
    //   // }.bind(this), 250);
    //   }.bind(this), 1000);
    // }.bind(this), 10);
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

    // console.log({
    //   'sysKey': e.ctrlKey && 'ctrlKey' || e.metaKey && 'metaKey' || e.altKey && 'altKey' || e.shiftKey && 'shiftKey',
    //   'keyCode': e.keyCode,
    //   'code': e.code,
    //   'is': (e.ctrlKey || e.metaKey) && e.keyCode === code.z
    // });

    // Input method - New
    if (e.key.length === 1 && nodes.left === nodes.right &&
        nodes.left === this.element && this.element.childNodes.length === 0) {
        let textNode = document.createTextNode(e.key);

        nodes.left.appendChild(textNode);
        return selection.setBaseAndExtent(textNode, nodes.start + 1, textNode, nodes.start + 1);
    }

    // Input method
    if (!(e.ctrlKey || e.metaKey) && e.key.length === 1 && nodes.left === nodes.right && nodes.left.nodeType === Node.TEXT_NODE) {
      this.$history.preserve(nodes.left, nodes.start, nodes.selected);

      nodes.left.data = nodes.left.data.substring(0, nodes.start) + e.key + nodes.left.data.substring(nodes.end);

      this.$history.push(nodes.left, nodes.start + 1);
      selection.setBaseAndExtent(nodes.left, nodes.start + 1, nodes.left, nodes.start + 1);
      this.$scrollToSelection(selection);
      return;
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
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === code.z) {
      return this.$history.forward(selection);
    }
    
    // DELETE command
    if ((e.ctrlKey || e.metaKey) && e.keyCode === code.z) {
      return this.$history.back(selection)
    }

    throw 'Unhandled Exception!';
  }

  $onPaste(e) {
    var clipboard = (e.originalEvent || e).clipboardData;
    let selection = window.getSelection();
    var nodes = this.$getNodes(selection);
    var text = clipboard.getData('text/plain');

    e.preventDefault();

    if (nodes.left === nodes.right && nodes.left === this.element && this.element.childNodes.length === 0) {
        let textNode = document.createTextNode('');

        nodes.left.appendChild(textNode);
        nodes.left = textNode;
        nodes.right = nodes.left;
        nodes.selected = 0;
        nodes.start = 0;
        nodes.end = 0;
    }

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
    
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);

    // var rect = range.getBoundingClientRect();
    // var point = {y: rect.y, height: rect.height};

    // if (selected > 0) {
    //   var rects = range.getClientRects();
    //   point.height = rects[0].height;
    // }

    return {
      left: leftNode,
      right: rightNode,
      previousSibling: leftNode.previousSibling,
      nextSibling: rightNode.nextSibling,
      start: start,
      end: end,
      selected: selected,
      step: (selected > 0)? 0 : 1,
      // point: point
    }
  }

  $scrollToCaret(point) {
    this.$possition = this.$possition || {
      top: this.element.parentNode.offsetTop,
      height: this.element.parentNode.clientHeight,
    };

    if ((point.y - this.$possition.top) < 0) {
      // let scrollTop = Math.ceil(0 - (possition.y - this.$possition.top));
      let scrollTop = Math.ceil((0 - (point.y - this.$possition.top)) + (this.$possition.height / 2));

      this.element.parentNode.scrollTo(Math.max(this.element.parentNode.scrollTop - scrollTop, 0));
      return;
    }

    if ((point.y + point.height) > (this.$possition.height + this.$possition.top)) {
      let max = this.element.parentNode.scrollHeight - this.$possition.height;
      let top = ((point.y + point.height) - (this.$possition.height + this.$possition.top));
      // scrollTop = Math.round(top);
      var scrollTop = Math.round(top + (this.$possition.height / 2));

      this.element.parentNode.scrollTo(Math.min(this.element.parentNode.scrollTop + scrollTop, max));
      return;
    }
  }

  $scrollToSelection(selection) {
    var range = document.createRange();

    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);

    var rect = range.getBoundingClientRect();

    this.$scrollToCaret({y: rect.y, height: rect.height});
  }

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
    
    this.$history.preserve(nodes.left, nodes.start, nodes.selected);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.left.data = left + right;
    nodes.start = start + value.length;
    selection.setBaseAndExtent(nodes.left, nodes.start, nodes.left, nodes.start);

    this.$scrollToSelection(selection);
    this.$history.push(nodes.left, nodes.start);
  }

  
  //#endregion
}
