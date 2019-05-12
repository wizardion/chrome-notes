class SortingHelper {
  constructor(listItems=new Object) {
    this.element = null;
    this.listItems = listItems;
    this.busy = false;

    this.padding = 1;
    this.speed = 70;
    this.customEvents = {};
  }

  /**
   * Is Busy.
   *
   * @return {boolean}
   * Returns the status of sorting process.
   */
  get isBusy() {
    return this.busy;
  }

  /**
   * @param {*} value
   * The passed in value.
   * 
   * @throws {Error}
   * Inconditionally
   */
  set isBusy(value) {
    throw new Error(`The readOnly property cannot be written. ${value} was passed.`);
  }

  /**
   * @param {*} callback
   * The passed in value.
   * 
   * Adds event on update
   */
  set onUpdate(callback) {
    this.customEvents['update'] = callback;
  }

  /**
   * @param {*} callback
   * The passed in value.
   * 
   * Adds event on finish sorting
   */
  set onFinish(callback) {
    this.customEvents['finish'] = callback;
  }

  /**
   * Start.
   * 
   * @param {*} pageY, element, notes
   * Starts sorting
   */
  start(pageY, element, notes) {
    this.element = element;
    this.notes = notes;
    
    var startY = (pageY - this.listItems.offsetTop) + this.listItems.scrollTop;
    this.clientY = startY - this.element.offsetTop;

    var max = this.element.offsetHeight * (this.notes.length - 1);
    this.maxY = this._round(max, this.listItems.scrollHeight - this.element.offsetHeight);

    this.placeholder = this.element.cloneNode(false)
    this.element.style.top = (startY - this.clientY);
    this.listItems.insertBefore(this.placeholder, this.element);

    this.element.classList.add('drag');
    document.body.classList.add('hold');

    this.busy = true;
    this.events = {
      mousemove: this._mousemovehandler.bind(this),
      mouseup: this.end.bind(this),
    }

    document.addEventListener('mousemove', this.events.mousemove);
    document.addEventListener('mouseup', this.events.mouseup);
  }

  /**
   * End.
   * 
   * Ends sorting
   */
  end() {
    var callback = this.customEvents['finish'] || Function.prototype;

    this.notes[this.element.index].self.bulletinSpan.innerText = (this.element.index + 1);
    clearInterval(this.interval);
    callback();

    document.removeEventListener('mousemove', this.events.mousemove);
    document.removeEventListener('mouseup', this.events.mouseup);
  
    this.element.classList.remove('drag');
    document.body.classList.remove('hold');
    this.element.style.top = "";

    this.listItems.insertBefore(this.element, this.placeholder);
    this.listItems.removeChild(this.placeholder);
    
    this.placeholder = null;
    this.customEvents = [];
    this.element = null;
    this.clientY = null;
    this.events = null;
    this.notes = null;
    this.maxY = null;
    callback = null;

    this.busy = false;
  }

  /**
   * Event: OnMouseMove.
   * 
   * @param {*} e
   * Mouse event
   */
  _mousemovehandler(e) {
    var pageY = (e.pageY - this.listItems.offsetTop) + this.listItems.scrollTop;
    var top = this._round(pageY - this.clientY, this.maxY);
    var max = (this.listItems.scrollTop + this.listItems.offsetHeight - this.element.offsetHeight) - 0;
    var min = (this.listItems.scrollTop + this.listItems.offsetTop - this.element.offsetHeight) - 0;

    clearInterval(this.interval);

    if(top >= max && this.element.offsetTop < this.maxY) {
      this._animateUp(e.pageY);
      return;
    }

    if(top <= min && this.element.offsetTop > 0) {
      this._animateDown(e.pageY);
      return;
    }

    this._moveHolder(top);
  }

  /**
   * AnimateUp.
   * 
   * @param {*} mouseY
   * Mouse possition on the whole page
   */
  _animateUp(mouseY) {
    var presure = (mouseY - (this.listItems.offsetHeight + this.listItems.offsetTop - (this.element.offsetHeight - this.clientY))) * 2;
    var speed = this._round(this.speed - presure, this.speed);

    this.listItems.scrollTop++;
    this._moveHolder(((this.listItems.scrollTop + this.listItems.offsetHeight) - 0) - this.element.offsetHeight);

    this.interval = setInterval(function(){
      if(this.element.offsetTop >= this.maxY) {
        clearInterval(this.interval);
        return;
      }

      this.listItems.scrollTop++;
      this._moveHolder(((this.listItems.scrollTop + this.listItems.offsetHeight) - 0) - this.element.offsetHeight);
    }.bind(this), speed);
  }

  /**
   * AnimateDown.
   * 
   * @param {*} mouseY
   * Mouse possition on the whole page
   */
  _animateDown(mouseY) {
    var presure = ((this.listItems.offsetTop + this.clientY) - mouseY) * 2;
    var speed = this._round(this.speed - presure, this.speed);

    this.listItems.scrollTop--;
    this._moveHolder(((this.listItems.scrollTop + this.listItems.offsetTop) - 0) - this.element.offsetHeight);

    this.interval = setInterval(function(){
      if(this.element.offsetTop <= 0) {
        clearInterval(this.interval);
        return;
      }

      this.listItems.scrollTop--;
      this._moveHolder(((this.listItems.scrollTop + this.listItems.offsetTop) - 0) - this.element.offsetHeight);
    }.bind(this), speed);
  }

  /*
   * AnimateDown.
   * 
   * @param {*} y
   * Top possition on the page
   */
  _moveHolder(y) {
    var centerPoint = this.element.offsetTop + this.element.offsetHeight/2;
    var index = this._round(parseInt(centerPoint / this.element.offsetHeight), this.notes.length - 1);
    var scrollTop = this.listItems.scrollTop;

    if(index < this.element.index){
      this.listItems.insertBefore(this.placeholder, this.notes[index].self);
      this._replace(this.element.index, index);
      this.listItems.scrollTop = scrollTop;
    }
  
    if(index > this.element.index){
      this.listItems.insertBefore(this.placeholder, this.notes[index].self.nextSibling);
      this._replace(this.element.index, index);
      this.listItems.scrollTop = scrollTop;
    }

    this.element.style.top = y;
  }

  /*
   * AnimateDown.
   * 
   * @param {*} first, second
   * Replaces first element with the second
   */
  _replace(first, second) {
    var min = (first < second)? first : second;
    var max = (first < second)? second : first;
    var temp = this.notes[first];
    var id = this.notes[this.element.index].id;
    var callback = this.customEvents['update'] || Function.prototype;

    this.notes.splice(first, 1);
    this.notes.splice(second, 0, temp);

    for(var i = min; i <= max; i++){
      const item = this.notes[i];

      if(item.id !== id) {
        item.self.bulletinSpan.innerText = (i + 1);
      }

      item.self.index = i;
      item.displayOrder = i;
      callback(item);
    }
  }

  /*
   * AnimateDown.
   * 
   * @param {*} first, second
   * Rounds the value to the maximum or minimum
   */
  _round(value, max, min=0) {
    value = (value >= max)? max : value;
    value = (value <  min)? min : value;
    return value;
  }
}
