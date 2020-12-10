class ScrollBar {
  constructor(control=new Object, options=null) {
    this.control = control;

    this.control.classList.add('hidden-scroll');
    this.control.addEventListener('scroll', this.$onScroll.bind(this));
    this.control.scrollTo = this.$scrollTo.bind(this);

    return this.control;
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

  $onScroll() {
    this.control.classList.remove('hidden-scroll');
    clearInterval(this.interval);

    this.interval = setTimeout(function(){
      this.control.classList.add('hidden-scroll');
    }.bind(this), 1750);
  }
}