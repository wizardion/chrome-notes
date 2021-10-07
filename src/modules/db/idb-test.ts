// import {INote} from './interfaces';

var database: IDBDatabase;
var transaction: IDBTransaction;
// var batchSql: IBatchUpdate[] = [];

const customerData = [
  { ssn: "444-44-4444", name: "Bill", age: 35, email: "bill@company.com" },
  { ssn: "555-55-5555", name: "Donna", age: 32, email: "donna@home.org" }
];

function dbError(event: Event) {
  console.error("Database error: " + event.target);
}

function upgradeNeeded(event: Event) {
  console.log('upgradeNeeded');
  // Save the IDBDatabase interface
  // @ts-ignore
  var db:IDBDatabase = event.target.result;
  // @ts-ignore
  var request:IDBOpenDBRequest = event.target;
  var objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('notes')) {
    objectStore = db.createObjectStore("notes", {autoIncrement : true, keyPath: "id",});
  } else {
    objectStore = request.transaction.objectStore('notes');
  }

  if (!objectStore.indexNames.contains('name')) {
    objectStore.createIndex("name", "name", {unique: false});
  }

  if (objectStore.indexNames.contains('order')) {
    objectStore.deleteIndex("order");
  }

  if (!objectStore.indexNames.contains('order')) {
    objectStore.createIndex("order", "order", {unique: false});
  }

  objectStore.transaction.oncomplete = function(event2: Event) {
    var customerObjectStore = db.transaction("notes", "readwrite").objectStore("notes");

    // customerData.forEach(function(customer) {
    //   customerObjectStore.add(customer);
    // });
    console.log('upgradeNeeded.transaction complete');
  };
}

function init() {
  if (!database) {
    var request = indexedDB.open('MyNotes', 5);

    request.onerror = dbError;
    request.onupgradeneeded = upgradeNeeded;

    request.onsuccess = function(event) {
      database = request.result;
      console.log('indexedDB.open success!');

      var transaction:IDBTransaction = database.transaction('notes', "readwrite");

      transaction.oncomplete = function(event) {
        console.log("All done! transaction.oncomplete");
      };

      transaction.onerror = function(event) {
        console.log("transaction error!");
      };

      var objectStore = transaction.objectStore("notes");
      console.log("objectStore:");

      // var index = objectStore.index("name");
      var index = objectStore.index("order");
      // var tr_request = index.getAll(IDBKeyRange.lowerBound("Bill"));
      var tr_request = index.getAll();
      // var tr_request = objectStore.openCursor(IDBKeyRange.lowerBound("Bill"), 'prev');

      // var tr_request = objectStore.get(6);
      // var tr_request = objectStore.getAll(IDBKeyRange.lowerBound("Bill"));
      // var tr_request = objectStore.getAll();
      
      tr_request.onerror = function(event) {
        console.log("request.onerror", event);
      };
      tr_request.onsuccess = function(event) {
        // Do something with the request.result!
        
        // console.log("Name for SSN 444-44-4444 is ",  tr_request.result);
        // @ts-ignore
        // console.log("Name for SSN 444-44-4444 is ",  event.target.result);

        // tr_request.result.forEach(function(item, key) {
        //   item.order = item.order || key
        //   // console.log('key', key + 1);

        //   var requestUpdate = objectStore.put(item);

        //   requestUpdate.onerror = function(event) {console.log('error: update');};
        //   requestUpdate.onsuccess = function(event) {console.log('done: update');};
        // });

        printAll(tr_request.result);

        tr_request.result.forEach(function(item) {
          if (item.id === 3) {
            var r = objectStore.delete(item.id);

            r.onerror = function(event) {console.log('error: update');};
            r.onsuccess = function(event) {console.log('done: update');};
          }
        });
      };

      

      // (() => {
      //   var customer = { ssn: "444-44-4444", name: "Test", age: 35, email: "bill@company.com", order: 1 };
      //   var request = objectStore.add(customer);

      //   request.onsuccess = function(event) {console.log("added", event.target);};
      //   request.onerror = function(event) {console.log("add.error", event.target);};
      // })();

      // customerData.forEach(function(customer) {
      //   console.log('customer', customer);
      //   var request = objectStore.add(customer);
      //   request.onsuccess = function(event) {
      //     // event.target.result === customer.ssn;
      //     console.log("onsuccess", event.target);
      //   };

      //   request.onerror = function(event) {
      //     // event.target.result === customer.ssn;
      //     console.log("onerror", event.target);
      //   };
      // });
    };
  }
}

function printAll(data: object[]) {
  console.table(data);
  // data.forEach((item) => {
  //   console.log(item);
  // });
}

export default {
  init: init
}