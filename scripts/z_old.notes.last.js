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


$.fn.Notes = function(controls)
{
    var _notes = [];
    var _controls = {};
    var _edit;
    var _main;

    //----------------------------------------------------------------------------------------------------
    (function(self) {
        if(controls){
            _controls = controls;

            _controls.back_button.onclick = shownAllNotes;
            _controls.add_button.onclick = addNote;
            _controls.delete_button.onclick = deleteNote;
            _controls.search_button.onclick = startSearch;
            _controls.description_input.onchange = onNoteChanged;
            _controls.title_span.parentNode.onclick = onTitleClick;

            
            _main = (chrome && chrome.extension && chrome.extension.getBackgroundPage)? chrome.extension.getBackgroundPage() : main; /*_main = main;*/
            //_main = main; //When it works as not extension
            _controls.list_items.addEventListener('contextmenu', onContextMenu);
            _controls.details_view.addEventListener('contextmenu', onContextMenu);

            loadNotes();
        }
    })(this);

    //----------------------------------------------------------------------------------------------------
    // Methods
    //----------------------------------------------------------------------------------------------------
    function loadNotes() {
        if(_main.needMigrate){
            _controls.loading.style.display = 'block';
            console.log({
                'needMigrate': true
            });
        }

        _main.loadNotes(function(notes){
            initNotes(notes);
            _controls.loading.style.display = 'none';

            if(localStorage.Index){
                shownDetails(localStorage.Index);
            } else {
                shownAllNotes();
            }
        });
    }

    //----------------------------------------------------------------------------------------------------
    function initNotes(notes) {
        _notes = notes || _notes;

        for(var i = 0; i < _notes.length; i++){
            if(!_notes[i].self){
                var item = _controls.item_template.cloneNode(true);
                item.title_span = document.createElement('span');
                item.time_span = document.createElement('span');
                item.sort_button = document.createElement('span');
                item.tonote_button = item.getElementsByClassName('to-note')[0];

                item.index = i;
                item.sort_button.type = "button";
                item.time_span.className = "date-time";
                item.sort_button.className = "button sort";
                item.title_span.innerText = (i + 1) + ". " + _notes[i].Title;
                item.time_span.innerText = new Date(_notes[i].Time).toLocale();

                item.appendChild(item.sort_button);
                item.appendChild(item.title_span);
                item.appendChild(item.time_span);

                item.onclick = onNoteClick;
                item.sort_button.onmousedown = onSortBegin;
                _controls.list_items.appendChild(item);
                _notes[i].self = item;
            }
        }
    }

    //----------------------------------------------------------------------------------------------------
    function addNote() {
        if(!_edit){
            _edit = {
                append: true,
                note: _controls.item_template.cloneNode(true),
                input: document.createElement('input')
            }

            _edit.input.type = "text";
            _edit.input.className = "edit-title";
            _edit.input.maxLength = 70;
            _edit.note.tonote_button = _edit.note.getElementsByClassName('to-note')[0];
            _edit.note.className = _edit.note.className + " edit-item";

            _controls.list_items.appendChild(_edit.note);
            _edit.note.appendChild(_edit.input);
            window.onmousedown = document.onkeyup = onEditNote;
            _edit.input.focus();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function editNote(item) {
        if(!_edit){
            _edit = {
                note: item,
                input: document.createElement('input'),
                save_button: document.createElement('input')
            }

            _edit.note.title_span.style.display = 'none';
            _edit.note.time_span.style.display = 'none';
            _edit.note.sort_button.style.display = 'none';
            _edit.note.tonote_button.style.display = 'none';
            _edit.input.type = "text";
            _edit.input.maxLength = 70;
            _edit.input.className = "edit-title";
            _edit.save_button.className = "button save-note";
            _edit.note.className = _edit.note.className + " edit-item";

            _edit.note.appendChild(_edit.input);
            _edit.note.appendChild(_edit.save_button);
            _edit.input.value = _notes[item.index].Title;
            window.onmousedown = document.onkeyup = onEditNote;
            _edit.input.focus();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function editTitle(e) {
        if(!_edit){
            var index = _controls.description_input.index;

            _edit = {
                note: _notes[index].self,
                input: document.createElement('input')
            }

            _edit.input.type = "text";
            _edit.input.maxLength = 70;
            _edit.input.className = "edit-title details";
            _controls.title_span.style.display = 'none';
            _edit.input.value = _notes[index].Title;
            _controls.title_span.parentNode.appendChild(_edit.input);
            _edit.input.onblur = _edit.input.onkeyup = onTitleChanged;
            _edit.input.focus();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function replaceNotes(first, second){
        var min = (first < second)? first : second;
        var max = (first < second)? second : first;
        var temp = _notes[first];

        _notes.splice(first, 1);
        _notes.splice(second, 0, temp);

        for(var i = min; i <=  max; i++){
            _notes[i].self.index = i;
            _notes[i].self.title_span.innerText = (i + 1) + ". " + _notes[i].Title;
            _notes[i].DisplayOrder = i;
            _main.saveNote(_notes[i], "DisplayOrder");
        }
    }

    //----------------------------------------------------------------------------------------------------
    function createNote(title){
        _notes.push({Title: title, Description: "", DisplayOrder: _notes.length, Time: new Date().getTime() });
        _main.addNote(_notes[_notes.length-1], function(insertId){
            _notes[_notes.length-1].ID = insertId;
            shownDetails(_notes.length-1);
            finishEdit();
        });
    }

    //----------------------------------------------------------------------------------------------------
    function saveTitle(title){
        _notes[_edit.note.index].Title = title;
        _notes[_edit.note.index].Time = new Date().getTime();
        _main.saveNote(_notes[_edit.note.index], "Title");

        if(_controls.search_input){
            search(trim(_controls.search_input.value));
        }

        finishEdit();
    }

    //----------------------------------------------------------------------------------------------------
    function finishEdit() {
        var index = _edit.note.index;

        if(_edit.save_button){
            _edit.note.removeChild(_edit.save_button);
        }

        if(!_edit.append){
            _edit.note.title_span.style.display = '';
            _edit.note.time_span.style.display = '';
            _edit.note.sort_button.style.display = '';
            _edit.note.tonote_button.style.display = '';
            _controls.title_span.innerText = _notes[index].Title;
            _edit.note.title_span.innerText = (index + 1) + ". " + _notes[index].Title;
            _edit.note.time_span.innerText = new Date(_notes[index].Time).toLocale();
            _edit.note.className = _edit.note.className.replace(" edit-item","");
            _edit.input.parentNode.removeChild(_edit.input);
        } else {
            _edit.note.parentNode.removeChild(_edit.note);
        }

        window.onmousedown = document.onkeyup = null;
        _edit = null;
    }

    //----------------------------------------------------------------------------------------------------
    function deleteNote() {
        var index = _controls.description_input.index;
        _notes[index].self.parentNode.removeChild(_notes[index].self);
        _main.removeNote(_notes[index].ID);
        _notes.splice(index, 1);

        for(var i = 0; i < _notes.length; i++){
            _notes[i].self.title_span.innerText = (i + 1) + ". " + _notes[i].Title;
            _notes[i].DisplayOrder = _notes[i].self.index = i;
            _main.saveNote(_notes[i], "DisplayOrder");
        }

        shownAllNotes();
    }

    //----------------------------------------------------------------------------------------------------
    // Search
    //----------------------------------------------------------------------------------------------------
    function startSearch(){
        var button = _controls.search_button;

        if(!_controls.search_input){
            _controls.search_input = document.createElement('input');
            _controls.search_input.type = 'text';
            _controls.search_input.className = 'search-notes';
            _controls.search_input.placeholder = 'Enter keyword';
            _controls.search_input.maxLength = 30;

            button.parentNode.insertBefore(_controls.search_input, button.nextSibling);
            _controls.search_input.oninput = onSearch;
            _controls.search_input.onkeyup = onSearchKey;
            _controls.search_input.onblur = onSearchKey;
            _controls.search_input.focus();
        } else {
            _controls.search_input.focus();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function search(value){
        _notes.forEach(function(item){
            var t_index = item.Title.toLowerCase().indexOf(value.toLowerCase());
            var d_index = item.Description.toLowerCase().indexOf(value.toLowerCase());

            if(t_index != -1 || d_index != -1){
                item.self.style.display = '';
                item.self.sort_button.disabled = true;
                item.self.sort_button.setAttribute("disabled", "disabled");
            } else {
                item.self.style.display = 'none';
                item.self.sort_button.disabled = false;
                item.self.sort_button.removeAttribute("disabled");
            }
        });
    }

    //----------------------------------------------------------------------------------------------------
    function cancelSearch(remove){
        var input = _controls.search_input;

        if(remove){
            input.oninput = input.onkeyup = input.onblur = null;
            input.parentNode.removeChild(input);
            _controls.search_input = null;
            input = null;
        }

        _notes.forEach(function(item){
            item.self.style.display = '';
            item.self.sort_button.disabled = false;
            item.self.sort_button.removeAttribute("disabled");
        });
    }

    //----------------------------------------------------------------------------------------------------
    function onSearch(e) {
        var value = trim(this.value);

        if (value.length > 0) {
            search(value);
        } else {
            cancelSearch();
        }
    }

    //----------------------------------------------------------------------------------------------------
    // END Search
    //----------------------------------------------------------------------------------------------------
    function onSearchKey(e) {
        if (e.keyCode == 27 || (!e.keyCode && trim(this.value).length == 0)) {
            this.value = "";
            cancelSearch(true);
            return false;
        }
    }

    //----------------------------------------------------------------------------------------------------
    function shownAllNotes() {
        initNotes();
        _controls.details_view.style.display = 'none';
        _controls.list_view.style.display = 'block';
        localStorage.removeItem("Index");

        if(_controls.search_input){
            search(trim(_controls.search_input.value));
            _controls.search_input.focus();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function shownDetails(index) {
        _controls.description_input.index = index;
        _controls.details_view.style.display = 'block';
        _controls.list_view.style.display = 'none';
        _controls.title_span.innerText = _notes[index].Title;
        _controls.description_input.value = _notes[index].Description;
        _controls.description_input.focus();
        _controls.description_input.selectionStart = 0;
        _controls.description_input.selectionEnd = 0;
        _controls.description_input.scrollTop = 0;
        localStorage.Index = index;
    }

    //----------------------------------------------------------------------------------------------------
    // Events
    //----------------------------------------------------------------------------------------------------
    function onNoteClick(e){
        if(!e.ctrlKey && !_edit){
            shownDetails(this.index);
        }

        if(e.ctrlKey && !_edit){
            editNote(this);
        }
    }

    //----------------------------------------------------------------------------------------------------
    function onSortBegin(e){
        if(!_edit && e.which == 1 && !this.disabled) {
            var list = _controls.list_items;
            var item = this.parentNode;

            _edit = {
                note: item,
                prevY: e.pageY + list.scrollTop,
                offsetY: e.pageY - item.offsetTop + list.scrollTop,
                placeholder: item.cloneNode(true),
                maxY: list.scrollHeight - item.offsetHeight
            }

            if(list.scrollHeight / item.offsetHeight > _notes.length){
                _edit.maxY = _notes.length * item.offsetHeight - item.offsetHeight;
            }

            _edit.note.className += " drag";
            _edit.placeholder.innerHTML = '';
            list.insertBefore(_edit.placeholder, item);
            item.style.top = e.pageY + list.scrollTop - _edit.offsetY;
            document.onmousemove = _controls.list_items.onscroll = onSorting;
            document.onmouseup = onEndSort;
        }
    }

    //----------------------------------------------------------------------------------------------------
    function onSorting(e){
        var pageY = (e.pageY || _edit.prevY) + _controls.list_items.scrollTop;
        var center = _edit.note.offsetTop + _edit.note.offsetHeight/2;
        var index = normalise(parseInt(center / _edit.note.offsetHeight), _notes.length);

        if(index < _edit.note.index){
            _controls.list_items.insertBefore(_edit.placeholder, _notes[index].self);
            replaceNotes(_edit.note.index, index);
        }

        if(index > _edit.note.index){
            _controls.list_items.insertBefore(_edit.placeholder, _notes[index].self.nextSibling);
            replaceNotes(_edit.note.index, index);
        }

        _edit.note.style.top = normalise(pageY - _edit.offsetY, _edit.maxY);
        _edit.prevY = e.pageY || _edit.prevY;
    }

    //----------------------------------------------------------------------------------------------------
    function onEndSort(e){
        document.onmousemove = document.onmouseup = null;
        _controls.list_items.onscroll = null;
        _edit.note.className = _edit.note.className.replace(" drag", "");

        _edit.note.style.top = "";
        _edit.note.style.visibility = "";
        _edit.note.style.visibility = "";
        _controls.list_items.insertBefore(_edit.note, _edit.placeholder);
        _controls.list_items.removeChild(_edit.placeholder);

        setTimeout(function(){ _edit = null; }, 10);
    }

    //----------------------------------------------------------------------------------------------------
    function onTitleClick(e){
        var element = e.target || e.srcElement || e.originalTarget;

        if(!_edit && (e.ctrlKey || e.type == 'dblclick') &&
            (element != _controls.back_button && element != _controls.delete_button)){
            editTitle();
        }
    }

    //----------------------------------------------------------------------------------------------------
    function onNoteChanged(e){
        var note = _notes[this.index];
        note.Description = this.value;

        if(note.self){
            note.Time = new Date().getTime();
            note.self.time_span.innerText = new Date(note.Time).toLocale();
        }

        _main.saveNote(note, "Description");
    }

    //----------------------------------------------------------------------------------------------------
    function onEditNote(e){
        var element = e.target || e.srcElement || e.originalTarget;
        var value = trim(_edit.input.value);

        if(value.length > 0 && ((element == _edit.input && e.keyCode == 13)
            || (element != _edit.input && e.which && e.which == 1 &&
            (element == _edit.note.tonote_button || element == _edit.save_button)))){
            if(_edit.append){
                createNote(value);
            } else {
                saveTitle(value);
            }
            return false;
        }

        if(!e.keyCode && element != _edit.input){
            _edit.input.focus();
            return false;
        }

        if(e.keyCode == 27){
            finishEdit();
            return false;
        }
    }

    //----------------------------------------------------------------------------------------------------
    function onTitleChanged(e){
        var value = trim(this.value);

        if((e.keyCode == 13 || !e.keyCode) && value.length > 0){
            _edit.input.onkeyup = _edit.input.onblur = null;
            _controls.title_span.style.display = 'inline'
            _controls.description_input.focus();
            saveTitle(value);
            return false;
        }

        if(e.keyCode == 27 || (!e.keyCode && value.length == 0)){
            _edit.input.onkeyup = _edit.input.onblur = null;
            _controls.title_span.style.display = 'inline'
            _controls.description_input.focus();
            finishEdit();
            return false;
        }
    }

    //----------------------------------------------------------------------------------------------------
    function onContextMenu(e){
        var element = e.target || e.srcElement || e.originalTarget;

        if(element.type != 'text' && element.type != 'textarea'){
            e.preventDefault();
        }
    }

    //----------------------------------------------------------------------------------------------------
    //  Functions
    //----------------------------------------------------------------------------------------------------
    function normalise(current, max, min){
        var minimum = min || 0;

        current = (current >= max)? max : current;
        current = (current <  minimum)? minimum : current;
        return current;
    }
}