class CommandAdapter extends StyleAdapter {
  constructor (element, rule, template) {
    super(element, rule, template);

    let tagRegex = /<(\w+)>/gi;
    let tags = tagRegex.exec(template);

    this.$nodeName = tags[tags.length - 1].toUpperCase();
    this.$reverce = this.$reverse(this.$command);
    this.$nodeRegex = new RegExp(`<(${this.$nodeName})[^>]+>`, 'gi');
  }

  /**
   * @param {*} selection
   * 
   * Checks if selection contains a serving HTML element
   */
  $containsNode(selection) {
    let container = selection.rangeCount > 0 && selection.getRangeAt(0).commonAncestorContainer;

    return (container &&  ((container.nodeName === this.$nodeName || container.parentNode.nodeName === this.$nodeName) ||
        (container.innerHTML && container.innerHTML.match(this.$nodeRegex))));
  }

  $getNodes(selection) {
    var range = document.createRange();

    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    // !range.collapsed
    
    let [firstNode, secondNode] = (!range.collapsed)? 
          [selection.anchorNode, selection.focusNode] : [selection.focusNode, selection.anchorNode];
    let [start, end] = (!range.collapsed)?
          [selection.anchorOffset, selection.focusOffset] : [selection.focusOffset, selection.anchorOffset];
          
    return {
      firstNode: firstNode,
      secondNode: secondNode,
      start: start,
      end: end,
      text: selection.toString(),
      identical: firstNode === secondNode
    };
  }

  // removes the same nodes
  $removeNodes(nodes) {
    var node = nodes.firstNode;

    while(node && node !== nodes.secondNode) {
      node = node.nextSibling;

      if(node && node.nodeName === this.$nodeName) {
        let parent = node.parentNode;

        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }

        parent.removeChild(node);
      }
    }
  }

  // removes the same nodes
  $removeChildren(el, t) {
    let list = el.children;

    for (var i = 0; list && i < list.length; i++) {
      const node = list[i];

      if(node.nodeName === this.$nodeName) {
        let parent = node.parentNode;
        let data = '';
        let list = [];

        while (node.firstChild) {
          // data += node.firstChild.data;
          // node.firstChild.remove();

          if(node.firstChild.nodeName === '#text') {
            data += node.firstChild.data;
          } else {
            if (data.length) {
              list.push(data);
              data = '';
            }
            
            list.push(node.firstChild.clondeNode(true));
          }

          node.firstChild.remove();
        }

        node.remove();

        for (var i = 0; i < list.length; i++) {
          if(typeof(list[i]) === 'string') {
            parent.appendChild(document.createTextNode(list[i]));
          } else {
            parent.appendChild(list[i]);
          }
        }

        // parent.appendChild(document.createTextNode(data));
        parent.innerHTML += data;
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  findAllSiblings(nodes) {
    let list = [];
    var node = nodes.firstNode.nextSibling;

    while(node && node !== nodes.secondNode) {
      if(node.childNodes && node.contains(nodes.secondNode)) {
        break;
      }

      list.push(node);
      node = node.nextSibling;
    }

    return list;
  }

  createElement(nodes){
    let b = document.createElement(this.$nodeName);
    let secondText = nodes.secondNode.data.substring(0, nodes.end);
    let list = this.findAllSiblings(nodes);

    b.innerHTML = nodes.firstNode.data.substring(nodes.start);
  
    // fill the element
    for (var i = 0; i < list.length; i++) {
      b.appendChild(list[i]);
    }

    if(list.length) {
      b.appendChild(document.createTextNode(secondText));
    } else {
      b.innerHTML += secondText;
    }

    this.$removeChildren(b);

    return b;
  }


  /**
   * Executes command, replaces selection into command link format [text](url)
   */
  async command() {
    let selection = window.getSelection();
    let nodes = this.$getNodes(selection);
    let conteins = this.$containsNode(selection);

    console.log({
      'conteins':conteins 
    });

    if(conteins) {
      return;
    }

    // this.$removeNodes(nodes);
    console.log(nodes);

    if(!nodes.identical) {
      let b = this.createElement(nodes);

      console.log({
        'B': b.innerHTML
      });

      nodes.firstNode.data = nodes.firstNode.data.substring(0, nodes.start); //cut firstNode
      nodes.secondNode.data = nodes.secondNode.data.substring(nodes.end); //cut secondNode
      
      nodes.firstNode.parentNode.insertBefore(b, nodes.firstNode.nextSibling); // insert element

      if(b.parentNode.nodeName === this.$nodeName) {
        b = b.parentNode;
        this.$removeChildren(b, true); // deletes b
      }

      // if(b.nextSibling && b.nextSibling.nodeName === this.$nodeName) {
      //   b.appendChild(b.nextSibling);
      //   this.$removeChildren(b); // deletes nextSibling b
      // }

      

      // selection.collapse(nodes.firstNode, nodes.start);
      // selection.extend(nodes.secondNode, 0);
      // selection.collapse(b.firstChild, 0);
      // selection.extend(b.firstChild, 1);

      selection.removeAllRanges();

      // selection.collapse(nodes.firstNode, nodes.start);
      // selection.extend(nodes.secondNode, 0);

      var range = document.createRange();

      console.log({
        'c': b.childNodes,
        'b': b.outerHTML,
        'text': nodes.text
      });

      // range.setStart(nodes.firstNode, nodes.start);
      // range.setEnd(nodes.secondNode, 0);

      // range.selectNodeContents(b);
      // selection.addRange(range);

    } else {
      var node = nodes.firstNode;
      let data = nodes.firstNode.data;
      let t = data.substring(nodes.start, nodes.end);

      node.data = node.data.substring(0, nodes.start);

      console.log({
        't': t,
        'start': nodes.start,
        'end': nodes.end,
        'length': nodes.text.length,
      });

      let b = document.createElement(this.$nodeName.toLowerCase());
      b.innerHTML = t;

      nodes.firstNode.parentNode.insertBefore(b, nodes.firstNode.nextSibling);
      nodes.firstNode.parentNode.insertBefore(document.createTextNode(data.substring(nodes.end)), b.nextSibling);

      // selection.collapse(b, 0);
      // selection.extend(b, 1);

      selection.removeAllRanges();

      var range = document.createRange();
      range.selectNodeContents(b);
      selection.addRange(range);
    }
  }

  /**
   * Executes command, replaces selection into command link format [text](url)
   */
  command3() {
    let selection = window.getSelection();
    let direction = this.getDirection(selection);
    let text = selection.toString();

    let [firstNode, secondNode] = (direction.right)? 
          [selection.anchorNode, selection.focusNode] : [selection.focusNode, selection.anchorNode];
    let [start, end] = (direction.right)?
          [selection.anchorOffset, selection.focusOffset] : [selection.focusOffset, selection.anchorOffset];
    
    //#region removes the same nodes
    var node = firstNode;

    while(node && node !== secondNode) {
      node = node.nextSibling;

      if(node && node.nodeName === this.$nodeName) {
        let parent = node.parentNode;

        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }

        parent.removeChild(node);
      }
    }
    //#endregion

    let [tmp1, tmp2] = [firstNode.data.substring(start), secondNode.data.substring(0, end)]

    console.log({
      'start': start,
      'end': end,
    });

    node = firstNode;

    node.data = node.data.substring(0, start);
    secondNode.data = secondNode.data.substring(end);

    let b = document.createElement(this.$nodeName.toLowerCase());
    b.innerHTML = tmp1;

    do {
      
      // node.parentNode.insertBefore(b, node.nextSibling);
      node = node.nextSibling;
      b.appendChild(node);
      break;
    }
    while(node && node !== secondNode);

    // b.appendChild(document.createTextNode(tmp2));

    firstNode.parentNode.insertBefore(b, firstNode.nextSibling);

    let t = document.createTextNode(tmp2);
    node.parentNode.insertBefore(t, node.nextSibling);
    
    
    console.log({
      'firstNode': firstNode.data.substring(0, start),
      'secondNode': secondNode.data.substring(0, end),
    });

    console.log();
  }

  /**
   * Executes command, replaces selection into command link format [text](url)
   */
  command2() {
    let selection = window.getSelection();
    let node = selection.focusNode;
    let text = selection.toString();
    let containsNode = this.$containsNode(selection);

    console.log({
      'contains': containsNode
    });

    // unlink
    if (containsNode || !node) {
      return;
    }

    if(node.nodeName === '#text') {
      let focusNode = selection.focusNode;
      let anchorNode = selection.anchorNode;
      let forward = (focusNode.nextSibling === anchorNode.previousSibling);


      console.log({
        'forward': forward,
        // 'backward': this.isSelectionBackwards(),
        'text': text,
        'range': selection.getRangeAt(0)
      });

      
      console.log(selection);

      return;
    }

    if(node.nodeName === '#text') {
      let [start, end] = (selection.focusOffset < selection.anchorOffset)? [selection.focusOffset, selection.anchorOffset] : [selection.anchorOffset, selection.focusOffset]
      let styledHtml = this.$template.replace(/\$\{(\w+)\}/gi, text);
      let data = node.data;
      
      let b = document.createElement(this.$nodeName.toLowerCase());
      let t = document.createTextNode(data.substring(end));

      b.innerHTML = text;

      node.data = node.data.substring(0, start);
      node.parentNode.insertBefore(b, node.nextSibling);
      b.parentNode.insertBefore(t, b.nextSibling);

      selection.collapse(b, 0);
      selection.extend(b, 1);
    }

    return;

    if (text.length || this.$primitive) {
      let styledHtml = this.$template.replace(/\$\{(\w+)\}/gi, text);
      document.execCommand('insertHTML', false, styledHtml);

      selection.collapse(selection.focusNode, selection.focusOffset);
      selection.extend(selection.focusNode, selection.focusOffset - text.length);

      return true;
    }

    

    // create an auto link
    // if (!containsLink && text.match(this.$linkRegex)) {
    //   let linkHtml = text.replace(this.$linkRegex, '$1<a href="$2">$2</a>$4');

    //   return document.execCommand('insertHTML', false, linkHtml);
    // }

    // create a custom link
    // let customLink = this.$primitive? `${this.$command}` : `${this.$command}${text}${this.$reverce}`;

    // document.execCommand('insertHTML', false, customLink);
    // selection.collapse(selection.focusNode, selection.focusOffset);
    // selection.extend(selection.focusNode, selection.focusOffset);

    // this.exec(selection);
  }
}