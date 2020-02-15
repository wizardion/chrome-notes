class CommandAdapter extends Helper {
  constructor (element, keyCode, correct) {
    super(element, keyCode);

    this.$lineHeight = this.$element.style.lineHeight || parseInt(window.getComputedStyle(this.$element)['lineHeight']);
    this.$correct = correct;
  }

  $getCoordinates(select) {
    let selection = select || window.getSelection();
    let rage = selection && selection.getRangeAt(0);
    let rect = rage && rage.getBoundingClientRect();

    return {
      y: rect && rect.y || 0,
      height: rect? (this.$lineHeight - rect.height) : 0
    };
  }

  $getScrollTop(selection, scrollTop) {
    let rect = this.$getCoordinates(selection);
    let clientHeight = this.$element.parentNode.clientHeight;
    let offsetTop = this.$element.parentNode.offsetTop + rect.height;

    if (!rect.y || !rect.height) {
      return scrollTop;
    }

    if (rect.y < offsetTop) {
      let top = ((rect.y < 0)? ((scrollTop - (rect.y * -1)) - offsetTop) : scrollTop - (offsetTop - rect.y));
      return Math.max(0, top - (clientHeight / 2) + rect.height);
    }

    if (rect.y > clientHeight) {
      let top = (scrollTop + ((rect.y - offsetTop))) - ((clientHeight / 2) - rect.height);
      return Math.min(this.$element.parentNode.scrollHeight - clientHeight, top);
    }

    return scrollTop;
  }

  command(action, selection, value) {
    let scrollTop = this.$element.parentNode.scrollTop;

    if(action === 'insertHTML' || action === 'insertText') {
      document.execCommand(action, false, value);
    } else {
      document.execCommand(action);
    }

    this.$element.parentNode.scrollTop = scrollTop;

    if(this.$correct) {
      this.$element.parentNode.scrollTop = this.$getScrollTop(selection, scrollTop);
    }
  }
}
