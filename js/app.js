// window.addEventListener('load', function(){
document.addEventListener('DOMContentLoaded', function(){
  var content = document.getElementById('content');

  content = new ScrollBar(content, {background: '#D6D6D6'});

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
    listControls: document.getElementById('list-controls')
  });

});