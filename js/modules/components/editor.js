// class Editor extends TextProcessor {
class Editor extends Processor {
  constructor (element, controls) {
    super(element);

    this.$value = this.element.innerHTML;
    this.controls = controls;

    this.customEvents = {'change': null};

    this.init();
  }

  /**
   * Init the controller
   * 
   * Init controlls and events.
   */
  init() {
    for (let i = 0; i < this.controls.length; i++) {
      const item = this.controls[i];
      const action = item.getAttribute('action');
      const helper = this.$helpers[action];

      item.onmousedown = this.$preCommand;
      item.onmouseup = (helper && helper.command)? this.$customCommand.bind(this, helper, action) : this.$command.bind(this, action);
    }
  }

  /**
   * Internal event: PreCommand.
   * 
   * @param {*} e
   * 
   * Executes before the command to cancel the original event
   */
  $preCommand(e) {
    e.preventDefault();
  }

  /**
   * Internal event: Command.
   * 
   * @param {*} e
   * 
   * Executes the command in editor.
   */
  $command(action) {
    // let scrollTop = this.element.parentNode.scrollTop;

    document.execCommand(action);
    // this.element.parentNode.scrollTop = scrollTop;
  }

  /**
   * Internal event: CustomCommand.
   * 
   * @param {*} e
   * 
   * Executes the custom command handling the specified helper in editor.
   */
  $customCommand(helper, action) {
    if (this.hasFocus()) {
      helper.command(action);
    }
  }

  // $getNodes(selection) {
  //   var range = document.createRange();

  //   range.setStart(selection.anchorNode, selection.anchorOffset);
  //   range.setEnd(selection.focusNode, selection.focusOffset);
    
  //   let [firstNode, secondNode, start, end] = (!range.collapsed)? 
  //     [selection.anchorNode, selection.focusNode, selection.anchorOffset, selection.focusOffset] : 
  //     [selection.focusNode, selection.anchorNode, selection.focusOffset, selection.anchorOffset];

  //   return {
  //     firstNode: firstNode,
  //     secondNode: secondNode,
  //     start: start,
  //     end: end,
  //   }
  // }

  // $findNode(node, childNodes) {
  //   if (node !== this.element) {
  //     for (let i = 0; i < this.element.childNodes.length; i++) {
  //       const child = childNodes? childNodes[i] : this.element.childNodes[i];

  //       if (node === child) {
  //         return `${i}`;
  //       } else {
  //         let sibling = node.parentNode;

  //         while(sibling !== this.element) {
  //           if (sibling === child) {
  //             return `${i}.${this.$findNode(node, sibling.childNodes)}`
  //           }

  //           sibling = sibling.parentNode;
  //         }
  //       }
  //     }
  //   }

  //   return null;
  // }

  // $getTextNode(path) {
  //   let ids = path.split('.');
  //   let childNodes = this.element.childNodes;
  //   let node = null;

  //   for (let i = 0; ids && i < ids.length; i++) {
  //     const id = parseInt(ids[i]);
      
  //     node = childNodes[id];
  //     childNodes = node.childNodes;
  //   }

  //   return node;
  // }


  /**
   * @param {*} value
   * 
   * Sets html value
   */
  set value(value) {
    this.$value = value;
    this.element.innerHTML = this.$value;

    // setTimeout(function () {
    //   var selection = window.getSelection();

    //   if (selection.toString() !== '') {
    //     console.print('---saving---');
        
    //     var nodes = this.$getNodes(selection);

    //     let storage = {
    //       firstNode: this.$findNode(nodes.firstNode),
    //       secondNode: this.$findNode(nodes.secondNode),
    //       start: nodes.start,
    //       end: nodes.end,
    //     };

    //     console.print(storage);

    //     setTimeout(function () {
    //       console.print('---restoring---');

    //       let firstNode = this.$getTextNode(storage.firstNode);
    //       let secondNode = this.$getTextNode(storage.secondNode);

    //       selection.collapse(firstNode, storage.start);
    //       selection.extend(secondNode, storage.end);

    //       console.print('---done!---');
    //     }.bind(this), 5000);
    //   }

    // }.bind(this), 4000)
  }

  /**
   * Gets html value
   */
  get value() {
    return this.element.innerHTML;
  }

  /**
   * @param {*} name
   * @param {*} callback
   * 
   * Sets html event listener
   */
  addEventListener(name, callback) {
    if (name in this.customEvents) {
      this.customEvents[name] = callback;
      return;
    }

    this.element.addEventListener(name, callback);
  }

  /**
   * @param {*} name
   * @param {*} callback
   * 
   * Removes html event listener
   */
  removeEventListener(name, callback) {
    if (name in this.customEvents) {
      this.customEvents[name] = callback;
      return;
    }

    this.element.removeEventListener(name, callback);
  }

  /**
   * Focus
   * 
   * Sets focus to element
   */
  focus() {
    this.element.focus();
  }

  /**
   * HasFocus
   * 
   * Gets the result if the editor is in focus.
   */
  hasFocus() {
    return document.activeElement === this.element;
  }

  /**
   * Internal method: OnChange.
   * 
   * Fires onChange handler if custom event is configured.
   */
  $onChange() {
    let event = this.customEvents['change'];

    if (this.element.innerHTML != this.$value && event) {
      event(super.$onChange());
      this.$value = this.element.innerHTML;
    }
  }
}
