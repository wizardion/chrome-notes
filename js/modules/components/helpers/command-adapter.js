class CommandAdapter extends Helper {
  constructor (element, keyCode) {
    super(element, keyCode);
  }

  $getScrollTop(selection) {
    let rage = selection && selection.getRangeAt(0);
    let rect = rage && rage.getBoundingClientRect();
    let y = rect && rect.y;
    let clientHeight = this.$element.parentNode.clientHeight;
    let scrollTop = this.$element.parentNode.scrollTop;
    let offsetTop = this.$element.parentNode.offsetTop;

    if (!y) {
      return scrollTop;
    }

    if (y < 0) {
      return ((scrollTop - Math.abs(y)) - offsetTop) - (clientHeight / 2);
    }

    if (y > clientHeight) {
      return (scrollTop + ((y - offsetTop))) - (clientHeight / 2);
    }

    return scrollTop;
  }

  command(action, selection) {
    let scrollTop = this.$element.parentNode.scrollTop;

    document.execCommand(action);

    this.$element.parentNode.scrollTop = this.$getScrollTop(selection)
  }
}