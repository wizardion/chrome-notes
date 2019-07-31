class ScrollBar {
  constructor(control=new Object, options=null) {
    this.control = control;
    this.thumb = document.createElement('div');
    this.interval = null;
    this.freezeScrolling = false;

    this.thumb.style.visibility = 'hidden';
    this.thumb.style.top = 0;

    this.thumb.classList.add('scroll');
    this.control.parentNode.appendChild(this.thumb);

    if (options) {
      this.thumb.style.background = options.background;
    }

    this.control.addEventListener('wheel', this.onWheel.bind(this));
    this.control.addEventListener('scroll', this.onScroll.bind(this));

    return control;
  }

  onWheel(e) {
    if(!this.freezeScrolling) {
      var scrollTop = this.control.scrollTop + e.deltaY;
      var max = (this.control.scrollHeight - this.control.offsetHeight);

      scrollTop = scrollTop < max ? scrollTop : max;
      scrollTop = scrollTop > 0? scrollTop : 0;

      if (scrollTop != this.control.scrollTop && 
        ((e.deltaY < 0 && this.control.scrollTop >= 0) || (e.deltaY > 0 && this.control.scrollTop < max))) {
        e.preventDefault();
      }

      this.control.scrollTop += e.deltaY;
    }
  }

  onScroll() {
    var max = this.control.offsetHeight - 1;
    var scrollHeight = (this.control.scrollHeight - this.control.offsetHeight);

    clearInterval(this.interval);

    if (scrollHeight <= 0) {
      this.thumb.style.visibility = 'hidden';
      return;
    }

    var height = parseInt(max / (this.control.scrollHeight / max));
    var top = parseInt(this.control.scrollTop * ((max - height) / scrollHeight));

    this.thumb.style.marginTop = this.control.offsetTop;
    this.thumb.style.height = height;
    this.thumb.style.top = top;

    this.thumb.style.visibility = '';

    this.interval = setTimeout(function(){
      this.thumb.style.visibility = 'hidden';
    }.bind(this), 1750);
  }
}