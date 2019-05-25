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

  static bindRequiredAnimation(control) {
    return function () {
      if (!control.classList.contains('required')) {
        control.classList.add('required');
      } else {
        control.style.animation = 'none';
        control.offsetHeight; // trigger reflow
        control.style.animation = null;
      }

      control.focus();
    };
  }
}