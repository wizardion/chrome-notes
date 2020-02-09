class Helper {
  constructor (element, keyCode) {
    this.$element = element;
    this.$keyCode = keyCode;
  }

  /**
   * Returns the keyCode the handles this adapter.
   */
  key() {
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
}