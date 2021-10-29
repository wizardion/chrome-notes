export default class Storage {
  private static keys: {[key: string]: boolean} = {};

  public static set(key: string, value: (string|number|object), permament: boolean = false) {
    if (!value && value !== 0) {
      return this.remove(key);
    }

    if (!permament && !this.keys[key]) {
      this.keys[key] = true;
    }

    localStorage.setItem(key, value.toString());
  }

  public static get(key: string, permament: boolean = false): string {
    if (!permament && !this.keys[key]) {
      this.keys[key] = true;
    }

    return localStorage.getItem(key);
  }

  public static clear() {
    for(let key in this.keys) {
      this.remove(key);
    }
  }

  public static remove(key: string) {
    localStorage.removeItem(key);
    delete this.keys[key];
  }
}
