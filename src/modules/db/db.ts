import {INote} from './interfaces';

var database: Database;

function executeSql(sql: string, data: (string | number)[], callback: Function, errorCallback?: Function) {
  if (!database) {
    init();
  }

  database.transaction(function (transaction: SQLTransaction) {
    transaction.executeSql(sql, data, function (tx: SQLTransaction, result: SQLResultSet) {
      callback(result);
    });
  });
}

function init() {
  if (!database) {
    database = window.openDatabase("MyNotes", "0.1", "A list of to do items.", 200000);

    database.transaction(function (tx) {
      var createSQL = `CREATE TABLE IF NOT EXISTS 
      Notes (title TEXT, description TEXT, displayOrder UNSIGNED INTEGER, updated REAL, created REAL)`;
      tx.executeSql(createSQL, null);
    });

    if (localStorage.notes) {
      // migrate();
    }
  }
}

function load(callback: Function, errorCallback?: Function) {
  let sql = 'SELECT rowid as id, * FROM Notes ORDER BY displayOrder ASC LIMIT 25';
  executeSql(sql, [], callback, errorCallback);
};

function update(item: INote, callback: Function, key?: string, errorCallback?: Function) {
  var sql = 'UPDATE Notes SET title=?, description=?, displayOrder=?, updated=? WHERE rowid=?';
  var data = [item.title, item.description, item.displayOrder, item.updated, item.id];

  executeSql(sql, data, callback, errorCallback);
};

function add(item: INote, callback: Function, errorCallback?: Function) {
  var sql = 'INSERT INTO Notes(title, description, displayOrder, updated, created) VALUES(?,?,?,?,?)';
  var data = [item.title, item.description, item.displayOrder, item.updated, item.updated];

  executeSql(sql, data, callback, errorCallback);
};

function remove(id: number, callback: Function, errorCallback?: Function) {
  var sql = 'DELETE FROM Notes WHERE rowId = ?';
  var data = [id];

  executeSql(sql, data, callback, errorCallback);
};

export default {
  init: init,
  load: load,
  add: add,
  update: update,
  remove: remove,
};