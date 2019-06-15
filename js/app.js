// window.addEventListener('load', function(){
document.addEventListener('DOMContentLoaded', function(){
  var editorControlls = document.getElementById('editor-controlls');

  var notes = new SimpleNotes({
    back: document.getElementById('to-list'),
    add: document.getElementById('add-note'),
    delete: document.getElementById('delete-note'),
    listView: document.getElementById('list-view'),
    listItems: document.getElementById('list-items'),
    detailsView: document.getElementById('details-view'),
    title: document.getElementById('title-note'),
    description: document.getElementById('description-note'),

    search: document.getElementById('search-button'),
    searchInput: document.getElementById('search-notes'),
    listControls: document.getElementById('list-controls'),
    
    editorControlls: editorControlls.getElementsByClassName('button'),
    content: document.getElementById('content')
  });

});