class BaseNotes {
  constructor(controls) {
    this.$valid = true;
    this.showError = null;
    this.notes = [];
    this.message = null;

    this.controls = {
      add: controls.add,
      delete: controls.delete,
      template: controls.template,
      listView: controls.listView,
      detailsView: controls.detailsView,
      title: controls.title,
      listControls: controls.listControls
    };

    this.background = (chrome && chrome.extension && chrome.extension.getBackgroundPage)? 
      chrome.extension.getBackgroundPage().main : main; /*this.background = main;*/

    // init modules
    this.controls.listItems = new ScrollBar(controls.listItems, {wheel: true});
    this.controls.content = new ScrollBar(controls.content, {background: '#D6D6D6'});
    this.controls.description = new Editor(controls.description, controls.editorControlls);

    this.sortHelper = new SortHelper(this.controls.listItems);
    this.searchModule = new SearchModule(controls.search, controls.searchInput);

    // init background
    this.background.addEventListener('error', this.error.bind(this));
    this.background.addEventListener('warning', this.warning.bind(this));
    this.background.init(this.init.bind(this));
    
    // Add global events
    this.controls.add.addEventListener('click', this.newNote.bind(this));
    this.controls.delete.addEventListener('click', function () {
      this.deleteNote(parseInt(localStorage.rowId));
    }.bind(this));
    this.controls.title.addEventListener('change', this.titleChanged.bind(this));
    this.controls.description.addEventListener('focus', function (e) {
      if (!this.$valid) {
        e.preventDefault();
        return this.showError();
      }
    }.bind(this));
    this.controls.description.addEventListener('change', this.descriptionChanged.bind(this));
  }

  init(notes) {
    this.searchModule.init();

    this.build(notes);
    this.notes = notes;
    this.searchModule.notes = notes;
  }

  build(notes) {
    this.controls.listItems.appendChild(this.render(notes, 10));
    
    setTimeout(function(){
      this.controls.listItems.appendChild(this.render(notes));

      for(var i = 0; i < notes.length; i++) {
        const element = notes[i].self;

        // element.onclick = function(e){
        //   this.selectNote(element.index);
        // }.bind(this);

        element.onclick = this.selectNote.bind(this, element.index);
        element.sortButton.onmousedown = this.startSorting.bind(this);
      }

      // this.controls.listItems.scrollTop = 200;
    }.bind(this), 10);
  }

  // TODO Need to optimize
  render(notes, limit=0) {
    var fragment = document.createDocumentFragment();
    var length = limit && notes.length > limit? limit : notes.length;

    for(var i = 0; i < length; i++) {
      if(!notes[i].self){
        var item = document.createElement('div');

        item.className = 'list-item';

        item.titleSpan = document.createElement('span');
        item.bulletinSpan = document.createElement('span');
        item.timeSpan = document.createElement('span');
        item.sortButton = document.createElement('span');
        item.toNoteButton = document.createElement('input');
        
        item.toNoteButton.className = 'button to-note';
        
        item.sortButton.type = 'button';
        item.timeSpan.className = 'date-time';
        item.titleSpan.className = 'list-title';
        item.sortButton.className = 'button sort';

        item.bulletinSpan.innerText = (i + 1);
        item.titleSpan.innerText = notes[i].title;
        item.timeSpan.innerText = new Date(notes[i].updated).toDateString();

        item.appendChild(item.toNoteButton);
        item.appendChild(item.sortButton);
        item.appendChild(item.bulletinSpan);
        item.appendChild(document.createTextNode('. '));
        item.appendChild(item.titleSpan);
        item.appendChild(item.timeSpan);

        item.index = i;
        notes[i].self = item;

        if (this.searchModule.busy) {
          this.searchModule.lockItem(item);
          item.style.display = this.searchModule.matched(notes[i]) ? '' : 'none';
        }

        fragment.appendChild(item);
      }
    }

    return fragment;
  }

  selectNote(index) {
    if (!this.sortHelper.busy) {
      this.controls.description.element.index = index;
      this.controls.listView.style.display = 'None';
      this.controls.detailsView.style.display = 'inherit';
  
      this.controls.title.value = this.notes[index].title;
      this.controls.description.value = this.notes[index].description;
      this.controls.description.focus();

      //#region SET Selection
      // SET Selection https://developer.mozilla.org/en-US/docs/Web/API/Range
      // var contaier = this.controls.description;
      // var range = document.createRange();
      // range.selectNode(contaier);
      // range.setStart(contaier.firstChild, 2);
      // range.setEnd(contaier.firstChild, 7);
      // window.getSelection().removeAllRanges();
      // window.getSelection().addRange(range);

      // document.execCommand('selectAll',false,null)

      // if (this.controls.description.innerHTML.length > 10) {
      //   var selection = window.getSelection();
      //   selection.collapse(this.controls.description.firstChild, 2);
      //   selection.extend(this.controls.description.firstChild, 8);
      // }
      //#endregion
  
      // this.controls.description.scrollTop = 0;
      localStorage.rowId = index;
    }
  }

  // Functions
  addNote(note) {
    this.notes.push(note);
    this.controls.listItems.appendChild(this.render(this.notes));

    note.displayOrder = this.notes.length;
    note.self.onclick = this.selectNote.bind(this, note.self.index);

    this.background.add(note, function(id){
      note.id = id;
    });
  }

  // TODO Need to catch errors
  deleteNote(id) {
    this.background.remove(this.notes[id].id);

    this.controls.listItems.removeChild(this.notes[id].self);
    this.notes[id].self = null;
    this.notes.splice(id, 1);

    this.$valid = true;
    this.showError = null;
    this.controls.title.classList.remove('required');

    for (var i = id; i < this.notes.length; i++) {
      this.notes[i].self.bulletinSpan.innerText = (i + 1);
      this.notes[i].self.index = i;
    }
  }

  newNote() {
    if (!this.editMode) {
      this.editMode = new NewNote(this.controls);

      this.editMode.onSave = function (note) {
        this.addNote(note);
        delete this.editMode;
        // localStorage.rowId = (this.notes.length - 1);
        this.selectNote(note.self.index);
      }.bind(this);

      this.editMode.onCancel = function () {
        delete this.editMode;
      }.bind(this);
    }
  }

  // EVENTS
  descriptionChanged(value) {
    var rowId = localStorage.rowId;

    if (!this.editMode && rowId && value != this.notes[rowId].description) {
      this.notes[localStorage.rowId].description = value;
      this.background.update(this.notes[localStorage.rowId], 'description');
    }
  }

  titleChanged() {
    if (this.controls.title.value.trim().length === 0) {
      this.$valid = false;
      this.showError = Validator.bindRequiredAnimation(this.controls.title);
      return;
    }

    this.$valid = true;
    this.showError = null;
    this.controls.title.classList.remove('required');

    this.notes[localStorage.rowId].title = this.controls.title.value;
    this.notes[localStorage.rowId].self.titleSpan.innerText = this.notes[localStorage.rowId].title;

    // TODO Need to catch errors
    this.background.update(this.notes[localStorage.rowId], 'title');
  }

  startSorting(e) {
    var element = e.path[1];
    var items = {};
    var oldValues = {};

    if(!this.searchModule.busy && !this.sortHelper.busy && e.button === 0) {
      this.sortHelper.start(e.pageY, element, this.notes);

      for(var key in this.notes) {
        const item = this.notes[key];
        oldValues[item.id] = item.displayOrder;
      }

      this.sortHelper.onUpdate = function(item){
        items[item.id] = item;
      }.bind(this);

      this.sortHelper.onFinish = function(){
        for(var key in items){
          const item = items[key];

          if(oldValues[item.id] !== item.displayOrder) {
            this.background.update(item, "displayOrder");
          }
        }
        
        this.searchModule.focus();
      }.bind(this);
    }
  }

  error(message) {
    if(!this.message) {
      this.message = document.createElement('div');

      this.message.style.width = this.controls.listItems.offsetWidth - 20;
      this.message.style.top = this.controls.listItems.offsetHeight - 5;

      this.message.classList.add('alert');
      this.message.innerHTML = message;
      document.body.appendChild(this.message);
    } else {
      this.message.innerHTML += '<br>' + message;
    }

    clearInterval(this.message.interval);
    
    this.message.interval = setTimeout(function(){
      document.body.removeChild(this.message);
      this.message = null;
    }.bind(this), 7000);
  }

  warning(message) {
    console.log({
      'notify.message': message
    })

  }
}

String.prototype.trim = function () {
  return this.replace(/^\s+|\s+$/g, '')
}