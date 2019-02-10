//----------------------------------------------------------------------------------------------------
// This is a temporary migration file needs to migrate to the next data structure.
//----------------------------------------------------------------------------------------------------
function migrate() {
  var notes = fromString(localStorage.notes);
  
  for(var i = 0; i < notes.length; i++){
      var note = notes[i];

      note.order = i;
      note.time = new Date().getTime();
      main.add(note);
  }

  // localStorage.removeItem("notes");
  // localStorage.removeItem("selectedID");

  localStorage.rowId = localStorage.Index;
  localStorage.removeItem("Index");
}

//----------------------------------------------------------------------------------------------------
function fromString(text) {
  var matches = text.match(/[^\0]+/g);
  var result = [];

  for(var i = 0; i < matches.length; i++){
      var values = matches[i].match(/[^\f]+/g);
      values[1] = (!values[1])? "" : values[1];
      result.push({title: values[0], description:values[1]});
  }
  return result;
}

//----------------------------------------------------------------------------------------------------
function toString(a) {
  var result = [];
  for(var i = 0; i < a.length; i++){
      var item = a[i].title + "\f" + a[i].description + "\0";
      result += item;
  }

  return result.toString();
}

//----------------------------------------------------------------------------------------------------
function testFN() {
  var notes = [
    {
      title: 'Test note One',
      description: 'This is a test note'
    },
    {
      title: 'This is a second note',
      description: 'This test of the second note'
    }
  ];

  localStorage.notes = toString(notes);
  localStorage.selectedID = 1;
}

function trackSave(tracks) {
  localStorage.tracks = tracks? tracks.join(';') : [];
}

function trackGet() {
  return localStorage.tracks? localStorage.tracks.split(';') : [];
}