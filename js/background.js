var main = {
  database: null,
  events: []
};

// window.addEventListener('load', function(){
  
document.addEventListener('DOMContentLoaded', function(){
  main.database = openDatabase("MyNotes", "0.1", "A list of to do items.", 200000);
  main.database.transaction(function(tx) {
    var createSQL = 'CREATE TABLE IF NOT EXISTS Notes (title TEXT, description TEXT, displayOrder UNSIGNED INTEGER, updated REAL, created REAL)'; 
    tx.executeSql(createSQL, null, function(tx, data){}, function(tx, error){
      console.log({
        'error.code': error.code,
        'error.message': error.message
      });
    });
  });

  if(localStorage.notes){
    migrate();
  }
//#region TEST
//#region test tracking
  //----------------------------------------------------------------------
  // console.log('load background');

  // var traks = trackGet();

  // traks.push('load background: ' + traks.length);

  // trackSave(traks);

  // return;

  // console.log(main.database);
  //----------------------------------------------------------------------
  //#endregion


//#region old notes
  // testOldNotes(main.database);
//#endregion

//#region test new items
// ----------------------------------------------------------------------------------------------------
// Testing
// ----------------------------------------------------------------------------------------------------
  // var dict = {
  //   1: 'One',
  //   2: 'Two',
  //   3: 'Three',
  //   4: 'Four',
  //   5: 'Five',
  //   6: 'Six',
  //   7: 'Seven',
  //   8: 'Eight',
  //   9: 'Nine',
  //   10: 'Ten',
  //   11: 'Eleven',
  //   12: 'Twelve',
  // }

  // main.init(function(notes){
  //   if(notes.length < 100) {
  //     var startFrom = notes.length;
  //     var count = 12;

  //     for (let index = startFrom; index < (startFrom + count); index++) {
  //       var number = (index + 1);

  //       const element = {
  //         // note.Title, note.Description, note.DisplayOrder, note.Updated
  //         title: 'This is a note number ' + dict[number] || number,
  //         description: 'This is a note decription number ' + dict[number] || number,
  //         displayOrder: number,
  //         updated: new Date().getTime(),
  //       };
    
  //       // main.add(element, function(id){
  //       //   console.log({
  //       //     'id': id
  //       //   });
  //       // });
  //       // console.log(element);
    
  //     }
  //   }
  // });
  // ----------------------------------------------------------------------------------------------------

  // main.init();
//#endregion
//#endregion
});

main.init = function(callback = function(){}){
  var errorHandler = this.events['error'] || function(){};
  var notes = [];

  main.database.transaction(function(tx) {
    tx.executeSql("SELECT rowid as id, * FROM Notes ORDER BY displayOrder ASC LIMIT 18", [], function(tx, result) {
      for(var i = 0; i < result.rows.length; i++) {
        notes.push({
          id: result.rows.item(i)['id'],
          title: result.rows.item(i)['title'],
          description: result.rows.item(i)['description'],
          displayOrder: result.rows.item(i)['displayOrder'],
          updated: result.rows.item(i)['updated'],
          created: result.rows.item(i)['created']
        });
      }

      callback(notes);
    }, function(){
      errorHandler('Oops! Looks like the data is broken.');
    });
  });
};

main.update = function(item, key){
  var sql = 'UPDATE Notes SET title=?, description=?, displayOrder=?, updated=? WHERE rowid=?';
  var data = [item.title, item.description, item.displayOrder, item.updated, item.id];
  var callback = this.events['error'] || function(){};

  if(key != null) {
    sql = 'UPDATE Notes SET ' + key + '=? WHERE rowid=?';
    data = [item[key], item.id];

    // pritSQL(sql, data);
    
    // console.log(`"%c${item[key]}%c"`, 'color: red;', 'color: black;');
    // return;
  }

  console.log(`%c "${data[0]}"`, 'background: transparent; color: red;');

  // main.database.transaction(function(tx) { tx.executeSql(sql, data, function(tx, data){}, function(){
  //   callback('Oops, data not saved! Please try letter.');
  // }); });
};

main.add = function(note, callback = function(){}){
  var sql = "INSERT INTO Notes(title, description, displayOrder, updated, created) VALUES(?,?,?,?,?)";
  var data = [note.title, note.description, note.displayOrder, note.updated, note.updated];
  var error = this.events['error'] || function(){};

  main.database.transaction(function (tx) { tx.executeSql(sql, data, function (tx, data) {
    callback(data.insertId);
  }, function(tx, data){
    error('Oops! Note not added! Please try letter.');
  }); });
};

main.remove = function (id, callback = function(){}){
  var sql = "DELETE FROM Notes WHERE rowId = ?";
  var data = [id];

  main.database.transaction(function(tx) { tx.executeSql(sql, data, function(tx, data){
    callback(data.rowsAffected);
  }); });
};

main.addEventListener = function(key, callback) {
  this.events[key] = callback;
};

function pritSQL(sql, data) {
  var sqlText = sql;
  for(var i=0; i < data.length; i++) {
    let value = data[i];

    if (typeof(value) === 'string') {
      value = `'${value}'`;
    }

    sqlText = sqlText.replace(/\?/, value);
  }
  console.log();
  console.log(`%c ${sqlText}`, 'background: white; color: red;');
}