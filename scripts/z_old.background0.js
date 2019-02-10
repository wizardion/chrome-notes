/**
 * Created by Alexander on 02/11/2015.
 */
var _database = null;

//----------------------------------------------------------------------------------------------------
window.onload = function(){
    _database = openDatabase("Notes", "0.1", "A list of to do items.", 200000);

    _database.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS Notes (ID INTEGER PRIMARY KEY, Title TEXT, Description TEXT, DisplayOrder UNSIGNED INTEGER, Time REAL)");
    });
}

//----------------------------------------------------------------------------------------------------
function loadNotes(complete_event) {
    var notes = [];

    _database.transaction(function(tx) {
        tx.executeSql("SELECT * FROM Notes ORDER BY DisplayOrder ASC", [],
            function(tx, result) {
                for(var i = 0; i < result.rows.length; i++) {
                    notes.push({id: result.rows.item(i)['ID'], title: result.rows.item(i)['Title'], description:result.rows.item(i)['Description']});
                }
                complete_event(notes);
        }, null);
    });
}

//----------------------------------------------------------------------------------------------------
function saveNote(note) {
    var sql = "UPDATE Notes SET Title=?, Description=?, Time=? WHERE ID=?";
    var data = [note.title, note.description, new Date().getTime(), note.id];

    if(note != null){
        _database.transaction(function(tx) { tx.executeSql(sql, data); });
    }
}


/*
 var _database = openDatabase("Notes", "0.1", "A list of to do items.", 200000);

 if(!_database){
 alert("Failed to connect to database.");
 return;
 }

 _database.transaction(function(tx) {
 tx.executeSql("DROP TABLE Notes", [], null, null);
 });

 _database.transaction(function(tx) {
 tx.executeSql("SELECT COUNT(*) FROM Notes", [],
 function (result) { alert('Works') },
 function (tx, error) { tx.executeSql("CREATE TABLE Notes (ID INTEGER PRIMARY KEY, Title TEXT, Description TEXT, DisplayOrder UNSIGNED INTEGER, Time REAL)", [], null,
 function(tx, error){
 alert(error.message)
 }); }
 )
 });

 _database.transaction(function(tx) {
 tx.executeSql("INSERT INTO Notes (Title, Description, DisplayOrder, Time) values(?, ?, ?, ?)", ["Test 1", "This is a test message.", 1, new Date().getTime()], null, null);
 tx.executeSql("INSERT INTO Notes (Title, Description, DisplayOrder, Time) values(?, ?, ?, ?)", ["Test 2", "This is a test message 2.", 0, new Date().getTime()], null, null);
 });


 _database.transaction(function(tx) { tx.executeSql("SELECT * FROM Notes WHERE ID in (1, 2) ORDER BY DisplayOrder ASC", [],
 function(tx, result) {
 for(var i = 0; i < result.rows.length; i++) {
 document.write('<b>' +
 result.rows.item(i)['ID'] + ". " +
 result.rows.item(i)['Title'] + '</b> - ' +
 result.rows.item(i)['Description'] + " " +
 new Date(result.rows.item(i)['Time']).toString('yyyy-MM-dd') +
 ' <br />'
 );
 }
 }, null);
 });

 */