const START = performance.now();

interface ITime {
  page: string,
  name: string,
  spent: number,
  time: number,
  total: number
}

class Tracker {
  private times: ITime[];
  private start: number;

  constructor() {
    this.times = [];
    this.start = null;
  }

  public track(page: string, name: string) {
    var prev = this.times.length ? this.times[this.times.length - 1] : null
    var current = Math.round((performance.now() - START) * 100) / 100;

    if (this.start === null && prev !== null) {
      this.start = prev.total;
    }

    this.times.push({
      page: page,
      name: name,
      spent: Math.round((prev ? current - prev.total : 0) * 100) / 100,
      time: Math.round((this.start ? current - this.start : 0) * 100) / 100,
      total: current,
    });
  }

  print() {
    var columns: string[] = ['#'].concat(this.times.length > 0 ? Object.keys(this.times[0]) : []);
    var sizes: number[] = this.calcSizes(columns);
    var spaces = Array(300).fill(' ').join('');
    var rows: string[] = [''];
    var head = columns.map((name, index) => name + spaces.substr(0, sizes[index] - name.length)).join(' | ');
    var page: string = null;
    
    rows.push(`| ${head} |`);
    rows.push(`--${Array(head.length).fill('-').join('')}--`);

    this.times.forEach((item, index) => {
      var row: string[] = [];
      const strIndex = index.toString();

      row.push(strIndex + spaces.substr(0, sizes[0] - strIndex.length));

      for (let i = 1; i < columns.length; i++) {
        let name: string = item[columns[i] as keyof ITime].toString();

        if (columns[i] === 'page' && page !== name) {
          if (page !== null) {
            rows.push(`··${Array(head.length).fill('·').join('')}··`);
          }

          page = name;
        }

        row.push(name + spaces.substr(0, sizes[i] - name.length));
      }

      rows.push(`| ${row.join(' | ')} |`);
    });

    console.log(rows.join('\n'));
  }

  private calcSizes(columns: string[]): number[] {
    var sizes: number[] = columns.map(name => name.length);

    this.times.forEach((item, index) => {
      const strIndex = index.toString();
      sizes[0] = sizes[0] < strIndex.length ? strIndex.length : sizes[0];

      for (let i = 1; i < columns.length; i++) {
        const name = item[columns[i] as keyof ITime].toString();
        sizes[i] = sizes[i] < name.length ? name.length : sizes[i];
      }
    });

    return sizes;
  }
}

export const tracker = new Tracker();
