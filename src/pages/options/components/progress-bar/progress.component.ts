import {BaseElement} from 'modules/core/base.component';

const template:DocumentFragment = BaseElement.template(require('html-loader!./template.html').default);


export class ProgressElement extends BaseElement {
  protected template: HTMLElement;
  protected progress: HTMLDivElement;
  protected thumb: HTMLDivElement;

  protected event: Event;
  protected animationEvent: () => void;

  static observedAttributes = ['disabled', 'default-index'];

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.progress = this.template.querySelector('div[name="progress"]');
    this.thumb = this.template.querySelector('div[name="progress-thumb"]');
  }

  public finish(delay?: number): Promise<void> {
    return new Promise<void>(async (resolve) => {
      var animationEvent = async () => {
        this.animationIteration();
        this.thumb.removeEventListener('animationiteration', animationEvent);
        delay && await this.delay(delay);
        resolve();
      };

      this.thumb.addEventListener('animationiteration', animationEvent);
    });
  }

  public get spinning(): boolean {
    return this.thumb.classList.contains('animate');
  }

  public set spinning(value: boolean) {
    if(value) {
      this.thumb.classList.add('animate');
      this.progress.classList.add('animating');
    } else {
      this.thumb.addEventListener('animationiteration', this.animationEvent);
    }
  }

  protected delay(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
  }

  protected render() {
    this.appendChild(this.template);
  }

  protected async eventListeners() {
    this.animationEvent = () => this.animationIteration();
    this.event = new Event('progress:animation-complete');
  }

  protected animationIteration() {
    this.thumb.classList.remove('animate');
    this.progress.classList.remove('animating');
    this.thumb.removeEventListener('animationiteration', this.animationEvent);
    this.dispatchEvent(this.event);
    // this.promise.
  }
}
