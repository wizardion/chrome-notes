// window.addEventListener('load', function(){
document.addEventListener('DOMContentLoaded', function(){
  // var editor = new Editor('.fast-note[0]');
  // var details = new HtmlElement('.details-view[0]');

  // setTimeout(function(){
  //   var notes = new SimpleNotes({
  //     back: new HtmlElement('.back[0]'),
  //     add: new HtmlElement('.add-note[0]'),
  //     delete: new HtmlElement('.delete[0]'),
  //     // template: new HtmlElement('.list-item[0]'),
  //     listView: new HtmlElement('.list-view[0]'),
  //     listItems: new HtmlElement('.list-items[0]'),
  //     detailsView: new HtmlElement('.details-view[0]'),
  //     title: new HtmlElement('.title[0]'),
  //     description: new HtmlElement('.fast-note[0]')
  //   });
  // }, 45);

  // var notes = new SimpleNotes({
  //   back: new HtmlElement('.back[0]'),
  //   add: new HtmlElement('.add-note[0]'),
  //   delete: new HtmlElement('.delete[0]'),
  //   // template: new HtmlElement('.list-item[0]'),
  //   listView: new HtmlElement('.list-view[0]'),
  //   listItems: new HtmlElement('.list-items[0]'),
  //   detailsView: new HtmlElement('.details-view[0]'),
  //   title: new HtmlElement('.title[0]'),
  //   description: new HtmlElement('.fast-note[0]')
  // });

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

    // templates: {
    //   new: document.getElementById('new-note'),
    // }
  });


  // var something = function (a, b, c) {
  //   console.log(a, b, c);
  // };

  // // a binding of something with 3 defined args
  // var b = something.bind(this, 1, 2, 3);

  // // call b
  // b(213);




});



//     $('#notes', true).Notes({
//         list_view: $(".list-view")[0],
//         details_view: $(".details-view")[0],
//         item_template: $(".list-item")[0],
//         list_items: $(".list-items")[0],
//         title_span: $(".title")[0],
//         description_input: $(".fast-note")[0],
//         back_button: $(".back")[0],
//         add_button: $(".add-note")[0],
//         delete_button: $(".delete")[0],
//         search_button: $(".search-button")[0],
//         loading: $(".loading")[0]
//     });
// }