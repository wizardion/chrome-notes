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
      if(value !== this.element.innerHTML) { TextProcessor.log(this.element); value = this.element.innerHTML; }
    }.bind(this), 5)
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
      length: selection.toString().length
    }
  }

  $processInput(e, selection) {
    var nodes = this.$getNodes(selection);

    // console.log(selection)
    // console.log(e)
    // console.log(nodes)

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
    console.log({'start-0': nodes.start});

    if (nodes.length === 0) {
      if (nodes.start === 0 && nodes.firstNode.length > 0 && nodes.firstNode.data[0] === '\n') {
        console.log({'start-1': nodes.start});
        nodes.firstNode.data = nodes.firstNode.data.substring(1);
        let [firstNode, start] = this.$toPreviousSibling(selection, nodes.firstNode);
        return selection.setBaseAndExtent(firstNode, start, firstNode, start);
      }

      if(nodes.start === 1 && this.$check(nodes.firstNode)) {
        nodes.firstNode.data = nodes.firstNode.data.substring(1);
        return selection.setBaseAndExtent(nodes.firstNode, 0, nodes.firstNode, 0);
      }

      if(nodes.start === 0 && this.$check(nodes.firstNode)) {
        console.log({'start-1.2': nodes.start});
        let [firstNode, start] = this.$toPreviousSibling(selection, nodes.firstNode);
        return selection.setBaseAndExtent(firstNode, start, firstNode, start);
      }

      console.log({'b': nodes.firstNode.previousSibling})
      if(nodes.start === 0 && nodes.firstNode.previousSibling && nodes.firstNode.previousSibling.lastChild.nodeName === 'LI') {
        console.log({'start-1.3': nodes.start});
        let [firstNode, start] = this.$toPreviousSibling(selection, nodes.firstNode);
        return selection.setBaseAndExtent(firstNode, start, firstNode, start);
      }

      let [firstNode, start] = !nodes.start? this.$toPreviousSibling(selection, nodes.firstNode) : [nodes.firstNode, nodes.start];

      console.log({'start-2': nodes.start});

      if (start === 0 && firstNode === nodes.firstNode) {
        return;
      } else {
        nodes.firstNode = firstNode;
        nodes.start = start;
      }

      let len = !nodes.start? 0 : 1;
      let left = nodes.firstNode.data.substring(0, nodes.start - len);
      let right = nodes.firstNode.data.substring(nodes.start);

      console.log({'right-1': right, 'left': left, 'len': len, 'is': left[left.length - 1] === '\n'});
      if (right.length === 0 && left[left.length - 1] === '\n') {
        right += '\n';
      }

      console.log({'right-2': right, 'left': left});
      if (right === '\n' && left[left.length - 1] !== '\n' && 
          !nodes.firstNode.nextSibling && !nodes.firstNode.previousSibling) {
        right = '';
      }

      console.log({'right-3': right, 'left': left});
      nodes.firstNode.data = left + right;

      if (nodes.firstNode.length === 0) {
        console.log({'start-3': nodes.start})
        let [node, index] = this.$toPreviousSibling(selection, nodes.firstNode);
        selection.setBaseAndExtent(node, index, node, index);
      } else {
        console.log({'start-4': nodes.start})
        selection.setBaseAndExtent(nodes.firstNode, nodes.start - len, nodes.firstNode, nodes.start - len);
      }
    }
  }

  $check(node) {
    return (node && node.nodeType === this.$types.text && node.parentNode.nodeName === 'LI') || 
            (node && node.nodeType !== this.$types.text && node.nodeName === 'LI');
  }

  // Works with textNodes only.
  $toPreviousSibling(selection, node) {
    let previousNode = node;
    let length = 0;

    console.log({'node-00': node});

    // if not previous sibling we try to get it from the parents.
    if (!node.previousSibling) {
      node = node.parentNode;

      console.log({'node-0': node});

      if (previousNode.parentNode === this.element) {
        console.log({'node-exit': previousNode});
        return [previousNode, 0];
      }

      if ((previousNode.nodeType === this.$types.text && previousNode.length === 0) || 
          (previousNode.nodeType !== this.$types.text && !previousNode.firstChild)) {
        console.log({'node-remove-1': previousNode});
        previousNode.remove();
        previousNode = node;
      }

      console.log({'node-1': node})

      while(node.parentNode !== this.element && !node.previousSibling) {
        console.log({'node-2': node});

        previousNode = node;
        node = node.parentNode;

        if ((previousNode.nodeType === this.$types.text && previousNode.length === 0) || 
            (previousNode.nodeType !== this.$types.text && !previousNode.firstChild)) {
          console.log({'node-remove-2': previousNode});
          previousNode.remove();
          previousNode = node;
        }
      }

      if (!node.previousSibling) {
        console.log({'node-3': node});
        console.log('THE END!');

        if (!node.nextSibling) {
          console.log({'node-3.1': node});
          return node;
        }
        
        throw '$toNextSibling is not implemented yet!'
      }
      
      node = node.previousSibling;
    } else {
      node = node.previousSibling;
    }

    // remove next node (which is previousNode) if it is emplty.
    if ((previousNode.nodeType === this.$types.text && previousNode.length === 0) || 
        (previousNode.nodeType !== this.$types.text && !previousNode.firstChild)) {
      console.log({'node-remove-3': previousNode});
      previousNode.remove();
    }

    /* if *selected* sibling is text and next sibling is the same like `"selected""next"`: 
     * we merge it into the selected sibling: `"selectednext"` */
    if (node.nextSibling && node.nodeType === this.$types.text && node.nodeType === node.nextSibling.nodeType) {
      length = node.length;
      node.data += node.nextSibling.data;
      node.nextSibling.remove();
    }
    
    /* if *selected* sibling is not text and next sibling is the same like `<b>selected</b><b>next</b>`:
     * we merge it into the selected sibling: `<b>selectednext</b>` */
    if (node.nextSibling && node.nodeType !== this.$types.text && node.nodeName === node.nextSibling.nodeName) {
      let tmp = node;
      let r = tmp;

      console.log({'node-r-0': tmp});

      while (tmp.lastChild) {
        tmp = tmp.lastChild;
      }

      length = tmp.length;
      r = tmp;

      console.log({'node-r-1': tmp, 'nextSibling': node.nextSibling});

      while (node.nextSibling.firstChild) {
        let firstChild = node.nextSibling.firstChild;

        console.log({'node-r-2': firstChild});

        if (tmp && firstChild.nodeType === this.$types.text) {
          console.log({'node-r-3': firstChild});
          tmp.data += firstChild.data;
        } else {
          console.log({'node-r-4': firstChild, 'node': node});
          tmp = null;
          node.appendChild(firstChild.cloneNode(true));
        }

        firstChild.remove();
      }

      node.nextSibling.remove();

      return [r, length];
    }

    // if previous sibling is part of the list

    /* if *selected* sibling is a list and there are next siblings:
     * we merge it into the selected sibling's lastChild all the next siblings until the end of paragraph and quit. */
    if (node.nodeName === 'OL') { // TODO implement by id nodeName
      let tmp = node;
      let nextSibling = tmp;

      // dig into the left childs: current element
      while (tmp.lastChild) {
        tmp = tmp.lastChild;
      }
      length = tmp.length;
      nextSibling = tmp;
      //-------------------------

      // search next end of paragraph
      if (node.nextSibling) {
        let next = node.nextSibling;
        var current = nextSibling;
        // let index = -1;

        // find the element that have the end of paragraph.
        while(next) {
          const text = next.nodeType === this.$types.text? next.nodeValue : next.innerText;
          var id = text.indexOf('\n');
          var nextS = next.nextSibling;

          console.log({'next-0': next, 'match': id, 'text': text});

          if (id > -1) {
            let n = this.$splitBySymbol(next, '\n');
            console.log({
              'text-match': text,
              'node': n
            });

            // next = this.$splitBySymbol2(n, ind, next);
            // current = this.$merge(current, next);

            // console.log({
            //   'current': current
            // });

            // console.log({
            //   'n': this.$splitBySymbol2(n, 1, next)
            // });

            // this.$merge(this.$splitBySymbol(next, '\n'), next);

            break;
          } else {
            current = this.$merge(current, next);
          }

          next = nextS;
        }

        console.log({'next': next});

        //#region Remove
        /* do {
          const text = next.nodeType === this.$types.text? next.nodeValue : next.innerText;
          var id = text.indexOf('\n');

          console.log({'next-0': text, 'match': id});

          if (id > -1) {
            index = id;
            // break;
          }

          next = next.nextSibling? next.nextSibling : next;
        } while(next.nextSibling); */
        //#endregion
    
        //#region Remove3
        // let current = node.nextSibling;

        // // remove all the next elements until the end of paragraph.
        // while(current !== next) {
        //   console.log({'current-0': current});

        //   current = current.nextSibling;
        // }

        // console.log({'current': current});
        //#endregion
      }

      //#region Remove 2
      /* do {
        let tcurrent = current;

        console.log({'next-1': next, 'current': current, 'is': (current === next), 'while': (current !== next)});

        if (current.nodeType !== this.$types.text) {
          while (current.firstChild) {
            const firstChild = current.firstChild;
    
            console.log({'node-r-20': firstChild});
    
            if (tmp && firstChild.nodeType === this.$types.text) {
              console.log({'node-r-30': firstChild});
              tmp.data += firstChild.data;
            } else {
              console.log({'node-r-40': firstChild, 'node': node});
              tmp = null;
              node.appendChild(firstChild.cloneNode(true));
            }
    
            firstChild.remove();
          }
        } else {
          console.log({'node-r-50': current});
          if (current === next) {
            tmp.data += current.data.substring(0, index);
            current.data = current.data.substring(index + 1);

            if (current.data.length === 0) {
              current.remove();
            }

          } else {
            tmp.data += current.data;
          }
        }

        if (current !== next) {
          current = current.nextSibling;
          tcurrent.remove();
        }
      } while(current !== next); */
      //#endregion

      return [nextSibling, length];
    }

    console.log({'node-4': node});

    // If we still have the *selected* sibling, we dig into lastChild of it.
    while (node.lastChild) {
      console.log({'node-5': node})
      node = node.lastChild;
    }

    // if length if not exists, we get it from the lastChild.
    if (!length) {
      length = node.length;
    }

    console.log({'node-6': node})
    // returning the lastChild of *selected* sibling and its length. 
    return [node, length];
  }

  $splitBySymbol2(node, offset, limit) {
    var parent = limit.parentNode;
    var parentOffset = this.$getNodeIndex(parent, limit);
  
    var doc = node.ownerDocument;  
    var leftRange = doc.createRange();

    leftRange.setStart(parent, parentOffset);
    leftRange.setEnd(node, offset);

    var left = leftRange.extractContents();

    parent.insertBefore(left, limit);

    // return [left, limit];
    return limit.previousSibling;
  }
  
  $getNodeIndex(parent, node) {
    var index = parent.childNodes.length;
    while (index--) {
      if (node === parent.childNodes[index]) {
        break;
      }
    }
    return index;
  }

  $splitBySymbol(firstNode, symbol) {
    var collection = firstNode.childNodes;
    var list = [];

    var tmpNode = firstNode.cloneNode();

    console.log({
      'collection': collection
    });

    console.log({'s-00': firstNode});
    
    for (var i = 0; i < collection.length; i++) {
      const node = collection[i];
      let tmp = node;
      // list.push(node);

      console.log({'s-0': tmp});

      let tmpC = tmp.cloneNode();
      tmpNode.appendChild(tmpC);

      //#region deep
      //dig to lowest level
      while(1) {


        while (tmp.firstChild) {
          tmp = tmp.firstChild;

          let subC = tmp.cloneNode();
          tmpC.appendChild(subC);

          tmpC = subC;


          console.log({'s-1': tmp});
        }

        //lowest level
        if (tmp.nodeType === Node.TEXT_NODE) {
          let index = tmp.data.indexOf(symbol);

          console.log({'s-2': tmp});

          // check symbol
          if (index >= 0) {
            // divide and break;
            // let sub = tmp.data.substring(0, index);

            // tmp.data = tmp.data.replace(symbol, '');
            tmpC.data = tmp.data.substring(0, index);
            // return $splitBySymbol2(tmp, index, firstNode);

            // console.log({'sub': index})
            console.log({
              '-tmpNode-': tmpNode.outerHTML
            });

            return [index, tmp];
            // break;
          }
        }

        // next from lowest level
        if (tmp.nextSibling && tmp.parentNode !== firstNode) {
          // continue to next.
          tmp = tmp.nextSibling;

          let pC = tmp.cloneNode();
          tmpC.parentNode.appendChild(pC);
          tmpC = pC;

          console.log('!!!GOING TO THE NEXT!!!');
          continue;
        }

        // up from lowest level
        while(tmp.parentNode !== firstNode) {
          tmp = tmp.parentNode;
          console.log('!!!GOING TO THE PARENT!!!');

          let pC = tmp.cloneNode();
          tmpC = tmpC.parentNode;
          tmpC.parentNode.appendChild(pC);
          tmpC = pC;

          if (tmp.nextSibling) {
            tmp = tmp.nextSibling;

            let pC = tmp.cloneNode();
            tmpC.parentNode.appendChild(pC);
            tmpC = pC;

            console.log('!!!GOING TO THE PARENT-NEXT!!!');
            break;
          }
        }

        if (tmp.parentNode === firstNode) {
          break;
        }
      }
      //#endregion
    }

    if (firstNode.nodeType === Node.TEXT_NODE) {
      let index = firstNode.data.indexOf(symbol);

      // check symbol
      if (index >= 0) {
        // divide and break;
        let sub = firstNode.data.substring(0, index);
        return firstNode;
        // break;
      }
    } else {
      throw 'ERROR';
    }

    console.log({
      'result': 1
    });
  }

  $merge(firstNode, secondNode) {
    if (firstNode.nodeType === this.$types.text && secondNode.nodeType === this.$types.text) {
      firstNode.data += secondNode.data;
      secondNode.remove();

      return firstNode;
    }

    let newNode = secondNode.cloneNode(true);
    firstNode.parentNode.insertBefore(newNode, firstNode.nextSibling);
    secondNode.remove();

    return newNode;
  }

  $backspaceOld(selection, nodes) {
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
