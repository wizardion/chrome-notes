class Helper {
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
}