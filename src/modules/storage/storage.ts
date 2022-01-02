export default class Storage {
  private static keys: {[key: string]: boolean} = {};

  public static set(key: string, value: (string|number|object), permament: boolean = false) {
    if (!value && value !== 0) {
      return this.remove(key);
    }

    if (permament && !this.keys[key]) {
      this.keys[key] = true;
    }

    localStorage.setItem(key, value.toString());
  }

  public static get(key: string, permament: boolean = false): string {
    if (permament && !this.keys[key]) {
      this.keys[key] = true;
    }

    return localStorage.getItem(key);
  }

  public static clear() {
    var keys: string[] = Object.keys(localStorage);

    for(let i = 0; i < keys.length; i++) {
      const key: string = keys[i];

      if (!this.keys[key]) {
        localStorage.removeItem(key);
      }
    }
  }

  public static remove(key: string) {
    localStorage.removeItem(key);
    delete this.keys[key];
  }
}
