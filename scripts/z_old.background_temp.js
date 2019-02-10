/**
 * Created by Alexander on 02/14/2015.
 */

var _loaded = false;
var _database = openDatabase("Notes", "0.1", "A list of to do items.", 200000);

var main = {
    loadNotes: function(complete_event){
        var notes = [];
        // migrate();

        _database.transaction(function(tx) {
            tx.executeSql("SELECT * FROM Notes ORDER BY DisplayOrder ASC", [],
                function(tx, result) {
                    for(var i = 0; i < result.rows.length; i++) {
                        notes.push({
                                ID: result.rows.item(i)['ID'],
                                Title: result.rows.item(i)['Title'],
                                Description:result.rows.item(i)['Description'],
                                DisplayOrder:result.rows.item(i)['DisplayOrder'],
                                Time:result.rows.item(i)['Time']
                            });
                    }
                    if(_loaded == false){
                        // setTimeout(function(){ complete_event(notes); }, 1000);
                        complete_event(notes);
                        _loaded = true;
                    } else {
                        complete_event(notes);
                    }

                }, null);
        });
    },
    //----------------------------------------------------------------------------
    saveNote: function(item, key){
        var sql = "UPDATE Notes SET Title=?, Description=?, DisplayOrder=?, Time=? WHERE ID=?";
        var data = [item.Title, item.Description, item.Order, item.Time, item.ID];

        if(key != null){
            sql = "UPDATE Notes SET " + key + "=? WHERE ID=?";
            data = [item[key], item.ID];
        }

        _database.transaction(function(tx) { tx.executeSql(sql, data); });
    },
    //----------------------------------------------------------------------------
    saveNote0: function(note){
        var sql = "UPDATE Notes SET Title=?, Description=?, DisplayOrder=?, Time=? WHERE ID=?";
        var data = [note.Title, note.Description, note.Order, note.Time, note.ID];

        if(note != null){
            _database.transaction(function(tx) { tx.executeSql(sql, data); });
        }
    },
    //----------------------------------------------------------------------------
    addNote: function(note, complete_event){
        var sql = "INSERT INTO Notes(Title, Description, DisplayOrder, Time) VALUES(?,?,?,?)";
        var data = [note.Title, note.Description, note.Order, note.Time];

        if(note != null){
            _database.transaction(function(tx) { tx.executeSql(sql, data, function(tx, data){
                complete_event(data.insertId);
            }); });
        }
    },
    //----------------------------------------------------------------------------
    removeNote: function(id){
        var sql = "DELETE FROM Notes WHERE ID = ?";
        var data = [id];

        _database.transaction(function(tx) { tx.executeSql(sql, data); });
    }
}

//----------------------------------------------------------------------------
function migrate(){
    _database.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS Notes (ID INTEGER PRIMARY KEY, Title TEXT, Description TEXT, DisplayOrder UNSIGNED INTEGER, Time REAL)");
    });

    if(localStorage.notes){
        var notes = fromString(localStorage.notes);
        for(var i = 0; i < notes.length; i++){
            notes[i].Order = i;
            notes[i].Time = new Date().getTime();
            main.addNote(notes[i], function(){});
        }
        localStorage.removeItem("notes");
        localStorage.removeItem("selectedID");
    }
}

//----------------------------------------------------------------------------------------------------
function fromString(text) {
    var matches = text.match(/[^\0]+/g);
    var result = [];

    for(var i = 0; i < matches.length; i++){
        var values = matches[i].match(/[^\f]+/g);
        values[1] = (!values[1])? "" : values[1];
        result.push({Title: values[0], Description:values[1]});
    }
    return result;
}