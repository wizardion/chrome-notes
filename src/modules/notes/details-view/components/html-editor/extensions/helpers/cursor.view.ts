import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { IDirection, IRect, ISelectionRange } from './models/cursor.models';


export class CursorView {
  public cursor: HTMLDivElement;
  public layer: HTMLElement;

  private selection: HTMLElement;

  constructor(view: EditorView) {
    // this.view = view;
    // this.doc = view.dom.ownerDocument;
    this.cursor = document.createElement('div');
    this.layer = document.createElement('div');
    this.selection = document.createElement('div');
    // this.selection = [
    //   document.createElement('div'),
    //   document.createElement('div'),
    //   document.createElement('div')
    // ];

    this.cursor.classList.add('vr-cursor');
    this.selection.classList.add('vr-selection');
    this.layer.classList.add('vr-selection-layer');

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

    console.clear();

    return this.updateSelection(view);
  }

  private updateSelection(view: EditorView) {
    const range = this.getSelectionRange(view);

    if (range) {
      this.cursor.style.top = `${range.cursor.top}px`;
      this.cursor.style.left = `${range.cursor.left}px`;
      this.cursor.style.height = `${range.cursor.height}px`;
      this.restartAnimation(this.cursor, 'vr-cursor-blink');

      if (!range.collapsed) {
        this.selection.hidden = false;
        this.selection.innerHTML = '';

        for (let i = 0; i < range.clientRects.length; i++) {
          const rect = range.clientRects[i];
          const selection = document.createElement('div');
          const width = rect.right - rect.left;

          selection.style.top = `${rect.top}px`;
          selection.style.left = `${rect.left}px`;
          selection.style.width = width ? `${width}px` : '1ch';
          selection.style.height = `${rect.bottom - rect.top}px`;

          this.selection.appendChild(selection);
        }
      } else {
        this.selection.hidden = true;
      }
    }
  }

  private getSelectionRange(view: EditorView): ISelectionRange | null {
    const selection = window.getSelection();

    if (!selection || !selection.rangeCount) {
      return null;
    }

    // const r = selection.getRangeAt(0);
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

    // console.log('coords', this.normalize(
    //   view.coordsAtPos(view.state.selection.$from.pos) as DOMRect, editorBoundaries)
    // );

    // console.log('getComputedStyle',
    //   // view.state.selection
    //   r.getBoundingClientRect()
    //   // getComputedStyle(r.startContainer as Element)
    // );

    // rects.push(this.normalize(range.getBoundingClientRect(), editorBoundaries));
    // const root = range.getBoundingClientRect();

    // console.log('- ', root, ['height', root.bottom - root.top]);

    return this.buildSelectionRange(
      rects,
      this.normalize(editorBoundaries, editorBoundaries),
      range.collapsed,
      range.collapsed || this.getDirection(selection) === IDirection.right
    );
  }

  private buildSelectionRange(rects: IRect[], root: IRect, collapsed: boolean, forward: boolean): ISelectionRange {
    const cursorRect = rects[forward ? rects.length - 1 : 0];

    return {
      cursor: {
        left: !collapsed && forward ? cursorRect.right : cursorRect.left, top: cursorRect.top,
        height: cursorRect.bottom - cursorRect.top
      },
      collapsed: collapsed,
      clientRects: !collapsed ? this.getSelectionLinesRects(rects, root) : null
    };
  }

  private getSelectionLinesRects(rects: IRect[], root: IRect): IRect[] {
    const first = this.copyRect(rects[0]);
    const last = this.copyRect(rects[rects.length - 1]);
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

    return clientRects;
  }

  private getDirection(selection: Selection): IDirection {
    const range = document.createRange();

    if (range) {
      range.setStart(selection.anchorNode, selection.anchorOffset);
      range.setEnd(selection.focusNode, selection.focusOffset);

      console.log('', range.getClientRects());

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
