class Tracker {
  constructor() {
    this.start = performance.now();
    this.current = this.start;
    this.timings = [];
  }

  reset() {
    this.start = performance.now();
    this.current = this.start;
  }

  track(name) {
    var time = performance.now();
    this.timings.push({name: name, time: time - this.current});
    this.current = time;
  }

  print() {
    var time = performance.now();
    this.timings.push({name: 'total', time: time - this.start});
    this.current = time;
    var logs = [];
    var params = [];

    console.log('--------------- timings ---------------')
    for (var i = 0; i < this.timings.length; i++) {
      let log = {};
      const timing = this.timings[i];

      log[timing.name] = timing.time;
      // console.log(log);
      // logs.push(log);
      logs.push(`%c${timing.name}: %c${timing.time}`);
      params.push('color: darkred;');
      params.push('color: blue;');
    }
    params.splice(0, 0, logs.join(', '));

    // console.log(params);
    console.log.apply(console, params);
    // log()
  }
}