var notes;
var _controls;
var _notes = [];
var _cache = '';

function initControls () {
    notes = $('#notes').Notes2();
    notes.beckToList();

    _controls = {
        list_view: $(".list-view[0]"),
        details_view: $(".details-view[0]"),
        item_template: $(".list-item[0]"),
        list_items: $(".list-items[0]"),
        title_span: $(".title[0]"),
        description_input: $(".fast-note[0]"),
        back_button: $(".back[0]"),
        add_button: $(".add-note[0]"),
        delete_button: $(".delete[0]"),
        search_button: $(".search-button[0]"),
        loading: $(".loading[0]")
    }
}

function prepareNotesByOne(count) {
    for (let i = 0; i < (count || 1); i++) {
        var element = { self: false, Title: 'Note ' + (i + 1), Time: new Date() };
        _notes.push(element)
    }
}

function initNotesByOne() {
    for(var i = 0; i < _notes.length; i++){
        if(!_notes[i].self){
            var item = _controls.item_template.cloneNode(true);
            item.title_span = document.createElement('span');
            item.time_span = document.createElement('span');
            item.sort_button = document.createElement('span');
            item.tonote_button = item.getElementsByClassName('to-note')[0];

            item.index = i;
            item.id = 'item-' + i;
            item.sort_button.type = "button";
            item.time_span.className = "date-time";
            item.sort_button.className = "button sort";
            item.title_span.innerText = (i + 1) + ". " + _notes[i].Title;
            item.time_span.innerText = new Date(_notes[i].Time).toLocale();

            item.appendChild(item.sort_button);
            item.appendChild(item.title_span);
            item.appendChild(item.time_span);

            item.onclick = function () {
                console.log({
                    'id': this.id
                });
            };
            _controls.list_items.appendChild(item);
            _notes[i].self = item;
        }
    }
}

function prepareNotesByAll(count) {

    if(!localStorage.indexNotes) {
        for (let i = 0; i < (count || 1); i++) {
            // var element = '<div class="list-item" ><input type="button" class="button to-note" /><span>' + (i + 1) + '. Test ' + (i + 1) + '</span></div>';
    
            var element = '<div id="item-' + i +  '" class="list-item"><input type="button" class="button to-note"><span class="button sort"></span><span>' + 
                (i + 1) + '. Note ' + (i + 1) + '</span><span class="date-time">' + new Date().toLocale() +  '</span></div>'
            _notes.push(element)
        }

        _cache = _notes.join('');
        localStorage.indexNotes = _cache;
    } else {
        _cache = localStorage.indexNotes;
    }
}

function initNotesByAll() {
    _controls.list_items.innerHTML = _cache;
    
    var elements = document.getElementsByClassName('list-item');

    for (let i = 0; i < elements.length; i++) {
        elements[i].onclick = function () {
            console.log({
                'id': this.id
            });
        };
    }
}


window.onload = function(){
    $('.add-note[0]').style.display = 'none';
    initControls();

    // prepareNotesByOne(100);
    prepareNotesByAll(100);
    // localStorage.removeItem("indexNotes");

    $('.add-note[0]').onclick = function () {
        console.log('start');
        var start = new Date();
        var end;

        // initNotesByOne();
        initNotesByAll();

        end = new Date();
        console.log({
            'estimatedTime': (end - start)
        })
    }

    $('.add-note[0]').style.display = '';

    console.log({
        'chrome.fileSystem': chrome.fileSystem
    });

    setTimeout(function() {
        console.log('start');
        var start = new Date();
        var end;

        // initNotesByOne();
        initNotesByAll();

        end = new Date();
        console.log({
            'estimatedTime': (end - start)
        })
    }, 0);
    // this.setTimeout(function() {
    //     // prepareNotesByOne(10000);
    //     // prepareNotesByAll(10000);

       

        
    // }, 1300)



    // $('.list-items[0]').innerHTML = '<div class="list-item" ><input type="button" class="button to-note" /><span>1. Test 1</span></div>';

    // $('.list-item[0]').onclick = function (arguments) {
    //     notes.showDetails()
    // }


    // $('#notes').Notes({
    //     list_view: $(".list-view[0]"),
    //     details_view: $(".details-view[0]"),
    //     item_template: $(".list-item[0]"),
    //     list_items: $(".list-items[0]"),
    //     title_span: $(".title[0]"),
    //     description_input: $(".fast-note[0]"),
    //     back_button: $(".back[0]"),
    //     add_button: $(".add-note[0]"),
    //     delete_button: $(".delete[0]"),
    //     search_button: $(".search-button[0]"),
    //     loading: $(".loading[0]")
    // });
}

$.fn.Notes2 = function(){

    // Public members
    this.showDetails = function(){ 
        $(".fast-note[0]").index = 0;
        $(".details-view[0]").style.display = 'block';
        $(".list-view[0]").style.display = 'none';
        $(".title[0]").innerText = 'Test';
        $(".fast-note[0]").value = 'This is a test';
        $(".fast-note[0]").focus();
        $(".fast-note[0]").selectionStart = 0;
        $(".fast-note[0]").selectionEnd = 0;
        $(".fast-note[0]").scrollTop = 0;
    }

    this.beckToList = function(){ 
        // initNotes();
        $(".details-view[0]").style.display = 'none';
        $(".list-view[0]").style.display = 'block';
        // localStorage.removeItem("Index");

        // if(_controls.search_input){
        //     search(trim(_controls.search_input.value));
        //     _controls.search_input.focus();
        // }
    }

    return this;
}