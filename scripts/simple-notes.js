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

    if (!localStorage.rowId) {
      this.backToList();
    }
  }

  backToList() {
    this.controls.detailsView.style.display = 'None';
    this.controls.listView.style.display = 'inherit';

    localStorage.removeItem('rowId');

    if (this.searchMode) {
      this.searchMode.input.focus();
    }
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

      this.editMode.cancelButton.className = 'button back';
      this.editMode.titleInput.focus();

      this.editMode.cancelButton.onmouseup = function (e) {
        e.preventDefault();
        this.editMode.remove();
        this.backToList();
      }.bind(this);
    }
  }
}