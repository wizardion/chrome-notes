var initTime = new Date();
console.log('init: ' + (new Date() - initTime) + 'ms')

var image = new Image();
var image2 = new Image();

var c;
var ctx;


// image.onload = function() {
//   // ctx.drawImage(image, 20, 20);
//   console.log('loaded');
// };
image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAJElEQVR42mNgGAWjYBQMXsCxbNp/cvFocI0G12hwjYJRMCIBANVlZcjB6F8FAAAAAElFTkSuQmCC";
image2.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAG0lEQVR42mNgGJ6AY9m0/yA8ashgMmRU82AHAHUSMcOJ5OQvAAAAAElFTkSuQmCC";

var m_canvas = document.createElement('canvas');
var m_context = m_canvas.getContext('2d');


var m_canvas2 = document.createElement('canvas');
var m_context2 = m_canvas2.getContext('2d');

class SimpleNotes {
  constructor(controls=new Object) {
    this.notes = [];

    this.controls = {
      back: controls.back,
      add: controls.add,
      delete: controls.delete,
      template: controls.template,
      listView: controls.listView,
      detailsView: controls.detailsView,
      listItems: controls.listItems,
      title: controls.title,
      description: controls.description,
    };
    

    this.background = (chrome && chrome.extension && chrome.extension.getBackgroundPage)? chrome.extension.getBackgroundPage().main : main; /*this.background = main;*/

    console.log('constructor: ' + (new Date() - initTime) + 'ms');
    
    
    // Add events
    // this.event("paste", this.$onPaste.bind(this));

    this.init();
    this.toList();
  }

  init() {
    console.log('loading...: ' + (new Date() - initTime) + 'ms');

    c = document.getElementById("myCanvas");
    ctx = c.getContext("2d");
    // if (this.background.get()) {
    //   setTimeout(function(){
    //     this.controls.listItems.element.innerHTML = this.background.get();
    //   }.bind(this), 1);
    //   console.log('builded!: ' + (new Date() - initTime) + 'ms');
    //   return;
    // }

    this.background.init(function(notes) {
      console.log('loaded!: ' + (new Date() - initTime) + 'ms');

      
      this.notes = notes;
      this.build();
      // initNotes(notes);
      // this.controls.loading.style.display = 'none';

      if(localStorage.Index){
        // shownDetails(localStorage.Index);
      } else {
        // shownAllNotes();
      }

      

    }.bind(this));
  }

  draw() {
    var startBuilding = new Date();

    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
    ctx.drawImage(m_canvas, 0, 0);

    var endBuilding = new Date();
    console.log('drew!: ' + (
      endBuilding - startBuilding
    ) + ' ms.');
  }

  build(event) {
    var e = event || {};
    var notes = this.notes;
    var startBuilding = new Date();
    // console.log('building [' + notes.length + '] notes ...: ' + (startBuilding - initTime) + ' ms');

    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);

    var height = 26;
    var top = 0;
    var start = 0 + top;
    var end = notes.length;
    // var end = (start + (c.clientHeight / height)) < notes.length? (start + (c.clientHeight / height)) : notes.length

    m_canvas.width = c.clientWidth;
    // m_canvas.height = c.clientHeight;
    m_canvas.height = height * notes.length;

    m_canvas2.width = c.clientWidth;
    // m_canvas2.height = height * notes.length ;
    m_canvas2.height = height * notes.length;
    c.height = height * notes.length;

    m_context.beginPath();
    m_context.lineWidth=1;
    m_context.strokeStyle="rgba(7, 166, 152, 0.1)";

    for(var i = start; i < end; i++) {
      var y = (i + 1) * (height - 0.5);

      m_context.moveTo(0.5, (i + 1) * (height - 0.5));
      m_context.lineTo(c.clientWidth + 0.5 , (i + 1) * (height - 0.5));

      console.log(e.layerY);

      if(e.layerY < y && e.layerY > y - (height - 0.5)) {
        
        m_context.fillRect(0.5, y - (height - 0.5), c.clientWidth, height)
      }

      m_context.drawImage(image, 0 + 5, (i * (height - 0.5)));
      m_context.drawImage(image2, (c.clientWidth - 25), ((i + 1) * (height - 0.5) - (height/1.2)));
      
    }

    m_context.stroke();

    
    

    


    // for(var i = start; i < end; i++) {
    //   m_context2.drawImage(m_canvas, 0, (i * height));

    //   // m_context2.font = "15px Sans-Serif";
    //   // m_context2.fillStyle = 'black';
    //   // m_context2.fillText((i + 1) + ". " + notes[i].title, 0 + 35, ((i + 1) * height - (height/3.2)));

    //   // m_context2.font = "11px Sans-Serif";
    //   // m_context2.fillStyle = 'rgb(7, 166, 152)';
    //   // m_context2.fillText(new Date(notes[i].time).toLocale(), (c.clientWidth - 125) + 0, ((i + 1) * height - (height/3)));

      
    // }

    // var draw = function(x=0, y=0) {
      
    // }

    // for(var i = start; i < end; i++) {
    // // for(var i = 0; i < 3; i++) {

    //   ctx.beginPath();
    //   ctx.lineWidth=1;
    //   ctx.strokeStyle="rgba(7, 166, 152, 0.1)";
    //   ctx.rect(-.5, ((i * height) - .5), (c.clientWidth + 1) + .5, height); 
    //   ctx.stroke();

    //   ctx.font = "15px Sans-Serif";
    //   ctx.fillStyle = 'black';
    //   ctx.fillText((i + 1) + ". " + notes[i].title, 35, ((i + 1) * height - (height/3.2)));

    //   ctx.font = "11px Sans-Serif";
    //   ctx.fillStyle = 'rgb(7, 166, 152)';
    //   ctx.fillText(new Date(notes[i].time).toLocale(), c.clientWidth - 95, ((i + 1) * height - (height/3)));

    //   ctx.drawImage(image, 5, ((i + 1) * height - height));
    //   ctx.drawImage(image2, c.clientWidth - 25, ((i + 1) * height - (height/1.2)));

    //   // console.log('draw');


    // }

    var endBuilding = new Date();
    console.log('builded!: ' + (endBuilding - initTime) + ' ms; building time: ' + (
      endBuilding - startBuilding
    ) + ' ms.');
  }

  toList() {
    this.controls.detailsView.hide();
    this.controls.listView.show();
    localStorage.removeItem("Index");
  }

  
}