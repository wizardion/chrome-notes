class BaseNotes {
  constructor(controls=new Object) {
    this.$valid = true;
    this.showError = null;
    this.notes = [];

    this.controls = {
      add: controls.add,
      delete: controls.delete,
      template: controls.template,
      listView: controls.listView,
      detailsView: controls.detailsView,
      listItems: controls.listItems,
      title: controls.title,
      description: controls.description,
      search: controls.search,

      listControls: controls.listControls
    };

    this.background = (chrome && chrome.extension && chrome.extension.getBackgroundPage)? 
      chrome.extension.getBackgroundPage().main : main; /*this.background = main;*/

    this.controls.listItems = new ScrollBar(this.controls.listItems);
    this.controls.description = new ScrollBar(this.controls.description, {background: '#D6D6D6'});
    this.sortingHelper = new SortingHelper(this.controls.listItems);

    this.init();
    
    // Add global events
    this.controls.add.addEventListener('click', this.newNote.bind(this));
    this.controls.search.addEventListener('click', this.startSearch.bind(this));

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

    this.controls.description.addEventListener('blur', function(){
      if (!this.editMode && this.controls.description.innerHTML != this.notes[localStorage.rowId].description) {
        this.descriptionChanged();
      }
    }.bind(this));
  }

  init() {
    if (localStorage.searching) {
      this.startSearch();
      this.searchMode.value = localStorage.searching;
      this.searchMode.input.value = this.searchMode.value;
    }

    this.background.init(function(notes) {
      this.build(notes);
      this.notes = notes;

      if (localStorage.rowId) {
        this.selectNote(localStorage.rowId);
      }
    }.bind(this));
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
  render(notes, limit=0){
    var fragment = document.createDocumentFragment();
    var length = limit && notes.length > 10? limit : notes.length;

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
        item.timeSpan.innerText = new Date(notes[i].time).toDateString();

        item.appendChild(item.toNoteButton);
        item.appendChild(item.sortButton);
        item.appendChild(item.bulletinSpan);
        item.appendChild(document.createTextNode('. '));
        item.appendChild(item.titleSpan);
        item.appendChild(item.timeSpan);

        item.index = i;
        notes[i].self = item;

        if (this.searchMode) {
          this.searchMode.lockItem(item);
          item.style.display = this.searchMode.isMatched(notes[i]) ? '' : 'none';
        }

        fragment.appendChild(item);
      }
    }

    return fragment;
  }

  selectNote(index) {
    // if (!this.sortingMode) {
    if (!this.sortingHelper.isBusy) {
      this.controls.description.index = index;
      this.controls.listView.style.display = 'None';
      this.controls.detailsView.style.display = 'inherit';
  
      this.controls.title.value = this.notes[index].title;
      this.controls.description.innerHTML = this.notes[index].description;
      this.controls.description.focus();
  
      // Selection
      // const editableDiv = this.controls.description;
      // const selection = window.getSelection();
      // selection.collapse(editableDiv.childNodes[editableDiv.childNodes.length - 1], 5);
  
      this.controls.description.scrollTop = 0;
      localStorage.rowId = index;
    }
  }

  // Functions
  addNote(note) {
    this.notes.push(note);
    this.controls.listItems.appendChild(this.render(this.notes));

    note.self.onclick = function(e){
      this.selectNote(note.self.index);
    }.bind(this)

    this.background.add(note, function(id){
      note.id = id;
    }, function () {
      console.log('ERROR!');
    });
  }

  deleteNote(id) {
    // TODO Need to catch errors
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

  createNewMode() {
    var editMode = {
      titleInput: document.createElement('input'),
      saveButton: document.createElement('input'),
      cancelButton: document.createElement('input')
    };

    editMode.saveButton.className = 'button save-note';
    editMode.saveButton.type = 'button';

    editMode.titleInput.type = 'text';
    editMode.titleInput.maxLength = 70;
    editMode.titleInput.className = 'edit-title details';
    editMode.titleInput.placeholder = 'Enter a Title of Note';

    // editMode.cancelButton.className = 'button back';
    editMode.cancelButton.className = 'button left';
    editMode.cancelButton.type = 'button';
    editMode.cancelButton.value = 'Cancel';

    this.controls.title.parentNode.appendChild(editMode.titleInput);
    this.controls.title.parentNode.appendChild(editMode.saveButton);
    this.controls.title.parentNode.appendChild(editMode.cancelButton);

    this.controls.title.style.display = 'None';
    this.controls.delete.style.display = 'None';
    this.controls.back.style.display = 'None';

    this.controls.description.innerHTML = '';

    return editMode;
  }

  // TODO Need to optimize
  newNote() {
    if (!this.editMode) {
      // ----------------------------------------------------------------------------------------------------
      // Creating new view: New Note
      // ----------------------------------------------------------------------------------------------------
      this.editMode = this.createNewMode();

      this.editMode.$valid = false;
      this.editMode.showError = Validator.bindRequiredAnimation(this.editMode.titleInput);

      // ----------------------------------------------------------------------------------------------------
      // Creating event functions to remove: New Note view
      // ----------------------------------------------------------------------------------------------------
      this.editMode.remove = function () {
        var parent = this.editMode.titleInput.parentNode;

        parent.removeChild(this.editMode.titleInput);
        parent.removeChild(this.editMode.saveButton);
        parent.removeChild(this.editMode.cancelButton);

        this.controls.title.style.display = '';
        this.controls.back.style.display = '';

        setTimeout(function () {
          this.controls.delete.style.display = '';
        }.bind(this), 700);

        this.editMode.save = null;
        this.editMode.$valid = true;
        this.editMode.showError = null;
        this.editMode = null;
      }.bind(this);

      this.editMode.save = function () {
        if (this.editMode.titleInput.value.trim().length === 0) {
          return this.editMode.showError();
        }

        this.addNote({
          id: -1,
          title: this.editMode.titleInput.value,
          description: this.controls.description.innerHTML,
          order: this.notes.length,
          time: new Date().getTime()
        });

        this.controls.title.value = this.editMode.titleInput.value;
        this.editMode.remove();
        this.controls.description.focus();
        localStorage.rowId = (this.notes.length - 1);
      }.bind(this);

      // ----------------------------------------------------------------------------------------------------
      // Assing event listeners to: New Note
      // ----------------------------------------------------------------------------------------------------
      this.editMode.titleInput.onkeydown = function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          this.controls.description.focus();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          this.editMode.save();
        }
      }.bind(this);

      this.editMode.saveButton.onmousedown = function (e) {
        e.preventDefault();
      };

      this.editMode.saveButton.onmouseup = function (e) {
        e.preventDefault();
        this.editMode.save();
      }.bind(this);

      this.editMode.cancelButton.onmouseup = function (e) {
        e.preventDefault();
        this.editMode.remove();
      }.bind(this);
    }
  }

  // EVENTS
  descriptionChanged() {
    this.notes[localStorage.rowId].description = this.controls.description.innerHTML;

    // TODO Need to catch errors
    this.background.update(this.notes[localStorage.rowId], 'description', function (tx, data) {
      // console.log({
      //   'tx': tx,
      //   'data': data,
      // });
    });
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

  startSearch() {
    if (!this.searchMode) {
      this.searchMode = {
        input: document.createElement('input')
      };

      this.searchMode.input.type = 'text';
      this.searchMode.input.className = 'search-notes';
      this.searchMode.input.placeholder = 'Enter keyword';
      this.searchMode.input.maxLength = 30;

      this.searchMode.lockItem = function (item) {
        item.sortButton.disabled = true;
        item.sortButton.setAttribute('disabled', 'disabled');
      };

      this.searchMode.isMatched = function (item) {
        var searchKey = this.searchMode.value.toLowerCase();
        var t_index = item.title.toLowerCase().indexOf(searchKey);
        var d_index = item.description.toLowerCase().indexOf(searchKey);

        return (t_index !== -1 || d_index !== -1);
      }.bind(this);

      this.searchMode.search = function () {
        for (var i = 0; i < this.notes.length; i++) {
          this.notes[i].self.style.display = this.searchMode.isMatched(this.notes[i]) ? '' : 'none';
        }
      }.bind(this);

      this.searchMode.cancelSearch = function () {
        for (var i = 0; i < this.notes.length; i++) {
          this.notes[i].self.style.display = '';
        }
      }.bind(this);

      this.searchMode.remove = function () {
        this.searchMode.input.oninput = null;
        this.searchMode.input.onkeyup = null;
        this.searchMode.input.onblur = null;
        this.searchMode.cancelSearch = null;
        this.searchMode.search = null;
        this.searchMode.remove = null;

        this.controls.listControls.removeChild(this.searchMode.input);
        localStorage.removeItem('searching');
        
        this.searchMode.input = null;
        this.searchMode = null;

        for (var i = 0; i < this.notes.length; i++) {
          const item = this.notes[i];

          item.self.sortButton.disabled = false;
          item.self.sortButton.removeAttribute('disabled');
        }
      }.bind(this);

      this.searchMode.input.oninput = function () {
        this.searchMode.value = this.searchMode.input.value.trim();

        if (this.searchMode.value.length > 0) {
          this.searchMode.search();
        } else {
          this.searchMode.cancelSearch();
        }

        localStorage.searching = this.searchMode.value;
      }.bind(this);

      this.searchMode.input.onkeyup = function (e) {
        e.preventDefault();

        if (e.keyCode == 27) {
          this.searchMode.cancelSearch();
          this.searchMode.remove();
          return false;
        }
      }.bind(this);

      this.searchMode.input.onblur = function (e) {
        if (this.searchMode.input.value.trim().length === 0) {
          this.searchMode.remove();
        }
      }.bind(this);

      for (var i = 0; i < this.notes.length; i++) {
        this.searchMode.lockItem(this.notes[i].self);
      }

      this.controls.listControls.appendChild(this.searchMode.input);
      this.searchMode.input.focus();
    } else {
      this.searchMode.input.focus();
    }
  }

  startSorting(e) {
    var element = e.path[1];

    if(!this.sortingHelper.isBusy && e.button === 0) {
      this.sortingHelper.start(e.pageY, element, this.notes);
    }
  }
}

String.prototype.trim = function () {
  return this.replace(/^\s+|\s+$/g, '')
}