export class Validator {
  private static timer: NodeJS.Timeout;

  public static required(value: string, control?: HTMLElement): boolean {
    if (value.trim().length > 0) {
     return false; 
    }

    if (control) {
      this.requiredAnimation(control);
    }

    return true;
  }

  private static requiredAnimation(control: HTMLElement) {
    if (!control.classList.contains('required')) {
      control.classList.add('required');
    } else {
      control.style.animation = 'none';
      control.offsetHeight; // trigger reflow
      control.style.animation = null;
    }

    clearInterval(this.timer);
    this.timer = setTimeout(this.removeRequired.bind(this, control), 1510);
  }

  private static removeRequired(control: HTMLElement){
    control.classList.remove('required');
  }
}