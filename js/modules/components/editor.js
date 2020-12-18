// class Editor extends TextProcessor {
// class Editor extends Processor {
class Editor {
  constructor (element, controls) {
    // super(element);

    // this.$value = this.element.innerHTML;
    this.element = element;
    this.controls = controls;

    this.customEvents = {'change': null};
    this.initiated = false;

    // this.init(element);
    // this.element.addEventListener('blur', this.$onChange.bind(this));
  }

  /**
   * Init the controller
   * 
   * Init controlls and events.
   */
  init() {
    console.log('init editor...');

    this.preview = document.getElementById('description-preview');

    // console.log({
    //   '': marked
    // });

    this.element = CodeMirror.fromTextArea(this.element, {
      // lineNumbers: true,
      // scrollbarStyle: "native",

      // mode: "markdown",
      // mode: "markdown",
      // mode: "gfm",
      lineWrapping: true,
      showCursorWhenSelecting: true,
      singleSelection: true,
      // singleCursorHeightPerLine: false,
      // mode: {
      //   name: "markdown",
      //   highlightFormatting: true
      // }
      mode: {
        name: "gfm",
        // highlightFormatting: true
      }
      // mode: {
      //   name: "gfm",
      //   allowAtxHeaderWithoutSpace: false,
      //   highlightFormatting: true,
      //   tokenTypeOverrides: {
      //     emoji: "emoji"
      //   }
      // },
      
      // lineNumbers: true,
      // viewportMargin: Infinity
    });

    this.element.on('blur', this.$onChange.bind(this));
    this.initiated = true;

    var makeBold = function (cm) {
      var text = cm.getSelection();
      if (text.length) {
        cm.replaceSelection(`**${text}**`);
      }
    }

    this.element.setOption("extraKeys", {
      'Cmd-B': makeBold
    });

    for (let i = 0; i < this.controls.length; i++) {
      const item = this.controls[i];
      const action = item.getAttribute('action');
      // const helper = this.$helpers[action];

      item.onmousedown = this.$preCommand;
      // item.onmouseup = (helper && helper.command)? this.$customCommand.bind(this, helper, action) : this.$command.bind(this, action);

      if (action === 'bold') {
        item.onmouseup = makeBold.bind(this, this.element);
      }

      if (action === 'italic') {
        item.onmouseup = function () {
          this.selections = this.element.listSelections();
          this.cursors = this.element.getCursor();          
        }.bind(this);
      }

      if (action === 'underline') {
        item.onmouseup = function () {
          if (this.selections && this.cursors){
            let c = this.cursors;
            let selction = [];

            for (var i = 0; i < this.selections.length; i++) {
              const s = this.selections[i];

              selction.push({
                anchor: {
                  ch: s.anchor.ch,
                  line: s.anchor.line,
                },
                head: {
                  ch: s.head.ch,
                  line: s.head.line,
                }
              });
            }

            this.element.setSelections(selction);

            this.selections = null;
            this.cursors = null;
          }
        }.bind(this);
      }

      if (action === 'preview') {
        item.onmouseup = this.$preview.bind(this);
      }
    }

    marked.setOptions({
      gfm: true,
      breaks: true,
    });
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

  $preview() {
    if (!this.previewMode) {
      let scrollInfo = this.element.getScrollInfo();
      let text = this.element.getValue();

      // let title = text.replace(/^\#([^\n]+)\n/gi, '');
      let title = text.match(/^([^\n]+)\n/gi);

      if (title) {
        text = text.replace(title, '');
        title = title[0].replace(/\n/gi, '');
        console.log({
          'title': title
        });
  
  
        let html = marked(text);
  
        // let d = document.createElement('div');
  
        // console.log(html);
  
        // // this.preview.innerHTML = html;
        // d.innerHTML = html;
  
        // console.log({
        //   'text': d.innerText
        // });
  
        this.preview.innerHTML = `<div class="edit-title details">${title}</div>${html}`;
        this.element.getWrapperElement().style.display = 'none';
        this.preview.style.display = '';
        this.preview.scrollTop = scrollInfo.top;
      } else {
        this.preview.innerHTML = 'There is no title, please add a title';
      }
      
    } else {
      let scrollInfo = this.preview.scrollTop;

      this.element.getWrapperElement().style.display = '';
      this.preview.style.display = 'none';
      this.element.scrollTo(0, scrollInfo);
    }

    this.previewMode = !this.previewMode;
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

  /**
   * @param {*} value
   * 
   * Sets html value
   */
  set value(value) {
    this.$value = value;
    // this.element.innerHTML = this.$value;
    // this.$history.reset();

    if (this.element.setValue) {
      this.element.setValue(value);

      return;
    }

    if (this.element.nodeName == 'TEXTAREA') {
      var div = document.createElement('div');

      div.innerHTML = this.$value;
      this.element.value = div.innerText;
      div.remove();

      this.element.style.height = this.element.scrollHeight + 'px';
    }

    if (this.element.nodeName == 'PRE' || this.element.nodeName == 'DIV') {
      this.element.innerHTML = this.$value;
    }

    // if (this.element.nodeName === '')
  }

  /**
   * Gets html value
   */
  get value() {
    if (this.element.getValue) {
      return this.element.getValue();
    }
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

    // this.element.addEventListener(name, callback);
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

    if (this.element.getValue) {
      this.$value = this.element.getValue();
      this.$value = this.$value.replace(/^([^\n]+)\n/gi, '');
      return event(this.$value);
    }

    if (this.element.nodeName === 'TEXTAREA') {
      event(this.element.value);
      this.$value = this.element.value;
      return;
    }

    if (this.element.innerHTML != this.$value && event) {
      // event(super.$onChange());
      event(this.element.innerHTML);
      this.$value = this.element.innerHTML;
    }
  }
}
