export function migrate() {
  console.log('migrate', {
    'localStorage': localStorage
  });
}

/* 
//----------------------------------------------------------------------------------------------------
// This is a temporary migration file needs to migrate to the next data structure.
//----------------------------------------------------------------------------------------------------
function migrate() {
  if(localStorage.notes){
    migrate();
  }

  console.log('Migration started...');
  var notes = fromString(localStorage.notes);
  
  for(var i = 0; i < notes.length; i++){
      var note = notes[i];

      note.displayOrder = i;
      note.updated = new Date().getTime();
      main.add(note);
      console.log({title: note.title, description: note.description});
  }

  localStorage.rowId = localStorage.selectedID;
  localStorage.removeItem("notes");
  localStorage.removeItem("selectedID");
  console.log('Migration completed!');
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
//#region testing
function testOldNotes(database) {
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

  database.transaction(function(tx) {
    tx.executeSql('DROP TABLE Notes');
  });
  localStorage.removeItem("rowId");
  console.log('old notes');
}

function trackSave(tracks) {
  localStorage.tracks = tracks? tracks.join(';') : [];
}

function trackGet() {
  return localStorage.tracks? localStorage.tracks.split(';') : [];
}
//#endregion

*/