class SearchProvider {
  constructor(controls=new Object) {
    this.input = null;
  }

  // startSearching() {
  //   this.input = document.createElement('input');

  //   this.input.type = 'text';
  //   this.input.className = 'search-notes';
  //   this.input.placeholder = 'Enter keyword';
  //   this.input.maxLength = 30;

    
  // }

  // search(value, notes) {

  //   for (var i = 0; i < notes.length; i++) {
  //     const item = this.notes[i];

  //     var t_index = item.title.toLowerCase().indexOf(value.toLowerCase());
  //     var d_index = item.description.toLowerCase().indexOf(value.toLowerCase());

  //     if (t_index !== -1 || d_index !== -1) {
  //       item.self.style.display = '';
  //       // item.self.sort_button.disabled = true;
  //       // item.self.sort_button.setAttribute("disabled", "disabled");
  //     } else {
  //       item.self.style.display = 'none';
  //       // item.self.sort_button.disabled = false;
  //       // item.self.sort_button.removeAttribute("disabled");
  //     }
  //   }

  // }

  // cancelSearching() {

  // }
}