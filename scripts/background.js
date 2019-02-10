var main = {
  database: null
};

// window.addEventListener('load', function(){
document.addEventListener('DOMContentLoaded', function(){
  //----------------------------------------------------------------------
  // console.log('load background');

  // var traks = trackGet();

  // traks.push('load background: ' + traks.length);

  // trackSave(traks);

  main.database = openDatabase("MyNotes", "0.1", "A list of to do items.", 200000);

  // console.log(main.database);
  //----------------------------------------------------------------------

  main.database.transaction(function(tx) {
    tx.executeSql("CREATE TABLE IF NOT EXISTS Notes (Title TEXT, Description TEXT, DisplayOrder UNSIGNED INTEGER, Time REAL)");
  });

  if(localStorage.notes){
    // migrate();
  }

  // main.init(function(notes){
  //   if(notes.length < 100) {
  //     var counter = 1000;

  //     for (let index = counter; index < (counter + 3000); index++) {
  //       var number = (index + 1);

  //       const element = {
  //         // note.Title, note.Description, note.Order, note.Time
  //         title: 'This is a note number ' + number,
  //         description: 'This is a note decription number ' + number,
  //         order: number + counter,
  //         time: new Date().getTime(),
  //       };
    
  //       main.add(element, function(id){
  //         console.log({
  //           'id': id
  //         });
  //       });
  //       // console.log(element);
    
  //     }
  //   }
  // });

  // main.init();
  
});

main.init = function(callback = function(){}){
  var notes = [];

  main.database.transaction(function(tx) {
    tx.executeSql("SELECT rowid as Id, * FROM Notes ORDER BY DisplayOrder ASC LIMIT 20", [], function(tx, result) {
    // tx.executeSql("SELECT rowid as Id, * FROM Notes ORDER BY DisplayOrder ASC", [], function(tx, result) {
      for(var i = 0; i < result.rows.length; i++) {
        notes.push({
          id: result.rows.item(i)['Id'],
          title: result.rows.item(i)['Title'],
          description: result.rows.item(i)['Description'],
          order: result.rows.item(i)['DisplayOrder'],
          time: result.rows.item(i)['Time']
        });
      }

      callback(notes);
    }, null);
  });
};

main.update = function(item, key, callback = function(){}){
  var sql = 'UPDATE Notes SET Title=?, Description=?, DisplayOrder=?, Time=? WHERE rowid=?';
  var data = [item.title, item.description, item.order, item.time, item.id];

  if(key != null){
    sql = 'UPDATE Notes SET ' + key + '=? WHERE rowid=?';
    data = [item[key], item.id];
  }

  console.log({
    'sql': sql.replace(/\?/gi, data),
    // 'data': item,
  });

  // main.database.transaction(function(tx) { tx.executeSql(sql, data, function(tx, data){
  //   callback(data.rowsAffected);
  // }); });
};

// main.update2 = function (id, key, value) {
//   sql = 'UPDATE Notes SET ' + key + '=? WHERE rowid=?';
//   data = [value, id];

//   console.log({
//     'update2.data': data
//   });

//   _database.transaction(function (tx) { tx.executeSql(sql, data); });
// };

main.add = function(note, callback = function(){}, error = function(){}){
  var sql = "INSERT INTO Notes(Title, Description, DisplayOrder, Time) VALUES(?,?,?,?)";
  var data = [note.title, note.description, note.order, note.time];

  console.log({
    'sql': sql.replace(/\?/gi, data)
  });

  // main.database.transaction(function (tx) { tx.executeSql(sql, data, function (tx, data) {
  //     callback(data.insertId);
  // }, function(){
  //   callback(data);
  // }); });


  // var promise = {
  //   onSucceed: null,
  //   onError: null,
  //   then: function (call, error) {
  //     console.log({
  //       'then': call
  //     });

  //     if (call) {
  //       console.log('this.succeed');
  //       this.onSucceed = call;
  //     }

  //     if (error) {
  //       this.onError = error;
  //     }

  //     this.error = this.then;

  //     return this;
  //   }
  // }

  // // main.database.transaction(function (tx) { tx.executeSql(sql, data, function (tx, data) {
  // //     callback(data.insertId);
  // // }); });

  // setTimeout(function () {
  //   promise.onSucceed(123);
  //   console.log('call succeed!!!');

  //   setTimeout(function () {
  //     promise.onError(123);
  //   }, 300);

  // }, 300);
};

main.remove = function (id, callback = function(){}){
  var sql = "DELETE FROM Notes WHERE rowId = ?";
  var data = [id];

  console.log({
    'sql': sql.replace(/\?/gi, data)
  });

  // main.database.transaction(function(tx) { tx.executeSql(sql, data, function(tx, data){
  //   callback(data.rowsAffected);
  // }); });
};
