class Validator {
  constructor() {
    this.rules = [];
  }

  init() {
    
  }
  
  addRule(rule=Function) {
    this.rules.push(rule);
  }

  valid() {
    for (var i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i];

      if(!rule()) {
        return false;
      }
    }

    return true;
  }
}