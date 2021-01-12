import {Base} from './modules/notes/base';
import {IControls} from './modules/notes/controls';
import './styles/style.scss';
// import {DbNote} from './modules/db/note'

// var editor = document.getElementById('editor');

// DbNote.loadAll(function (notes: DbNote[]) {
//   for (let i = 0; i < notes.length; i++) {
//     let div = document.createElement('div');
//     const note = notes[i];

//     div.innerText = `${note.id} - ${note.title}`;
//     editor.appendChild(div);
//   }

//   let first = notes[0];

//   first.save();
// });

var controls:IControls = {
  // add: document.getElementById('editor')
};

var editor = new Base(controls);

/* 
back: document.getElementById('to-list'),
add: document.getElementById('add-note'),

delete: document.getElementById('delete-note'),
listView: document.getElementById('list-view'),
listItems: document.getElementById('list-items'),
detailsView: document.getElementById('details-view'),
title: document.getElementById('title-note'),
description: document.getElementById('description-note'),
// description: editor,

search: document.getElementById('search-button'),
searchInput: document.getElementById('search-notes'),
listControls: document.getElementById('list-controls'),

editorControlls: editorControlls.getElementsByClassName('button'),
content: document.getElementById('content')
*/