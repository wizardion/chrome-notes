class Editor extends BaseEditor {
  constructor (element, controls) {
    super(element, controls);

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    this.element.addEventListener('input', this.log.bind(this));
  }

  $isLast(selection, offset) {
    var focusOffset = offset || selection.focusOffset;

    return focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling;
  }

  $preProcessInput(e) {
    var selection = window.getSelection();

    if (e.keyCode === 46) { // 'Delete'
      var selected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;
      var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset) + (!selected && 1 || 0));
      var data = selection.focusNode.innerHTML || selection.focusNode.data;
      var index = Math.min(selection.focusOffset, selection.baseOffset);

      if (data && last && data[index] !== '\n' && data[Math.max(0, index - 1)] === '\n') {
        e.preventDefault();

        if (!selected) {
          selection.collapse(selection.focusNode, index + 1);
          selection.extend(selection.focusNode, index);
        }

        document.execCommand('insertHTML', false, '\n');
      }
    }

    if (e.keyCode === 8) { // 'Backspace'
      var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset));
      var data = selection.focusNode.innerHTML || selection.focusNode.data;
      var selected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;
      var index = Math.max(0, Math.min(selection.focusOffset, selection.baseOffset) - (!selected && 1 || 0));

      if (data && last && data[index] !== '\n' && data[Math.max(0, index - 1)] === '\n') {
        e.preventDefault();

        if (!selected) {
          selection.collapse(selection.focusNode, index + 1);
          selection.extend(selection.focusNode, index);
        }

        document.execCommand('insertHTML', false, '\n');
      }
    }

    if (e.keyCode === 13) { // 'Enter'
      var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset));

      e.preventDefault();
      return document.execCommand('insertHTML', false, last? '\n\n' : '\n');
    }
  }


  log() {

    // if (selection.focusNode === this.element) {
      // console.log('log.removeChild2');
      
      // var children = this.element.children;

      // for(let i = 0; i < children.length; i++) {
      //   const item = children[i];

      //   if (item.nodeName === 'BR') {
      //     console.log(item)
      //     this.element.removeChild(item);
      //     // this.log()
      //   }
      // }

    // }


    var tagRegex = /(&lt\;\/?[^&]+&gt\;)/ig;
    var symbRegex = /(&amp\;\w+\;)/ig;
    var logDiv = document.getElementById('expression');
    var tagsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    };

    let encodedStr = this.element.innerHTML.replace(/[&<>]/g, function (tag) {
      return tagsToReplace[tag] || tag;
    });

    var tags = encodedStr.match(tagRegex);
    var sTags = encodedStr.match(symbRegex);
    
    // logDiv.innerHTML = '"' + encodedStr.replace(/[ ]/ig, '&nbsp;').
    //                          replace(tagRegex, '<span class="error">$1</span>').
    //                          replace(symbRegex, '<span class="html-symbol">$1</span>').
    //                          replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>') + '"';

    logDiv.innerHTML = '"' + encodedStr.replace(tagRegex, '<span class="error">$1</span>').
                                        replace(symbRegex, '<span class="html-symbol">$1</span>').
                                        replace(/( )( )/ig, '$1&nbsp;').
                                        replace(/(\n|\r)/ig, '<span class="symbol">\\n</span>') + '"';

    // console.log({
    //   'encodedStr': encodedStr.replace(tagRegex, '<span class="error">$1</span>')
    // });
    var logDiv = document.getElementById('expression-result').innerHTML = `<i>html tags: - <b>${(tags && tags.length) || 0};</b></i>&nbsp;&nbsp;&nbsp;<i>symbols: - <b>${(sTags && sTags.length || 0)};</b></i>`;
  }

  $onChange() {}
}


