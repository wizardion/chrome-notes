var editor = { element: null, text: 'this is something **text** that'};

window.onload = function(){
    //var bgr = chrome.extension.getBackgroundPage();

    $('#notes').Notes({
        back_bt: 'back',
        add_bt: 'add-note',
        delete_bt: 'delete',

        title: 'title',
        edit_title: 'edit-title',

        list_view: 'list-view',
        edit_view: 'edit-view',

        description: 'fast-note',
        list_item: 'list-item'
    });

    editor.element = document.getElementById('editor');

    editor.element.addEventListener('keydown', onkeyDown);
    editor.element.addEventListener('focusin', onFocus);
    editor.element.addEventListener('focusout', onBlur);
    document.addEventListener('paste', onPaste);
    editor.element.addEventListener('copy', onCopy);

    editor.cursor = document.createElement('div');
    editor.cursor.classList.add('cursor');

    editor.code = document.createElement('div');
    editor.code.classList.add('editor-code');

    editor.line = document.createElement('pre');
    editor.line.classList.add('editor-line');

    editor.span = document.createElement('span');
    editor.span.classList.add('editor-span');
    
    editor.element.appendChild(editor.cursor);
    editor.element.appendChild(editor.code);

    editor.element.focus();
    render();
}

function onCopy(e) {
  let ranges = [];
  var selection = window.getSelection();
  var textarea = document.getElementById('text');
  var text = selection.toString();

  if (text.length) {
    var nodes = getNodes(selection);
    e.preventDefault();

    for (let i = 0; i < selection.rangeCount; i++) {
      ranges.push(selection.getRangeAt(i));
    }

    textarea.value = text;
    textarea.select();
    document.execCommand('copy', false);
    selection.removeAllRanges();

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      selection.addRange(range);
    }
  }
}

function getNodes(selection) {
  var range = document.createRange();

  range.setStart(selection.anchorNode, selection.anchorOffset);
  range.setEnd(selection.focusNode, selection.focusOffset);

  let [leftNode, rightNode, start, end] = (!range.collapsed) ?
    [selection.anchorNode, selection.focusNode, selection.anchorOffset, selection.focusOffset] :
    [selection.focusNode, selection.anchorNode, selection.focusOffset, selection.anchorOffset];

  return {
    left: leftNode,
    right: rightNode,
    start: start,
    end: end,
  }
}

function onPaste(e) {
  if (document.activeElement === editor.element) {
    var clipboard = (e.originalEvent || e).clipboardData;
    var text = clipboard.getData('text/plain');

    console.log({
      'onPaste': text
    });

    e.preventDefault();

    // console.log('onPaste')

    editor.text += text;
    render();
  // log();

  editor.element.scrollTop = editor.element.scrollHeight;
  }
}


function onkeyDown(e) {
  var t1 = performance.now();
  // console.log(e);
  // console.log({
  //   'altKey': e.altKey,
  //   'shiftKey': e.shiftKey,
  //   'ctrlKey': e.ctrlKey,
  //   'metaKey': e.metaKey,
  //   'code': e.code,
  // });

  if (!(e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
    e.preventDefault();
    editor.text = editor.text.slice(0, -1);
    let t2 =  performance.now();
    console.log({'t': t2 - t1});
    render();
  }

  if (!(e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    editor.text +='\n';
    let t2 =  performance.now();
    console.log({'t': t2 - t1});
    render();
  }

  if (!(e.ctrlKey || e.metaKey) && e.key.length === 1) {
    e.preventDefault();
    editor.text += e.key;
    let t2 =  performance.now();
    console.log({'t': t2 - t1});
    render();
  }

  // log();
}

function render() {
  var t1 = performance.now();

  let lines = editor.text.split('\n');
  let t0 =  performance.now();

  let codeSpan;
  let codeLine;

  let last = editor.code.childNodes[lines.length -1];

  for (var i = lines.length; i < editor.code.childNodes.length; i++) {
    const node = editor.code.childNodes[i];
    node.remove();
  }

  if (last) {
    let line = lines[lines.length -1] || '&#8203';
    codeSpan = last.childNodes[0];
    // codeSpan.innerHTML = '';
    // empty(codeSpan)
    codeSpan.innerHTML = md(line);
    // codeSpan.insertAdjacentText('afterbegin', md(line));
    // codeSpan.insertAdjacentHTML('afterbegin', md(line));
    // codeSpan.textContent = line;
  } else {
    editor.code.innerHTML = '';
    let fragment = document.createDocumentFragment();

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index] || '&#8203';
      codeLine = editor.line.cloneNode();
      codeSpan = editor.span.cloneNode();
  
      codeSpan.innerHTML = md(line);
      
      codeLine.appendChild(codeSpan);
      // fragment.appendChild(codeLine);
      editor.code.appendChild(codeLine);
    }

    // editor.code.appendChild(fragment);
  }

  let t2 =  performance.now();
  renderCursor(codeSpan.offsetLeft + codeSpan.offsetWidth, codeSpan.offsetTop, codeSpan.offsetHeight);
  let t3 =  performance.now();
  console.log({'r0': t0 - t1, 'r': t2 - t1, 'r2': t3 - t2});
}

function empty(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function md(text) {
  return text.replace(/(\s)\*\*([^\*][\S]+)\*\*(\s)/gi, '$1<b>$2</b>$3')
  .replace(/(\s)\*([^\*][\S]+)\*(\s)/gi, '$1<i>$2</i>$3');
}

function renderCursor(x, y, h) {
  editor.cursor.style.left = x;
  editor.cursor.style.top = y;
  editor.cursor.style.height = h;
}

function onFocus() {
  console.log('focus');
}

function onBlur() {
  console.log('blur');
}

// -------------------------------------------------------------------------------------------------
function log() {
  var div = document.getElementById('logging');

  div.innerText = editor.text;
}