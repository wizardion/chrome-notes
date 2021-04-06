export default class Storage {
  public static set(key: string, value: (string|number|object)) {
    if (!value) {
      return this.remove(key);
    }

    localStorage.setItem(key, value.toString());
  }

  public static get(key: string): string {
    return localStorage.getItem(key);
  }

  public static clear() {
    localStorage.clear();
  }

  public static remove(key: string) {
    localStorage.removeItem(key);
  }
}
