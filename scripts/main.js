var editor = {element:  null, text: ''};

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
    editor.element.addEventListener('paste', onPaste);

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
}

function onPaste(e) {
  var clipboard = (e.originalEvent || e).clipboardData;
  var text = clipboard.getData('text/plain');

  console.log({
    '': text
  });

  e.preventDefault();

  // console.log('onPaste')

  editor.text += text;
  render();
}


function onkeyDown(e) {
  var t1 = performance.now();
  // console.log(e);

  if (!e.ctrlKey && e.key === 'Backspace') {
    e.preventDefault();
    editor.text = editor.text.slice(0, -1);
    let t2 =  performance.now();
    console.log({'t': t2 - t1});
    render();
  }

  if (!e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    editor.text +='\n';
    let t2 =  performance.now();
    console.log({'t': t2 - t1});
    render();
  }

  if (!e.ctrlKey && e.key.length === 1) {
    e.preventDefault();
    editor.text += e.key;
    let t2 =  performance.now();
    console.log({'t': t2 - t1});
    render();
  }
}

function render() {
  var t1 = performance.now();

  let lines = editor.text.split('\n');
  let t0 =  performance.now();

  let codeSpan;
  let codeLine;

  let last = editor.code.childNodes[lines.length -1];

  if (last) {
    let line = lines[lines.length -1] || '&#8203';
    codeSpan = last.childNodes[0];
    codeSpan.innerHTML = md(line);
  } else {
    editor.code.innerHTML = '';

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index] || '&#8203';
      codeLine = editor.line.cloneNode();
      codeSpan = editor.span.cloneNode();
  
      codeSpan.innerHTML = md(line);
      
      codeLine.appendChild(codeSpan);
      editor.code.appendChild(codeLine);
    }
  }

  let t2 =  performance.now();
  renderCursor(codeSpan.offsetLeft + codeSpan.offsetWidth, codeSpan.offsetTop, codeSpan.offsetHeight);
  let t3 =  performance.now();
  console.log({'r0': t0 - t1, 'r': t2 - t1, 'r2': t3 - t2});
}

function md(text) {
  return text.replace(/(\s)\*\*([\S]+)/gi, '$1<b>$2').replace(/([\S]+)\*\*(\s)/gi, '$1</b>$2')
  .replace(/(\s)\*([^\*][\S]+)/gi, '$1<i>$2').replace(/([^\*][\S]+)\*(\s)/gi, '$1</i>$2');
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

