import { EditorState, Selection as ISelection, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { IDirection, IRect, ISelectionRange } from './models/cursor.models';
import { Mark, ResolvedPos } from 'prosemirror-model';


export const radius = 2;
export const minimum = radius * 4;
export const widget = document.createElement('div');

export class CursorView {
  public static widget = widget;

  private cursor: HTMLDivElement;
  private selection: SVGSVGElement;
  private polygon: SVGPathElement;
  private doc: Document;

  constructor(view: EditorView) {
    this.doc = view.dom.ownerDocument;

    this.cursor = this.doc.createElement('div');
    this.selection = this.doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.polygon = this.doc.createElementNS('http://www.w3.org/2000/svg', 'path');

    this.cursor.classList.add('vr-cursor');
    this.selection.classList.add('vr-selection');
    widget.classList.add('vr-selection-layer');

    this.selection.appendChild(this.polygon);
    widget.appendChild(this.cursor);
    widget.appendChild(this.selection);

    setTimeout(() => this.update(view, null), 10);
  }

  update(view: EditorView, lastState: EditorState) {
    const state = view.state;

    this.updateCursorMarks(state);

    if (lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection)) {
      return;
    }

    return this.updateSelection(view);
  }

  handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
    const { selection } = view.state;

    if (this.isTextSelection(selection, event)) {
      return false;
    }

    const $pos = selection.$head;
    const [marksBefore, marksAfter] = this.getMarksAround($pos);
    const marks = view.state.storedMarks || $pos.marks();

    // Don't move the cursor, only change the stored marks
    if (marksBefore && marksAfter && !Mark.sameSet(marksBefore, marksAfter)) {
      if (event.key === 'ArrowLeft' && !Mark.sameSet(marksBefore, marks)) {
        view.dispatch(view.state.tr.setStoredMarks(marksBefore));

        return true;
      }

      if (event.key === 'ArrowRight' && !Mark.sameSet(marksAfter, marks)) {
        view.dispatch(view.state.tr.setStoredMarks(marksAfter));

        return true;
      }
    }

    // Move the cursor and also change the stored marks
    if (event.key === 'ArrowLeft' && $pos.textOffset === 1) {
      view.dispatch(
        view.state.tr
          .setSelection(TextSelection.create(view.state.doc, $pos.pos - 1))
          .setStoredMarks($pos.marks()),
      );

      return true;
    }

    if (event.key === 'ArrowRight' && $pos.textOffset + 1 === $pos.parent.maybeChild($pos.index())?.nodeSize) {
      view.dispatch(
        view.state.tr
          .setSelection(TextSelection.create(view.state.doc, $pos.pos + 1))
          .setStoredMarks($pos.marks()),
      );

      return true;
    }

    return false;
  }

  destroy() {
    this.cursor.remove();
    this.selection.remove();
  }

  private updateSelection(view: EditorView) {
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

    const collapsed = range.collapsed;
    const clientRects = range.getClientRects();
    const editorBoundaries = this.copyRect(view.dom.getBoundingClientRect());
    const forward = range.collapsed || this.getDirection(selection) === IDirection.right;

    const rects: IRect[] = !collapsed && clientRects.length
      ? this.toRectLines(clientRects, editorBoundaries)
      : [this.normalize(view.coordsAtPos(view.state.selection.from) as DOMRect, editorBoundaries)];

    const cursorRect = this.normalize(view.coordsAtPos(
      !forward ? view.state.selection.from : view.state.selection.to
    ) as DOMRect, editorBoundaries);

    return {
      cursor: {
        left: !collapsed && forward ? cursorRect.right : cursorRect.left,
        top: cursorRect.top,
        height: cursorRect.bottom - cursorRect.top
      },
      collapsed: collapsed,
      boundingRect: this.copyRect(this.normalize(editorBoundaries, editorBoundaries)),
      clientRects: rects
    };
  }

  private getDirection(selection: Selection): IDirection {
    const range = this.doc.createRange();

    if (range) {
      range.setStart(selection.anchorNode, selection.anchorOffset);
      range.setEnd(selection.focusNode, selection.focusOffset);

      return range.collapsed ? IDirection.left : IDirection.right;
    }

    return IDirection.right;
  }

  private normalize(rect: DOMRect | IRect, root: DOMRect | IRect): IRect {
    return {
      left: rect.left - root.left,
      top: rect.top - root.top,
      right: rect.right - root.left,
      bottom: rect.bottom - root.top,
    };
  }

  private removeGap(first: IRect, second: IRect, root?: DOMRect | IRect): IRect {
    if (first && first.top !== second.top) {
      const gap = (second.top - first.bottom) / 2;

      first.bottom += gap;
      second.top -= gap;
    }

    if (root) {
      second.right = Math.min(second.right + minimum, (root.right - root.left) - 1);
    }

    if (second.right - second.left < 1) {
      second.right += minimum;
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
        lines.push(this.removeGap(lines[line], this.normalize(current, root), root));

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

  private restartAnimation(element: HTMLElement, className: string) {
  // -> removing the class
    element.classList.remove(className);

    // -> triggering reflow
    void element.offsetWidth;

    // -> and re-adding the class
    element.classList.add(className);
  }

  private isTextSelection(selection: ISelection, event: KeyboardEvent): boolean {
    return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing ||
    !['ArrowLeft', 'ArrowRight'].includes(event.key) || !selection.empty;
  }

  private getMarksAround(pos: ResolvedPos) {
    const index = pos.index();
    const after = pos.parent.maybeChild(index);

    // When inside a text node, return the text node's marks
    let before = pos.textOffset ? after : null;

    if (!before && index > 0) {
      before = pos.parent.maybeChild(index - 1);
    }

    return [before?.marks, after?.marks] as const;
  }

  private updateCursorMarks(state: EditorState) {
    const selection = state.selection;
    const $pos = state.selection.$head;
    const [marksBefore, marksAfter] = this.getMarksAround($pos);
    const marks = state.storedMarks || $pos.marks();
    let className = 'vr-cursor';

    if (selection.empty && marksBefore && marksAfter && marks && !Mark.sameSet(marksBefore, marksAfter)) {
      if (Mark.sameSet(marksBefore, marks)) {
        className += ' virtual-cursor-left';
      } else if (Mark.sameSet(marksAfter, marks)) {
        className += ' virtual-cursor-right';
      }
    }

    this.cursor.className = className;
  }
}
