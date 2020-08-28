class Helper {
  static _lineHeight = 0;

  constructor (element, keyCode) {
    this.$element = element;
    this.$keyCode = keyCode;
  }

  /**
   * Key Code.
   *
   * @return {number}
   * Returns the key code that handles this adapter..
   */
  get keyCode() {
    return this.$keyCode;
  }

  /**
   * @param {*} selection
   * 
   * Returns the executed test of selection
   */
  test(selection) {}

  /**
   * Executes command
   */
  // command() {}

  /**
   * @param {*} selection
   * 
   * Replaces selection into HTML element
   */
  exec(selection) {}

  /**
   * Static Internal method: GetCoordinates.
   * 
   * @param {*} element
   * @param {*} selected as window.selection
   * 
   * Gets the Coordinates of cursor.
   */
  static $getCoordinates(element, selected) {
    let selection = selected || window.getSelection();
    let rage = selection && selection.getRangeAt(0);
    let rect = rage && rage.getBoundingClientRect();
    this._lineHeight = this._lineHeight || element.style.lineHeight || parseInt(window.getComputedStyle(element)['lineHeight']);

    return {
      y: rect && rect.y || 0,
      height: rect? (this._lineHeight - rect.height) : 0,
      lineHeight: this._lineHeight
    };
  }

  /**
   * Static Public method: GetScrollTop.
   * 
   * @param {*} element
   * @param {*} selection as window.selection
   * @param {*} scrollTop
   * 
   * Gets the scrollTop within the client rect of the element.
   */
  static getScrollTop(element, selection, scrollTop) {
    let rect = this.$getCoordinates(element, selection);
    let clientHeight = element.parentNode.clientHeight;
    let offsetTop = element.parentNode.offsetTop + rect.height;

    if (!rect.y || !rect.height) {
      return scrollTop;
    }

    if (rect.y < offsetTop) {
      let top = (rect.y < 0)? ((scrollTop - (rect.y * -1)) - offsetTop) : (scrollTop - (offsetTop - rect.y));
      return Math.max(0, top);
    }

    if (rect.y > (clientHeight + offsetTop - rect.lineHeight)) {
      let top = (scrollTop - (offsetTop - rect.y)) - (clientHeight - rect.lineHeight);
      return Math.min(element.parentNode.scrollHeight - clientHeight, top);
    }

    return scrollTop;
  }
}