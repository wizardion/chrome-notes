//--------------------------------------------------------------------------------------------------------
// Class Notes
//--------------------------------------------------------------------------------------------------------
var $ = function(selector){
    var id = selector.replace(/^#([\w\-]*)$|(.*)/, '$1');
    var element = document.getElementById(id);

    for(var key in $.fn){
        element[key] = $.fn[key];
    }
    return element;
}; $.fn = {};

$.fn.Notes = function(options)
{
    var _notes = [];
    var _controls = {};
    var _note;
    var _main;

    //----------------------------------------------------------------------------------------------------
    (function(self) {
        _controls.back_bt = self.getElementsByClassName(options.back_bt)[0];
        _controls.add_bt = self.getElementsByClassName(options.add_bt)[0];
        _controls.delete_bt = self.getElementsByClassName(options.delete_bt)[0];
        _controls.list_item = self.getElementsByClassName(options.list_item)[0];

        _controls.list_view = self.getElementsByClassName(options.list_view)[0];
        _controls.edit_view = self.getElementsByClassName(options.edit_view)[0];

        _controls.edit_title = self.getElementsByClassName(options.edit_title)[0];

        _controls.title = self.getElementsByClassName(options.title)[0];
        _controls.description = self.getElementsByClassName(options.description)[0];

        _controls.back_bt.onclick = backToList;
        _controls.add_bt.onclick = addNote;
        _controls.delete_bt.onclick = deleteNote;
        _main = chrome.extension.getBackgroundPage();

        _controls.description.onchange = function(e){
            _notes[localStorage.selectedID].description = this.value;
            _main.saveNote(_notes[localStorage.selectedID]);
        }

        loadNotes();
    })(this);

    //----------------------------------------------------------------------------------------------------
    // Methods
    //----------------------------------------------------------------------------------------------------
    function addNote() {
        if(!_note){
            _note = {
                append: true,
                item: _controls.list_item.cloneNode(true),
                input: _controls.edit_title.cloneNode(true)
            }

            _note.item.style.display = 'block';
            _note.input.style.display = 'inline';
            _note.item.appendChild(_note.input);
            _note.item.className = _note.item.className + " edit-item";
            _controls.list_item.parentNode.insertBefore(_note.item, _controls.list_item);
            _note.input.focus();

            _note.input.onkeyup = _note.item.onclick = document.onkeyup = function(e){
                var element = e.target || e.srcElement || e.originalTarget;
                if((element == _note.input && e.keyCode && e.keyCode == 13) || (element != _note.input && e.which && e.which == 1)){
                    createNote();
                }

                if((e.keyCode && e.keyCode == 27)){
                    cancelNote();
                }
            };
        } else {
            _note.input.focus();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function editTitleNote(item) {
        if(!_note){
            _note = {
                item: item,
                onclick: item.onclick,
                span: item.children[1],
                input: _controls.edit_title.cloneNode(true)
            }

            _note.span.style.display = 'none';
            _note.input.style.display = 'inline';
            _note.item.appendChild(_note.input);
            _note.item.className = _note.item.className + " edit-item";
            _note.input.value = _notes[item.id].title;
            _note.input.focus();

            _note.input.onkeyup = _note.item.onclick = document.onkeyup = function(e){
                var element = e.target || e.srcElement || e.originalTarget;
                if((element == _note.input && e.keyCode && e.keyCode == 13) || (element != _note.input && e.which && e.which == 1)){
                    createNote();
                }

                if((e.keyCode && e.keyCode == 27)){
                    cancelNote();
                }
            }
        } else {
            _note.input.focus();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function cancelNote() {
        if(_note.append){
            _note.input.onkeyup = _note.item.onclick = document.onkeyup = null;
            _note.item.parentNode.removeChild(_note.item);
            _note = null;
        } else {
            _note.input.onkeyup = _note.item.onclick = document.onkeyup = null;
            _note.item.onclick = _note.onclick;
            _note.input.parentNode.removeChild(_note.input);
            _note.item.className = _note.item.className.replace(" edit-item","");
            _note.span.style.display = 'inline';
            _note = null;
        }
    }

    //----------------------------------------------------------------------------------------------------
    function createNote() {
        if(trim(_note.input.value).length > 0){
            var id = 0;

            if(_note.append){
                _notes.push({title: trim(_note.input.value), description: "" });
                id = parseInt(_notes.length) - 1;
            } else {
                id = parseInt(_note.item.id);
                _notes[id].title = trim(_note.input.value);
                _note.span.innerText = (id + 1) + ". " + trim(_note.input.value);
            }

            _note.input.onkeyup = _note.item.onclick = document.onkeyup = null;
            _controls.edit_view.style.display = 'block';
            _controls.list_view.style.display = 'none';
            shownDetails(id);
            saveNotes();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function loadNotes() {
        _main.loadNotes(function(notes){
            _notes = notes;

            if(localStorage.selectedID){
                shownDetails(localStorage.selectedID);
            } else {
                backToList();
            }
        });
    }

    //----------------------------------------------------------------------------------------------------
    function deleteNote() {
        var id = parseInt(localStorage.selectedID);
        var note = _notes[id].self;
        _notes.splice(id, 1);

        if(note){
            note.parentNode.removeChild(note);
        }

        for(var i = 0; i < _notes.length; i++){
            if(_notes[i].self){
                _notes[i].self.parentNode.removeChild(_notes[i].self);
                _notes[i].self = null;
            }
        }

        note = null;
        saveNotes();
        backToList();
    }

    //----------------------------------------------------------------------------------------------------
    function saveNotes() {
        //localStorage.notes = toString(_notes);
    }

    //----------------------------------------------------------------------------------------------------
    function backToList() {
        _controls.edit_view.style.display = 'none';
        _controls.list_view.style.display = 'block';
        shownAllNotes();
    }

    //----------------------------------------------------------------------------------------------------
    // Events
    //----------------------------------------------------------------------------------------------------
    function shownDetails(id) {
        _controls.edit_view.style.display = 'block';
        _controls.list_view.style.display = 'none';
        _controls.title.innerText = _notes[id].title;
        _controls.description.value = _notes[id].description;
        _controls.description.focus();
        _controls.description.selectionStart = 0;
        _controls.description.selectionEnd = 0;
        localStorage.selectedID = id;

        if(_note){
            cancelNote();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function shownAllNotes() {
        localStorage.selectedID = "";
        for(var i = 0; i < _notes.length; i++){
            if(!_notes[i].self){
                var item = _controls.list_item.cloneNode(true);
                var span = document.createElement('span');

                item.id = i;
                span.innerText = (i + 1) + ". " + _notes[i].title;
                item.appendChild(span);
                item.style.display = 'block'

                item.onclick = function(e){
                    if(!e.ctrlKey){
                        shownDetails(this.id);
                    } else {
                        editTitleNote(this);
                    }
                }

                _controls.list_item.parentNode.insertBefore(item, _controls.list_item);
                _notes[i].self = item;
            }
        }
    }

    //----------------------------------------------------------------------------------------------------
    // Functions
    //----------------------------------------------------------------------------------------------------
    function trim(text) {
        return text.replace(/^\s+|\s+$/g, '');
    }

    //----------------------------------------------------------------------------------------------------
    function toString(a) {
        //var result = [];
        //for(var i = 0; i < a.length; i++){
        //    var item = a[i].title + "\f" + a[i].description + "\0";
        //    result += item;
        //}
        //
        //return result.toString();
    }
}