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
      var createSQL = `CREATE TABLE IF NOT EXISTS 
      Notes (title TEXT, description TEXT, displayOrder UNSIGNED INTEGER, updated REAL, created REAL)`;
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

    batchSql = [];
  });
}

function load(callback: Function, errorCallback?: Function) {
  let sql = 'SELECT rowid as id, * FROM Notes ORDER BY displayOrder ASC LIMIT 30';
  execTransaction(sql, [], callback, errorCallback);
};

function update(item: INote, callback?: Function, errorCallback?: Function) {
  var sql = 'UPDATE Notes SET title=?, description=?, displayOrder=?, updated=? WHERE rowid=?';
  var data = [item.title, item.description, item.displayOrder, item.updated, item.id];

  execTransaction(sql, data, callback, errorCallback);
};

function add(item: INote, callback?: Function, errorCallback?: Function) {
  var sql = 'INSERT INTO Notes(title, description, displayOrder, updated, created) VALUES(?,?,?,?,?)';
  var data = [item.title, item.description, item.displayOrder, item.updated, item.updated];

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

function saveBatch(callback?: Function, errorCallback?: Function) {
  execBatchTransaction(callback, errorCallback);
}

export default {
  init: init,
  load: load,
  add: add,
  update: update,
  setOrder: setOrder,
  saveBatch: saveBatch,
  remove: remove,
};