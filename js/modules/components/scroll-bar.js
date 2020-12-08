class ScrollBar {
  constructor(control=new Object, options=null) {
    this.control = control;
    // this.thumb = document.createElement('div');
    // this.interval = null;
    // this.freezeScrolling = false;
    // this.$enableAnimations = localStorage.enableAnimations !== 'true';

    // this.thumb.style.visibility = 'hidden';
    // this.thumb.style.top = 0;

    // this.thumb.classList.add('scroll');
    // this.control.parentNode.appendChild(this.thumb);

    // if (options && options.background) {
    //   this.thumb.style.background = options.background;
    // }

    // if (options && options.wheel === true) {
    //   this.control.addEventListener('wheel', this.$onWheel.bind(this));
    // }

    this.control.classList.add('hidden-scroll');
    this.control.addEventListener('scroll', this.$onScrollNew.bind(this));

    control.scrollTo = this.$scrollTo.bind(this);

    return control;
  }

  $scrollTo(top) {
    if (this.$enableAnimations) {
      this.control.scrollTop = top;
    } else {
      this.$scrollSmoothTo(Math.floor(top));
    }
  }

  $scrollSmoothTo(top) {
    var isMovingUp = this.control.scrollTop > top;
    var y = this.control.scrollTop - top;
    var scrollTop = Math.floor(this.control.scrollTop);

    if (this.$timeout) {
      clearInterval(this.$timeout);
    }

    if (this.control.scrollTop !== top) {
      this.$timeout = setInterval(function () {
        y = isMovingUp ? Math.max(Math.floor(y / 2), 1) : Math.min(Math.round(y / 2), -1);
        scrollTop -= y;

        if (scrollTop === top) {
          clearInterval(this.$timeout);
        }

        this.control.scrollTop = scrollTop;
      }.bind(this), 15);
    }
  }

  $onWheel(e) {
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

  $onScroll() {
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

  $onScrollNew() {
    clearInterval(this.interval);
    
    this.control.classList.remove('hidden-scroll');

    this.interval = setTimeout(function(){
      this.control.classList.add('hidden-scroll');
    }.bind(this), 1750);
  }
}