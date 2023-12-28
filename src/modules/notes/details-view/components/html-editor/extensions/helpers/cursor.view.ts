import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { IDirection, IRect, ISelectionRange } from './models/cursor.models';


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
      this.cursor.style.top = `${range.cursor.top}px`;
      this.cursor.style.left = `${range.cursor.left}px`;
      this.cursor.style.height = `${range.cursor.height}px`;
      this.restartAnimation(this.cursor, 'vr-cursor-blink');

      if (!range.collapsed && range.clientRects.length) {
        this.selection.style.display = '';
        this.selection.setAttribute('width', `${range.boundingRect.right - range.boundingRect.left}`);
        this.selection.setAttribute('height', `${range.boundingRect.bottom - range.boundingRect.top}`);
        this.selection.style.left = `${range.boundingRect.left}px`;
        this.selection.style.top = `${range.boundingRect.top}px`;

        this.polygon.setAttribute('d', this.drawPath(range.clientRects));
      } else {
        this.selection.style.display = 'none';
      }
    }
  }

  private drawPath(lines: IRect[]): string {
    const first = lines[0];
    const last = lines[lines.length - 1];
    const leftPoints: string[] = [];
    const points: string[] = [
      `M ${first.left},${first.bottom - radius}`,
      `L ${first.left},${first.top + radius}`,
      `a ${radius},${radius} 0 0 1 ${radius},-${radius}`,
      `L ${first.right - radius},${first.top}`,
      `a ${radius},${radius} 0 0 1 ${radius},${radius}`,
      `L ${first.right},${first.bottom - radius}`,
    ];

    for (let i = 1; i < lines.length; i++) {
      const current = lines[i];
      const previous = lines[i - 1];

      if (current.right < previous.right) {
        points.push(
          `a ${radius},${radius} 0 0 1 -${radius},${radius}`,
          `L ${current.right + radius},${current.top}`,
          `a ${radius},${radius} 0 0 0 -${radius},${radius}`,
          `L ${current.right},${current.bottom - radius}`,
        );
      }

      if (current.right > previous.right) {
        points.push(
          `a ${radius},${radius} 0 0 0 ${radius},${radius}`,
          `L ${current.right - radius},${current.top}`,
          `a ${radius},${radius} 0 0 1 ${radius},${radius}`,
          `L ${current.right},${current.bottom - radius}`,
        );
      }

      if (current.right === previous.right) {
        points.push(
          `L ${current.right},${current.bottom - radius}`,
        );
      }

      if (previous.left < current.left) {
        leftPoints.unshift(
          `L ${current.left},${previous.bottom + radius}`,
          `a ${radius},${radius} 0 0 0 -${radius},-${radius}`,
          `L ${previous.left + radius},${previous.bottom}`,
          `a ${radius},${radius} 0 0 1 -${radius},-${radius}`,
        );
      }

      if (previous.left > current.left) {
        leftPoints.unshift(
          `L ${current.left},${previous.bottom + radius}`,
          `a ${radius},${radius} 0 0 1 ${radius},-${radius}`,
          `L ${previous.left - radius},${previous.bottom}`,
          `a ${radius},${radius} 0 0 0 ${radius},-${radius}`,
        );
      }

      if (previous.left === current.left) {
        leftPoints.unshift(
          `L ${previous.left},${previous.bottom - radius}`,
        );
      }
    }

    points.push(
      `a ${radius},${radius} 0 0 1 -${radius},${radius}`,
      `L ${last.left + radius},${last.bottom}`,
      `a ${radius},${radius} 0 0 1 -${radius},-${radius}`,
    );

    return points.concat(leftPoints, `z`).join(' ');
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
    const editorBoundaries = this.copyRect(view.dom.getBoundingClientRect());
    const rects: IRect[] = clientRects.length
      ? this.toRectLines(clientRects, editorBoundaries)
      : [this.normalize(view.coordsAtPos(view.state.selection.$from.pos) as DOMRect, editorBoundaries)];

    const collapsed = range.collapsed;
    const forward = range.collapsed || this.getDirection(selection) === IDirection.right;
    const cursorRect = rects[forward ? rects.length - 1 : 0];

    return {
      cursor: {
        left: !collapsed && forward ? cursorRect.right : cursorRect.left,
        top: collapsed ? cursorRect.top : cursorRect.top + radius,
        height: (collapsed ? cursorRect.bottom : cursorRect.bottom - (radius * 2)) - cursorRect.top
      },
      collapsed: collapsed,
      boundingRect: this.copyRect(this.normalize(editorBoundaries, editorBoundaries)),
      clientRects: rects
    };
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

  private normalize(rect: DOMRect | IRect, root: DOMRect | IRect): IRect {
    const result = {
      left: rect.left - root.left,
      top: rect.top - root.top,
      right: rect.right - root.left,
      bottom: rect.bottom - root.top,
    };

    if (result.right - result.left < 1) {
      result.right += (radius * 2);
    }

    return result;
  }

  private removeGap(first: IRect, second: IRect): IRect {
    if (first && first.top !== second.top) {
      const gap = (second.top - first.bottom) / 2;

      first.bottom += gap;
      second.top -= gap;
    }

    return second;
  }

  private copyRect(rect: IRect) :IRect {
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    };
  }

  private overlaps(rect: DOMRect | IRect, current: DOMRect | IRect): boolean {
    return (
      current.left <= rect.left && current.right >= rect.right
      && current.top < rect.top && current.bottom > rect.bottom
    );
  }

  private toRectLines(clientRects: DOMRectList, root: DOMRect | IRect): IRect[] {
    const lines: IRect[] = [];
    let line: number = -1;
    let current = this.copyRect(clientRects.item(0));
    let previous = current;

    for (let i = 0; i < clientRects.length; i++) {
      const rect = this.copyRect(clientRects.item(i));

      if (rect.top >= current.bottom) {
        lines.push(this.removeGap(lines[line], this.normalize(current, root)));

        current = rect;
        previous = rect;
        line++;
        continue;
      }

      if (this.overlaps(rect, previous)) {
        current.top = rect.top;
        current.left = rect.left;
        current.right = rect.right;
        current.bottom = rect.bottom;
        previous = rect;
        continue;
      }

      if (rect.bottom > current.bottom) {
        current.bottom = rect.bottom;
      }

      if (rect.top < current.top) {
        current.top = rect.top;
      }

      current.right = Math.min(rect.right, root.right - 1);
      previous = rect;
    }

    return lines.concat(this.removeGap(lines[line], this.normalize(current, root)));
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
