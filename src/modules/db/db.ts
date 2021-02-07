import {INote} from './interfaces';

interface IBatchUpdate {
  sqlStatement?: string,
  data?: ObjectArray,
}

var database: Database;
var batchSql: IBatchUpdate[] = [];

function init() {
  if (!database) {
    database = window.openDatabase("MyNotes", "0.1", "A list of to do items.", 200000);
    database.transaction(function (tx) {
      var createSQL = 'CREATE TABLE IF NOT EXISTS Notes' + 
                      '(title TEXT, description TEXT, displayOrder UNSIGNED INTEGER, sync BOOLEAN NOT NULL,' + 
                      ' view BOOLEAN NOT NULL updated REAL, created REAL)';
      tx.executeSql(createSQL, null);
    });

    if (localStorage.notes) {
      // migrate();
    }
  }
}

function executeSql(tx: SQLTransaction, sql: string, data: ObjectArray,
  callback?: Function, errorCallback?: Function) {
  tx.executeSql(sql, data, (tx: SQLTransaction, result: SQLResultSet) => {
    if (callback) {
      callback(result);
    }
  }, (tx: SQLTransaction, error: SQLError) => {
    if (errorCallback) {
      errorCallback(error);
    }
    console.error(error.code, error.message);
    return true;
  });
}

function execTransaction(sql: string, data: ObjectArray, callback?: Function, errorCallback?: Function) {
  if (!database) {
    init();
  }

  database.transaction(function (transaction: SQLTransaction) {
    executeSql(transaction, sql, data, callback, errorCallback);
  });
}

function execBatchTransaction(callback?: Function, errorCallback?: Function) {
  if (!database) {
    init();
  }

  database.transaction(function (transaction: SQLTransaction) {
    batchSql.forEach((row: IBatchUpdate) => {
      executeSql(transaction, row.sqlStatement, row.data, callback, errorCallback);
    });

    batchSql.splice(0);
  });
}

function load(callback: Function, errorCallback?: Function) {
  let sql = 'SELECT rowid as id, * FROM Notes ORDER BY displayOrder ASC';
  execTransaction(sql, [], callback, errorCallback);
};

function update(item: INote, callback?: Function, errorCallback?: Function) {
  var sql = 'UPDATE Notes SET title=?, description=?, displayOrder=?, sync=?, view=?, updated=? ' + 
            'WHERE rowid=?';
  var data = [item.title, item.description, item.displayOrder, item.sync, item.view, item.updated, item.id];

  execTransaction(sql, data, callback, errorCallback);
};

function add(item: INote, callback?: Function, errorCallback?: Function) {
  var sql = 'INSERT INTO Notes(title, description, displayOrder, sync, view, updated, created) ' + 
            'VALUES(?,?,?,?,?,?,?)';
  var data = [
    item.title, item.description, item.displayOrder, item.sync, item.view, item.updated, item.updated
  ];

  execTransaction(sql, data, callback, errorCallback);
};

function remove(id: number, callback?: Function, errorCallback?: Function) {
  var sql = 'DELETE FROM Notes WHERE rowId = ?';
  var data = [id];

  execTransaction(sql, data, callback, errorCallback);
};

function setOrder(item: INote) {
  batchSql.push({
    sqlStatement: 'UPDATE Notes SET displayOrder=? WHERE rowid=?',
    data: [item.displayOrder, item.id]
  });
};

function saveQueue(errorCallback?: Function) {
  execBatchTransaction(null, errorCallback);
}

export default {
  init: init,
  load: load,
  add: add,
  update: update,
  setOrder: setOrder,
  saveQueue: saveQueue,
  remove: remove,
};