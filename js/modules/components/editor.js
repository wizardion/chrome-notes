class Editor extends BaseEditor {
  constructor (element, controls) {
    super(element, controls);

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    
    // logs
    this.element.addEventListener('input', this.log.bind(this));
  }

  $isLast(selection, offset) {
    var focusOffset = offset || selection.focusOffset;

    return focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling &&
           (selection.focusNode.parentNode === this.element || !selection.focusNode.parentNode.nextSibling);
  }

  $preProcessInput(e) {
    var selection = window.getSelection();

    // 'Space'
    if (e.keyCode === 32) {
      var data = selection.focusNode.data || selection.focusNode.innerHTML;
      var selected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;
      data = data.substr(0, selection.focusOffset);

      if (!selected && data.length > 0 && data[data.length - 1] === ' ') {
        e.preventDefault();
        return document.execCommand('insertHTML', false, '&nbsp;');
      }
    }

    // if (e.keyCode === 13) {
    //   e.preventDefault();
    //   document.execCommand('insertHTML', false, '<br/>');
    // }
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

  $onChange() {
    // console.log(`"%c${this.$removeHtml(this.element.innerHTML)}%c"`, 'color: red', 'color: black')
  }
}


