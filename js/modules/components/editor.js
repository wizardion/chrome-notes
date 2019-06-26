class Editor extends BaseEditor {
  constructor (element, controls) {
    super(element, controls);

    this.element.addEventListener('keydown', this.$preProcessInput.bind(this));
    this.element.addEventListener('cut', this.$onCut.bind(this));

    this.element.addEventListener('input', this.log.bind(this));
  }

  $isLast(selection, offset) {
    var focusOffset = offset || selection.focusOffset;

    return focusOffset === selection.focusNode.length && !selection.focusNode.nextSibling &&
           (selection.focusNode.parentNode === this.element || !selection.focusNode.parentNode.nextSibling);
  }

  $onCut(e) {
    // var selection = window.getSelection();
    // var selected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;

    // if (selected) {
    //   var data = selection.focusNode.innerHTML || selection.focusNode.data;
    //   var index = Math.min(selection.focusOffset, selection.baseOffset);
    //   var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset));

    //   if (data && last && data[index] !== '\n' && data[Math.max(0, index - 1)] === '\n') {
    //     e.preventDefault();
    //     document.execCommand('copy');
    //     document.execCommand('insertHTML', false, '\n');
    //   }
    // }
  }

  $preProcessInput(e) {
    var selection = window.getSelection();

    // 'Delete'
    if (e.keyCode === 46) {
      // var selected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;
      // var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset) + (!selected && 1 || 0));
      // var data = selection.focusNode.innerHTML || selection.focusNode.data;
      // var index = Math.min(selection.focusOffset, selection.baseOffset);

      // if (data && last && data[index] !== '\n' && data[Math.max(0, index - 1)] === '\n') {
      //   e.preventDefault();

      //   if (!selected) {
      //     selection.collapse(selection.focusNode, index + 1);
      //     selection.extend(selection.focusNode, index);
      //   }

      //   document.execCommand('insertHTML', false, '\n');
      // }
    }

    // 'Backspace'
    if (e.keyCode === 8) {
      // var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset));
      // var data = selection.focusNode.innerHTML || selection.focusNode.data;
      // var selected = Math.abs(selection.focusOffset - selection.baseOffset) > 0;
      // var index = Math.max(0, Math.min(selection.focusOffset, selection.baseOffset) - (!selected && 1 || 0));

      // if (data && last && data[index] !== '\n' && data[Math.max(0, index - 1)] === '\n') {
      //   e.preventDefault();

      //   if (!selected) {
      //     selection.collapse(selection.focusNode, index + 1);
      //     selection.extend(selection.focusNode, index);
      //   }

      //   document.execCommand('insertHTML', false, '\n');
      // }
    }

    // 'Enter'
    if (e.keyCode === 13) {
      // e.preventDefault();

      // var data = selection.focusNode.innerHTML || selection.focusNode.data;
      // var cursor = Math.max(selection.focusOffset, selection.baseOffset);
      // var end = data.substr(cursor).search(/\n|$/ig);
      // var newData = data.substr(cursor, end)

      // console.log({
      //   'end': end,
      //   'data': newData
      // })

      // // selection.collapse(selection.focusNode, cursor);
      // // selection.extend(selection.focusNode, cursor + end);

      // // document.execCommand('insertHTML', false, '<p>T</p>');
      // document.execCommand('insertHTML', false, '<br/>');
      // // document.execCommand('insertHTML', false, newData);

      

      // var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset));

      // e.preventDefault();
      // document.execCommand('insertHTML', false, '<br>');
      // document.execCommand('insertHTML', false, '\n');

      // // var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset));
      // // // https://stackoverflow.com/questions/12251629/is-there-something-better-than-document-execcommand
      // // // https://trix-editor.org/
      
      // // e.preventDefault();
      // // return document.execCommand('insertHTML', false, last? '\n\n' : '\n');

      // var last = this.$isLast(selection, Math.max(selection.focusOffset, selection.baseOffset));
      // var cursor = Math.max(selection.focusOffset, selection.baseOffset);
      // var data = selection.focusNode.innerHTML || selection.focusNode.data;
      
      // e.preventDefault();

      // document.execCommand('insertText', false, last? 'nn' : 'n');

      // // selection.collapse(selection.focusNode, cursor);
      // // selection.extend(selection.focusNode, cursor + 1);

      // var output = [data.slice(0, cursor), last? '\n\n' : '\n', data.slice(cursor)].join('');

      // selection.focusNode.data = output;

      // selection.collapse(selection.focusNode, cursor + 1);
      // selection.extend(selection.focusNode, cursor + 1);

      // var event = new Event('input', {
      //     'bubbles': true,
      //     'cancelable': true,
      //     'composed': true,
      // });
    
      // this.element.dispatchEvent(event);
    }

    // var selection = window.getSelection();
    // var cursor = Math.max(selection.focusOffset, selection.baseOffset);

    // this.element.innerHTML = this.$removeHtml(this.element.innerHTML);

    // selection.collapse(selection.focusNode, cursor);
    // selection.extend(selection.focusNode, cursor);
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


