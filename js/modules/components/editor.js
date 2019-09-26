class Editor extends TextProcessor {
  constructor (element, controls) {
    super(element);

    this.$value = this.element.innerHTML;
    this.controls = controls;

    this.customEvents = {'change': null};
    this.$helpers = {
      link: new LinkAdapter()
    };

    this.init();

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
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

      if (helper) {
        item.onmouseup = this.$customCommand.bind(this, helper);
      } else {
        item.onmouseup = this.$command;
      }
    }

    document.execCommand('defaultParagraphSeparator', false, 'p');
    // document.execCommand("DefaultParagraphSeparator", false, "br");
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
  $command(e) {
    let action = this.getAttribute('action');

    // cancel event.
    e.preventDefault();
    document.execCommand(action);
  }

  /**
   * Internal event: CustomCommand.
   * 
   * @param {*} e
   * 
   * Executes the custom command handling the specified helper in editor.
   */
  $customCommand(helper) {
    if (this.hasFocus()) {
      helper.command(helper);
    }
  }

  /**
   * Internal event: Command.
   * 
   * @param {*} e
   * 
   * Executes before the keyboard input, handels the commands text format.
   */
  $preProcessInput(e) {
    let selection = window.getSelection();
    let textSelected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;

    // 'Space' or 'Enter'
    if (!textSelected && (e.keyCode === 32 || e.keyCode === 13)) {
      const helper = this.$helpers['link'];
      
      if (helper.test(selection) && helper.exec(selection)) {
        return e.preventDefault();
      }
    }

    // clearInterval(this.inter);

    // this.inter = setTimeout(function() {
    //   console.log('removeHtml');
    //   this.element.innerHTML = this.$removeHtml(this.element.innerHTML);
    //   this.log();
    // }.bind(this), 1500);

    let problems_with_enter = [
      'list',
      'list_end_string',
      'end_string', // '\n\n' vs '\n'
    ]

    let solution = 'http://jsfiddle.net/s6dgjtx8/1/'; //https://stackoverflow.com/questions/18552336/prevent-contenteditable-adding-div-on-enter-chrome

    // console.log({
    //   'e': e,
    //   'keyCode': e.keyCode
    // });

    // console.log({
    //   'baseNode': selection.baseNode.nodeName,
    //   'extentNode': selection.extentNode.nodeName,
    //   'focusNode':selection.focusNode.nodeName,
    //   'focusOffset': selection.focusOffset.nodeName,
    //   'baseOffset': selection.baseOffset,
    // });
    
    // if (!e.shiftKey && e.keyCode === 8) {
    //   let focusNode = selection.focusNode;

    //   // console.log(selection);
      

    //   // e.preventDefault();
    // }

    // if (!e.shiftKey && e.keyCode === 46) {
    //   let focusNode = selection.focusNode;

    //   if (focusNode.nodeName === 'LI') {
    //     e.preventDefault();

    //     if (focusNode.parentNode && focusNode.parentNode.nodeName === 'UL') {
    //       return document.execCommand('insertUnorderedList', false);
    //       // document.execCommand('forwardDelete', false);
    //       // return document.execCommand('insertUnorderedList', false);
    //     }

    //     if (focusNode.parentNode && focusNode.parentNode.nodeName === 'OL') {
    //       return document.execCommand('insertOrderedList', false);
    //       // document.execCommand('forwardDelete', false);
    //       // return document.execCommand('insertOrderedList', false);
    //     }
    //   }
    // }

    if (!e.shiftKey && e.keyCode === 13) {
      let focusNode = selection.focusNode;
      let source = focusNode.data && focusNode.data.substr(selection.focusOffset);

      console.log({
        'nodeName': focusNode.nodeName,
        'parentNode': focusNode.parentNode.nodeName,
        'source': source,
        'focusNode': selection.focusOffset < focusNode.length,
      });

      if (focusNode.nodeName === '#text' && focusNode.parentNode.nodeName !== 'LI') {
        e.preventDefault();
        console.log({'insertHTML': selection.focusOffset < focusNode.length? '\n' : '\n\n'})
        // return document.execCommand('insertText', false, source.length > 0? '\\n' : '\\n\\n');
        return document.execCommand('insertHTML', false, selection.focusOffset < focusNode.length? '\n' : '\n\n');
        // document.execCommand("insertHtml", false, source.length > 0? '\n' : '\n\n');
        // document.execCommand('insertParagraph',false); 
        // document.execCommand('paste',true, 'TEST'); 
      }

      if (focusNode.nodeName === 'LI') {
        e.preventDefault();

        if (focusNode.parentNode && focusNode.parentNode.nodeName === 'UL') {
          return document.execCommand('insertUnorderedList');
        }

        if (focusNode.parentNode && focusNode.parentNode.nodeName === 'OL') {
          return document.execCommand('insertOrderedList');
        }
      }
    }

    // 'Enter'
    // if (e.keyCode === 13) {
    //   e.preventDefault();
    //   return document.execCommand('insertHTML', false, '<br>');
    // }

    // if (e.keyCode === 13) {
    //   let isLast = this.$isLast(selection, selection.focusOffset);
    //   let container = selection.rangeCount > 0 && selection.getRangeAt(0).commonAncestorContainer;
    //   let li = (container && container.nodeName === 'LI' || container.parentNode.nodeName === 'LI');
    //   let node = (!isLast)? '\n' : '\n\n';
    //   let focusNode = selection.focusNode;
    //   let source = focusNode.data && focusNode.data.substr(selection.focusOffset, selection.focusOffset);

    //   console.log({
    //     'container': container,
    //     'li': li,
    //     'isLast': isLast,
    //     'source': source,
    //   })

    //   if (!li && isLast && !source) {
    //     console.log('insertHTML0');
    //     e.preventDefault();
    //     return document.execCommand('insertHTML', false, '<br><br>');
    //   }

    //   if (!li && !isLast) {
    //     console.log('insertHTML');
    //     e.preventDefault();
    //     return document.execCommand('insertHTML', false, '<br>');
    //   }
    // }
  }

  $isLast(selection, offset) {
    var focusOffset = offset || selection.focusOffset;

    return (focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling &&
           (selection.focusNode.parentNode === this.element || !selection.focusNode.parentNode.nextSibling));
  }

  /**
   * @param {*} value
   * 
   * Sets html value
   */
  set value(value) {
    this.$value = value;
    this.element.innerHTML = this.$value;
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

    // if (this.element.innerHTML != this.$value && event) {
    //   event(super.$onChange());
    //   this.$value = this.element.innerHTML;
    // }
  }
}


