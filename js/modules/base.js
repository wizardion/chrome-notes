class Module {
  constructor() {
    this.$busy = false;
  }

  /**
   * Is Busy.
   *
   * @return {boolean}
   * Returns the status of sorting process.
   */
  get busy() {
    return this.$busy;
  }

  /**
   * @param {*} value
   * The passed in value.
   * 
   * @throws {Error}
   * Inconditionally
   */
  set busy(value) {
    throw new Error(`The readOnly property cannot be written. ${value} was passed.`);
  }

  /**
   * Start.
   * 
   * @param {*} pageY, element, notes
   * Starts sorting
   */
  start() {}
}