
import './assets/dropdown-menu.scss';
import { BaseElement, FormElement } from 'core/components';
import { IEditorControlsFormItem } from './models/dropdown-menu.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './dropdown-menu.component.html'
});

export class DropdownMenuElement extends BaseElement {
  static readonly selector = 'dropdown-menu';
  static observedAttributes = ['static', 'change-on', 'top', 'left'];
  static opened = false;
  static menu: HTMLElement;
  static items: HTMLButtonElement[];
  static selected: number = null;

  static mouseEvent?: (e: MouseEvent) => void;
  static keyboardEvent?: (e: KeyboardEvent) => void;
  static focusEvent?: (e: Event) => void;

  private _value: string;
  private changeOn: string = 'click';
  private staticMessage: string = null;
  private items: HTMLButtonElement[] = [];
  private form: FormElement<IEditorControlsFormItem>;

  constructor() {
    super();

    this.classList.add('dropdown');
    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IEditorControlsFormItem>({
      toggler: this.template.querySelector('[name="dropdown-toggle"]'),
      value: this.template.querySelector('[name="dropdown-value"]'),
      menu: this.template.querySelector('[name="dropdown-menu"]'),
    });
  }

  protected render(): void {
    super.render();

    const list = <NodeList> this.querySelectorAll('button[action]');

    for (let i = 0; i < list.length; i++) {
      const element = list.item(i) as HTMLButtonElement;

      if (!element.getAttribute('value')) {
        element.setAttribute('value', i.toString());
      }

      if (this.changeOn !== 'click') {
        element.addEventListener('keydown', (e) => {
          e.preventDefault();

          if (['Enter', 'Space'].includes(e.code)) {
            this.valueChanged(element.value);
            element.dispatchEvent(new Event(this.changeOn, { cancelable: true }));
          }
        });
      }

      element.addEventListener(this.changeOn, () => this.valueChanged(element.value));

      this.items.push(element);
      this.form.elements.menu.appendChild(element);
    }

    if (!this.staticMessage && list.length) {
      const first = list.item(0) as HTMLElement;

      this.form.elements.value.innerText = first.innerText;
    }
  }

  protected attributeChanged(name: string, oldValue: string, newValue: string): void {
    if (name === 'static' && newValue) {
      this.staticMessage = newValue;
      this.form.elements.value.innerText = this.staticMessage;
    }

    if (name === 'change-on' && newValue) {
      this.changeOn = newValue;
    }

    if (name === 'top' && newValue) {
      this.form.elements.menu.style.top = `${newValue}px`;
    }

    if (name === 'left' && newValue) {
      this.form.elements.menu.style.left = `${newValue}px`;
    }
  }

  protected eventListeners(): void {
    this.form.elements.toggler.addEventListener('mousedown', () => {
      const mouseUpEvent = (e: MouseEvent) => {
        window.removeEventListener('mouseup', mouseUpEvent);

        if (DropdownMenuElement.opened && DropdownMenuElement.menu) {
          const target = e.target as HTMLElement;

          if (target.parentElement === this.form.elements.menu) {
            const element = this.items.find(i => target === i);

            if (element && !element.disabled) {
              this.valueChanged(element.value);

              return element.dispatchEvent(new Event(this.changeOn, { cancelable: true }));
            }
          }

          if (target !== this.form.elements.menu) {
            DropdownMenuElement.closeMenu();
          }
        }
      };

      window.addEventListener('mouseup', mouseUpEvent);
      this.toggleMenu();
    });
  }

  get controls(): NodeList {
    return this.form.elements.menu.childNodes;
  }

  set value(index: string) {
    this.valueChanged(index);
  }

  get value(): string {
    return this._value;
  }

  private toggleMenu() {
    const opened = DropdownMenuElement.closeMenu();

    if (this.items.length && !opened) {
      this.form.elements.menu.hidden = false;
      this.classList.add('opened');

      setTimeout(() => {
        DropdownMenuElement.opened = true;
        DropdownMenuElement.menu = this.form.elements.menu;
        DropdownMenuElement.items = this.items;

        DropdownMenuElement.whenDefined();
      }, 450);
    }
  }

  private valueChanged(value: string) {
    this._value = value;

    if (this.staticMessage === null) {
      const item = this.items.find(i => i.value === value);

      this.form.elements.value.innerText = item.innerText;
    }

    DropdownMenuElement.closeMenu();
  }

  private static whenDefined() {
    this.mouseEvent = (e) => {
      const target = e.target as HTMLElement;

      if (target !== this.menu && target.parentElement !== this.menu) {
        return this.closeMenu();
      }
    };

    this.keyboardEvent = (e) => {
      if (this.opened && this.menu && ['ArrowDown', 'ArrowUp'].includes(e.code)) {
        return e.key === 'ArrowDown' ? this.focusNext() : this.focusPrev();
      }

      if (['Escape'].includes(e.code)) {
        return this.closeMenu();
      }
    };

    this.focusEvent = () => {
      this.closeMenu();
    };

    window.addEventListener('mousedown', this.mouseEvent);
    window.addEventListener('keydown', this.keyboardEvent);
    // window.addEventListener('blur', this.focusEvent);
  }

  private static closeMenu(): boolean {
    if (this.opened && this.menu) {
      this.menu.parentElement.classList.remove('opened');

      window.removeEventListener('mousedown', this.mouseEvent);
      window.removeEventListener('keydown', this.keyboardEvent);
      window.removeEventListener('blur', this.focusEvent);

      this.menu.hidden = true;
      this.opened = false;
      this.menu = null;
      this.selected = null;
      this.mouseEvent = null;
      this.keyboardEvent = null;

      return true;
    }

    return false;
  }

  private static focusNext(id: number = null) {
    const count = this.items.length - 1;
    const index = id !== null ? id : this.selected === null ? 0 : Math.min(this.selected + 1, count);
    const item = this.items[index];

    if (item.disabled && index < count) {
      this.focusNext(index + 1);

      return;
    }

    if (!item.disabled) {
      this.selected = index;
      item.focus();
    }
  }

  private static focusPrev(id: number = null) {
    const count = this.items.length - 1;
    const index = id !== null ? id : this.selected === null ? count : Math.max(0, this.selected - 1);
    const item = this.items[index];

    if (item.disabled && index > 0) {
      this.focusPrev(index - 1);

      return;
    }

    if (!item.disabled) {
      this.selected = index;
      item.focus();
    }
  }
}
