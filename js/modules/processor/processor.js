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
    if (e.key.length === 1 && nodes.left === nodes.right && nodes.left.nodeType === Node.TEXT_NODE) {
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

    throw 'Unhandled Exception!';
  }
  //#endregion

  //#region Commands
  $delete(selection, nodes) {
    // let left = nodes.left.data.substring(0, nodes.start);
    // let right = nodes.left.data.substring(nodes.end + nodes.step);

    // if (right.length === 0 && left[left.length - 1] === '\n') {
    //   right += '\n';
    // }

    // nodes.left.data = left + right;
    // selection.setBaseAndExtent(nodes.left, nodes.start, nodes.left, nodes.start);

    this.$setData(selection, nodes, nodes.start, nodes.end + nodes.step);
  }

  $backspace(selection, nodes, level=null) {
    let helper = new NodeHelper(this.element, nodes);

    // The End!
    if (!this.$canMoveBackward(nodes)) {
      console.log('The End!');
      return;
    }

    // moving backward
    if (!nodes.selected && nodes.start - nodes.step < 0) {
      nodes.left = helper.backToPrevous(nodes.left);

      if(!nodes.left) {
        if (!this.element.firstChild) {
          nodes.left = document.createTextNode('');
          this.element.appendChild(nodes.left);
        } else {
          nodes.left = helper.$deegDown(this.element.firstChild);
        }

        nodes.right = nodes.left;
        nodes.start = 0;
        nodes.end = 0;
        nodes.step = 0;
      } else {
        nodes.right = nodes.left;
        nodes.start = nodes.left.data.length;
        nodes.end = nodes.left.data.length;
        nodes.step = (nodes.left.data.length && !level && !this.$isInList(nodes.left))? 1 : 0;
      }
    }

    // Multipules nodes selected!
    if (nodes.selected && nodes.left !== nodes.right) {
      console.warn('Multipules nodes selected!');
      return;
    }

    this.$setData(selection, nodes, nodes.start - nodes.step, nodes.end);
    
    // cleaning up
    if (!level && !nodes.selected && helper.isEmptyNode(nodes.left) && this.element.childNodes.length === 1) {
    // if (!level && !nodes.selected && helper.isEmptyNode(nodes.left)) {
      return this.$backspace(selection, nodes, 1);
    }
  }

  $setData(selection, nodes, start, end) {
    let left = nodes.left.data.substring(0, nodes.start - nodes.step);
    let right = nodes.left.data.substring(nodes.end);

    if (right.length === 0 && left[left.length - 1] === '\n') {
      right += '\n';
    }

    nodes.left.data = left + right;
    nodes.start = nodes.start - nodes.step;
    selection.setBaseAndExtent(nodes.left, nodes.start, nodes.left, nodes.start);
  }

  $backspace0(selection, nodes) {
    let helper = new NodeHelper(this.element, nodes);

    // The End!
    if (!this.$canMoveBackward(nodes)) {
      console.log('The End!');
      return;
    }

    if (!nodes.selected && nodes.start - nodes.step < 0) {
      console.log({
        'previousSibling': nodes.previousSibling
      });
      
      nodes.left = helper.backToPrevous(nodes.left);

      if(!nodes.left) {
        console.log('The End 2!');

        if (!this.element.lastChild) {
          console.log('Add a text node');
        }

        return;
      }

      nodes.right = nodes.left;
      nodes.start = nodes.left.data.length;
      nodes.end = nodes.left.data.length;
      nodes.step = (nodes.left.data.length)? 1 : 0;

      console.log('The End of the node!');
      // return;
    }

    // Multipules nodes selected!
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
    nodes.start = nodes.start - nodes.step;

    //#region Remove
    // if (helper.isEmptyNode(nodes.left) && this.$canMoveBackward(nodes)) {
    //   nodes.left = helper.backToPrevous(nodes.left);
    //   nodes.right = nodes.left;
    //   nodes.start = nodes.left.data.length;
    //   nodes.end = nodes.left.data.length;
    //   nodes.step = 0;

    //   console.log('The End of the node2!');

    //   if (!this.element.lastChild) {
    //     console.log('add a text node');
    //   }
    // }
    //#endregion

    // ?
    if (!nodes.left.data.length && this.$canMoveBackward(nodes)) {
      // console.log({
      //   'left': nodes.left,
      //   'start': nodes.start,
      //   'step': nodes.step
      // });

      // nodes.left = helper.backToPrevous(nodes.left);

      // if(!nodes.left) {
      //   console.log('The End 3!');

      //   if (!this.element.lastChild) {
      //     console.log('Add a text node 3!');
      //   }

      //   return;
      // }

      // nodes.right = nodes.left;
      // nodes.start = nodes.left.data.length;
      // nodes.end = nodes.left.data.length;
      // nodes.step = 0;
    }
    
    selection.setBaseAndExtent(nodes.left, nodes.start, nodes.left, nodes.start);
    // console.warn(`"${this.element.innerHTML}"`);
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
    var resutl = !(
      (!nodes.selected && nodes.start - nodes.step < 0) && 
      !nodes.previousSibling && 
      (nodes.left === this.element || nodes.left.parentNode === this.element)
    );
    
    // console.log({
    //   '0':(!nodes.selected && nodes.start - nodes.step < 0),
    //   'start':nodes.start,
    //   'step':nodes.step,
    //   'previousSibling': !nodes.previousSibling,
    //   'element': (nodes.left === this.element || nodes.left.parentNode === this.element),
    //   'resutl': resutl,
    //   'is': (
    //     (!nodes.selected && nodes.start - nodes.step < 0) && 
    //     !nodes.previousSibling && 
    //     (nodes.left === this.element || nodes.left.parentNode === this.element)
    //   ),
    //   'add': (this.element.lastChild === nodes.left && nodes.left.nodeType === Node.TEXT_NODE && !nodes.left.data.length)
    // });
    
    return resutl;
  }

  $canMoveForward(nodes) {
    return true;
  }

  $isInList(node) {
    return node && (node.nodeName === 'LI' || 
           node.parentNode && node.parentNode.nodeName === 'LI')
  }
  //#endregion
}
