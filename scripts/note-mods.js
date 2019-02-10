class Mode {
  constructor(controls=new Object) {
    this.controls = {
      title: controls.title,
      delete: controls.delete,
      back: controls.back,
      description: controls.description,
    };

    this.mode = null;
    this.events = {};
  }

  create() {
    var editMode = {
      titleInput: document.createElement('input'),
      saveButton: document.createElement('input'),
      cancelButton: document.createElement('input')
    };

    editMode.saveButton.className = "button save-note";
    editMode.saveButton.type = "button";

    editMode.titleInput.type = "text";
    editMode.titleInput.maxLength = 70;
    editMode.titleInput.className = "edit-title details";
    editMode.titleInput.placeholder = 'Enter a Title of Note';

    // editMode.cancelButton.className = "button back";
    editMode.cancelButton.className = "button left";
    editMode.cancelButton.type = "button";
    editMode.cancelButton.value = "Cancel";

    this.controls.title.parentNode.appendChild(editMode.titleInput);
    this.controls.title.parentNode.appendChild(editMode.saveButton);
    this.controls.title.parentNode.appendChild(editMode.cancelButton);

    this.controls.title.style.display = 'None';
    this.controls.delete.style.display = 'None';
    this.controls.back.style.display = 'None';

    this.controls.description.innerHTML = '';

    this.titleInput = editMode.titleInput;
    this.cancelButton = editMode.cancelButton;
    this.saveButton = editMode.saveButton;

    this.saveButton.onmouseup = function (e) {
      e.preventDefault();
      this.save();
    }.bind(this);

    return this;
  }

  remove() {
    var parent = this.titleInput.parentNode;

    parent.removeChild(this.titleInput);
    parent.removeChild(this.saveButton);
    parent.removeChild(this.cancelButton);

    this.controls.title.style.display = '';
    this.controls.back.style.display = '';

    setTimeout(function () {
      this.controls.delete.style.display = '';
    }.bind(this), 700);

    // this.mode.save = null;
    // this.mode = null;
  }

  save(callback = function(){}) {
    if (this.titleInput.value.trim().length === 0) {
      if (!this.titleInput.classList.contains('required')) {
        this.titleInput.classList.add('required');
      } else {
        this.titleInput.style.animation = 'none';
        this.titleInput.offsetHeight; // trigger reflow
        this.titleInput.style.animation = null;
      }

      this.titleInput.focus();
      return;
    }

    if (this.events.save) {
      this.events.save({
        id: -1,
        title: this.titleInput.value,
        description: this.controls.description.innerHTML,
        order: -1,
        time: new Date().getTime()
      });
    }

    this.controls.title.value = this.titleInput.value;
    this.remove();
    this.controls.description.focus();
    // localStorage.rowId = (this.notes.length - 1);
  }

  event(name, callback){
    this.events[name] = callback;
  }

  // onSave(callback) {
  //   this.events.onSave = callback;
  // }
}