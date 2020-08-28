class SimpleNotes extends BaseNotes {
  constructor(controls=new Object) {
    super(controls);
    
    this.controls.back = controls.back;
    this.controls.templates = controls.templates;
  
    this.controls.back.addEventListener('click', function () {
      if (!this.$valid) {
        return this.showError();
      }
      this.backToList();
    }.bind(this));
  }

  init(notes) {
    const rowId = localStorage.rowId;
    const isNewNote = !!localStorage.newNote;

    super.init(notes);

    if (!isNewNote && !rowId) {
      this.backToList();
    }

    if (!isNewNote && rowId) {
      this.selectNote(parseInt(rowId));
    }

    if (isNewNote) {
      this.newNote();
    }
  }

  backToList() {
    this.controls.detailsView.style.display = 'None';
    this.controls.listView.style.display = 'inherit';

    localStorage.removeItem('rowId');
    this.searchModule.focus();
  }
  
  deleteNote(id) {
    super.deleteNote(id);
    this.backToList();
  }

  newNote() {
    if (!this.editMode) {
      super.newNote();

      this.controls.listView.style.display = 'None';
      this.controls.detailsView.style.display = 'inherit';

      this.editMode.controls.cancel.className = 'button back';
      this.editMode.controls.activeElement.focus();

      this.editMode.onCancel = function () {
        this.backToList();
        delete this.editMode;
      }.bind(this);
    }
  }
}