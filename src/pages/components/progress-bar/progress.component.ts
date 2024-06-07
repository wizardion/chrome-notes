import { delay } from 'core';
import './assets/progress-bar.scss';
import { BaseElement } from 'core/components';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './template.html'
});

export class ProgressElement extends BaseElement {
  static readonly selector = 'progress-bar';
  static observedAttributes = ['disabled', 'autoplay'];

  protected progress: HTMLDivElement;
  protected thumb: HTMLDivElement;
  protected animationFrame: () => void;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.progress = this.template.querySelector('div[name="progress"]');
    this.thumb = this.template.querySelector('div[name="progress-thumb"]');
  }

  protected attributeChanged(name: string, oldValue: string, newValue: string): void {
    if (name === 'autoplay' && !oldValue && newValue === 'true') {
      this.spinning = true;
    }
  }

  protected start() {
    this.thumb.classList.add('animate');
    this.progress.classList.add('animating');
  }

  protected stop() {
    this.thumb.classList.remove('animate');
    this.progress.classList.remove('animating');
    this.thumb.removeEventListener('animationiteration', this.animationFrame);
  }

  public finish(ms?: number): Promise<void> {
    const animations = this.thumb.getAnimations();

    if (animations?.length) {
      return new Promise<void>((resolve) => {
        this.animationFrame = async () => {
          this.stop();

          if (ms) {
            await delay(ms);
          }

          resolve();
        };

        this.thumb.addEventListener('animationiteration', this.animationFrame);
      });
    }

    return Promise.resolve();
  }

  get spinning(): boolean {
    return this.thumb.classList.contains('animate');
  }

  set spinning(value: boolean) {
    if (value) {
      this.start();
    } else {
      this.stop();
    }
  }
}
