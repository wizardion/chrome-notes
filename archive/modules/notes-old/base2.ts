// import { ICachedNote, IListView, INewNoteView, INoteView, Intervals, ISTNote } from './components/interfaces';
// import { DbNote } from '../db/note';
// import { loadAll, parseList } from '../db/provider';
// import { Note } from './components/note';
// import { Validator } from './components/validation';
// import { Sorting } from './components/sorting';
// import { ScrollListener } from './components/scrolling';
// import { NodeHelper } from './components/node-helper';
// import storage from '../storage/storage';


// export class Base {
//   private _selected?: Note;

//   protected listView: IListView;
//   protected noteView: INoteView;
//   protected newView: INewNoteView;

//   protected notes: Note[];
//   protected intervals: Intervals;

//   constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
//     this.notes = [];
//     this.intervals = {};
//     this._selected = null;
    
//     this.listView = listView;
//     this.noteView = noteView;
//     this.newView = newView;
//   }

//   public async init(list?: DbNote[]) { }

//   private event(e: MouseEvent) {
//     e.preventDefault();
//   }

//   select(item: Note) {}
// }
