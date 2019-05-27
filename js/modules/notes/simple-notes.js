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
    super.init(notes);

    if (!localStorage.rowId) {
      this.backToList();
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
      this.editMode.controls.title.focus();

      this.editMode.onCancel = function () {
        this.backToList();
        delete this.editMode;
      }.bind(this);
    }
  }
}