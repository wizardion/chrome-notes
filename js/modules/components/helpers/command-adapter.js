class CommandAdapter extends Helper {
  constructor (element, keyCode, system) {
    super(element, keyCode);

    this.$lineHeight = this.$element.style.lineHeight || parseInt(window.getComputedStyle(this.$element)['lineHeight']);
    this.$system = system;
  }

  /**
   * @param {*} selection
   * @param {*} nodeName
   * 
   * Checks if selection contains a serving HTML element
   */
  isInside(select, nodeName) {
    let selection = select || window.getSelection();
    let node = nodeName && nodeName.split('|') || [this.$nodeName];
    let container = selection.rangeCount > 0 && selection.getRangeAt(0).commonAncestorContainer;

    while(container && container !== this.$element) {
      if(node.indexOf(container.nodeName) >= 0) {
        return container;
      }

      container = container.parentNode;
    }
    return false;
  }

  command(action, selection, value) {
    let scrollTop = this.$element.parentNode.scrollTop;

    if(!this.$system && this.isInside(selection, 'CODE|PRE')) {
      return;
    }

    if(action === 'insertHTML' || action === 'insertText') {
      document.execCommand(action, false, value);
    } else {
      document.execCommand(action);
    }

    this.$element.parentNode.scrollTop = scrollTop;

    if(this.$system) {
      this.$element.parentNode.scrollTop = Helper.getScrollTop(this.$element, selection, scrollTop);
    }
  }
}
