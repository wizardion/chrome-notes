import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { IDirection, IRect, ISelectionRange, ISelectionRects } from './models/cursor.models';


const radius = 2;

export class CursorView {
  public cursor: HTMLDivElement;
  public layer: HTMLElement;

  private selection: SVGSVGElement;
  private polygon: SVGPathElement;

  constructor(view: EditorView) {
    // this.view = view;
    // this.doc = view.dom.ownerDocument;
    this.cursor = document.createElement('div');
    this.layer = document.createElement('div');
    this.selection = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // this.selection = [
    //   document.createElement('div'),
    //   document.createElement('div'),
    //   document.createElement('div')
    // ];

    this.cursor.classList.add('vr-cursor');
    this.selection.classList.add('vr-selection');
    this.layer.classList.add('vr-selection-layer');

    this.selection.appendChild(this.polygon);
    this.layer.appendChild(this.cursor);
    this.layer.appendChild(this.selection);

    // for (let i = 0; i < this.selection.length; i++) {
    //   const element = this.selection[i];

    //   element.classList.add('vr-selection');
    //   this.layer.appendChild(element);
    // }

    // view.dom.style.position = 'relative';
    // this.event = () => this.update(view, null);
    // this.doc.addEventListener('selectionchange', this.event);

    // if (window.ResizeObserver) {
    //   this.observer = new window.ResizeObserver(() => this.event());
    //   this.observer.observe(view.dom.parentElement);
    // }

    this.update(view, null);
  }

  update(view: EditorView, lastState: EditorState) {
    const state = view.state;

    if (lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection)) {
      return;
    }

    return this.updateSelection(view);
  }

  private updateSelection(view: EditorView) {
    console.clear();
    const range = this.getSelectionRange(view);

    if (range) {
      this.cursor.style.top = `${range.cursor.top + (!range.collapsed && radius || 0)}px`;
      this.cursor.style.left = `${range.cursor.left}px`;
      this.cursor.style.height = `${range.cursor.height - (!range.collapsed && (radius * 2) || 0) }px`;
      this.restartAnimation(this.cursor, 'vr-cursor-blink');

      if (!range.collapsed && range.clientRects.length) {
        const points: string[] = [];

        this.selection.style.display = '';
        this.selection.setAttribute('width', `${range.boundingRect.right - range.boundingRect.left}`);
        this.selection.setAttribute('height', `${range.boundingRect.bottom - range.boundingRect.top}`);
        this.selection.style.left = `${range.boundingRect.left}px`;
        this.selection.style.top = `${range.boundingRect.top}px`;

        if (range.clientRects.length <= 2) {
          const first = range.clientRects[0];

          points.push(
            `M ${first.left},${first.bottom - radius}`,
            `L ${first.left},${first.top + radius}`,
            `a ${radius},${radius} 0 0 1 ${radius},-${radius}`,
            `L ${first.right - radius},${first.top}`,
            `a ${radius},${radius} 0 0 1 ${radius},${radius}`,
            `L ${first.right},${first.bottom - radius}`,
            `a ${radius},${radius} 0 0 1 -${radius},${radius}`
          );

          if (range.clientRects.length === 2) {
            const second = range.clientRects[1];

            points.push(
              `L ${second.right + radius},${second.top}`,
              `a ${radius},${radius} 0 0 0 -${radius},${radius}`,
              `L ${second.right},${second.bottom - radius}`,
              `a ${radius},${radius} 0 0 1 -${radius},${radius}`,
              `L ${second.left + radius},${second.bottom}`,
              `a ${radius},${radius} 0 0 1 -${radius},-${radius}`,
              `L ${second.left},${second.top + radius}`,
              `a ${radius},${radius} 0 0 1 ${radius},-${radius}`,
              `L ${first.left - radius},${first.bottom}`,
              `a ${radius},${radius} 0 0 0 ${radius},-${radius}`,
            );
          } else {
            points.push(
              `L ${first.left + radius},${first.bottom}`,
              `a ${radius},${radius} 0 0 1 -${radius},-${radius}`,
            );
          }
        }

        if (range.clientRects.length === 3) {
          const first = range.clientRects[0];
          const middle = range.clientRects[1];
          const second = range.clientRects[2];

          points.push(
            `M ${first.left},${first.bottom - radius}`,
            `L ${first.left},${first.top + radius}`,
            `a ${radius},${radius} 0 0 1 ${radius},-${radius}`,

            `L ${first.right - radius},${first.top}`,
            `a ${radius},${radius} 0 0 1 ${radius},${radius}`,

            `L ${middle.right},${middle.bottom - radius}`,
            `a ${radius},${radius} 0 0 1 -${radius},${radius}`,

            `L ${second.right + radius},${second.top}`,
            `a ${radius},${radius} 0 0 0 -${radius},${radius}`,
            `L ${second.right},${second.bottom - radius}`,
            `a ${radius},${radius} 0 0 1 -${radius},${radius}`,
            `L ${second.left + radius},${second.bottom}`,
            `a ${radius},${radius} 0 0 1 -${radius},-${radius}`,

            `L ${middle.left},${middle.top + radius}`,
            `a ${radius},${radius} 0 0 1 ${radius},-${radius}`,

            `L ${first.left - radius},${first.bottom}`,
            `a ${radius},${radius} 0 0 0 ${radius},-${radius}`,
          );
        }

        this.polygon.setAttribute('d', points.concat(`z`).join(' '));
      } else {
        this.selection.style.display = 'none';
      }
    }
  }

  private getSelectionRange(view: EditorView): ISelectionRange | null {
    const selection = window.getSelection();

    if (!selection || !selection.rangeCount) {
      return null;
    }

    const range = selection.getRangeAt(0).cloneRange();

    if (!range) {
      return null;
    }

    const clientRects = range.getClientRects();
    const editorBoundaries = view.dom.getBoundingClientRect();
    const rects: IRect[] = [];

    if (clientRects?.length) {
      for (let i = 0; i < clientRects.length; i++) {
        const item = clientRects.item(i);

        if (item.height) {
          rects.push(this.normalize(item, editorBoundaries));
        }
      }
    } else {
      rects.push(this.normalize(view.coordsAtPos(view.state.selection.$from.pos) as DOMRect, editorBoundaries));
    }

    return this.buildSelectionRange(
      rects,
      this.normalize(editorBoundaries, editorBoundaries),
      range.collapsed,
      range.collapsed || this.getDirection(selection) === IDirection.right
    );
  }

  private buildSelectionRange(rects: IRect[], root: IRect, collapsed: boolean, forward: boolean): ISelectionRange {
    const cursorRect = rects[forward ? rects.length - 1 : 0];
    const selectionRange: ISelectionRange = {
      cursor: {
        left: !collapsed && forward ? cursorRect.right : cursorRect.left,
        top: cursorRect.top,
        height: cursorRect.bottom - cursorRect.top
      },
      collapsed: collapsed,
      boundingRect: null,
      clientRects: null
    };

    if (!collapsed) {
      const { clientRects, boundingRect } = this.getSelectionRects(rects, root);

      selectionRange.clientRects = clientRects;
      selectionRange.boundingRect = boundingRect;

      // console.log('boundingRects1', selectionRange.boundingRect);
      // console.log('boundingRects2', boundingRect);
    }

    return selectionRange;
  }

  private getSelectionRects(rects: IRect[], root: IRect): ISelectionRects {
    const first = this.copyRect(rects[0]);
    const last = this.copyRect(rects[rects.length - 1]);
    const boundingRect = this.copyRect(rects[0]);
    const clientRects: IRect[] = [first];
    let position = 0;

    for (let i = 1; i < rects.length; i++) {
      const rect = rects[i];

      if (rect.top >= first.bottom) {
        first.right = root.right;
        last.left = root.left;
        clientRects.push(last);
        break;
      }

      if (rect.bottom > first.bottom) {
        first.bottom = rect.bottom;
      }

      if (rect.top < first.top) {
        first.top = rect.top;
      }

      first.right = rect.right;
      position = i;
    }

    for (let i = rects.length - 2; i > position; i--) {
      const rect = rects[i];

      if (rect.bottom <= last.top) {
        clientRects.splice(1, 0, {
          left: root.left,
          top: first.bottom,
          right: root.right,
          bottom: last.top
        });
        break;
      }

      if (rect.bottom > last.bottom) {
        last.bottom = rect.bottom;
      }

      if (rect.top < last.top) {
        last.top = rect.top;
      }
    }

    if (clientRects.length === 2) {
      const gap = (last.top - first.bottom) / 2;

      first.bottom += gap;
      last.top -= gap;
    }

    boundingRect.top = first.top - 1;
    boundingRect.left = (first.left < last.left ? first.left : last.left) - 1;
    boundingRect.right = (first.right > last.right ? first.right : last.right) + 1;
    boundingRect.bottom = last.bottom + 1;

    for (let i = 0; i < clientRects.length; i++) {
      const rect = clientRects[i];

      rect.top = rect.top - boundingRect.top;
      rect.left = rect.left - boundingRect.left;
      rect.right = rect.right - boundingRect.left;
      rect.bottom = rect.bottom - boundingRect.top;
    }

    return { boundingRect, clientRects };
  }

  private getDirection(selection: Selection): IDirection {
    const range = document.createRange();

    if (range) {
      range.setStart(selection.anchorNode, selection.anchorOffset);
      range.setEnd(selection.focusNode, selection.focusOffset);

      return range.collapsed ? IDirection.left : IDirection.right;
    }

    return IDirection.right;
  }

  private normalize(rect: DOMRect, root: DOMRect): IRect {
    return {
      left: rect.left - root.left,
      top: rect.top - root.top,
      right: rect.right - root.left,
      bottom: rect.bottom - root.top,
    };
  }

  private copyRect(rect: IRect) :IRect {
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    };
  }

  // Restart CSS animation
  // https://css-tricks.com/restart-css-animation/
  private restartAnimation(element: HTMLElement, className: string) {
  // -> removing the class
    element.classList.remove(className);

    // -> triggering reflow /* The actual magic */
    // eslint-disable-next-line no-void
    void element.offsetWidth;

    // -> and re-adding the class
    element.classList.add(className);
  }
}
