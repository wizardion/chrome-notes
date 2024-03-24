import { EditorState, Transaction } from 'prosemirror-state';
import { wrapInList, liftListItem } from 'prosemirror-schema-list';
import { Fragment, NodeRange, NodeType, Slice, Node } from 'prosemirror-model';
import { ReplaceAroundStep, canJoin, liftTarget } from 'prosemirror-transform';


export enum DirectionPaths {
  CHANGE = 1,
  OUT = 2,
  LIFT = 3,
  WRAP = 4
}

export interface IStackItem {
  node: Node;
  pos: number;
}

export type ISelector = (t: NodeType) => boolean;

export class ListCommandHelper {
  static toggle(listType: NodeType, state: EditorState, dispatch: (tr: Transaction) => void): boolean {
    const execWrap = wrapInList(listType);
    const direction = this.getCommandDirection(state, listType);

    if (direction === DirectionPaths.WRAP && execWrap(state)) {
      return execWrap(state, dispatch);
    }

    if (direction === DirectionPaths.OUT && this.liftSelectionOut(state, dispatch)) {
      return true;
    }

    if (direction === DirectionPaths.CHANGE && this.changeListType(state, listType, dispatch)) {
      return true;
    }

    if (direction === DirectionPaths.LIFT) {
      const execLift = liftListItem(state.schema.nodes.listItem);

      if (execLift(state, dispatch)) {
        return true;
      }
    }
  }

  static check(state: EditorState): boolean {
    return !!state;
  }

  private static changeListType(state: EditorState, itemType: NodeType, dispatch: (tr: Transaction) => void): boolean {
    const transaction = state.tr;
    const listTypes = [state.schema.nodes.orderedList, state.schema.nodes.bulletList];
    const levelStack = this.getSelectedItems(state, transaction, t => listTypes.includes(t) && t !== itemType);

    for (let i = 0; i < levelStack.length; i++) {
      const level = levelStack[i];

      transaction.setNodeMarkup(level.pos, itemType);
    }

    dispatch(transaction.scrollIntoView());

    return true;
  }

  private static liftSelectionOut(state: EditorState, dispatch: any): boolean {
    const transaction = state.tr;
    const listItem = state.schema.nodes.listItem;
    const selectionRange = transaction.selection.$from.blockRange(transaction.selection.$to);

    if (selectionRange) {
      transaction.doc.nodesBetween(selectionRange.$from.pos, selectionRange.$to.pos, (node: Node, pos: number) => {
        if (node.type === listItem) {
          const selectionRange = transaction.selection.$from.blockRange(transaction.selection.$to);
          const from = transaction.doc.resolve(transaction.mapping.map(pos + 1));
          const to = transaction.doc.resolve(transaction.mapping.map(pos + node.nodeSize - 1));
          const range = from.blockRange(to);

          if (range && range.depth >= selectionRange.depth) {
            this.liftItemOut(listItem, range, transaction);
          }
        }
      });

      dispatch(transaction.scrollIntoView());

      return true;
    }

    return false;
  }

  private static liftItemOut(itemType: NodeType, range: NodeRange, transaction: Transaction): boolean {
    const end = range.end;
    const endOfList = range.$to.end(range.depth);

    if (end < endOfList) {
      console.log('ReplaceAroundStep');
      // There are siblings after the lifted items, which must become children of the last item
      transaction.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList,
        new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));

      range = new NodeRange(transaction.doc.resolve(range.$from.pos), transaction.doc.resolve(endOfList), range.depth);
    }

    const target = liftTarget(range);

    if (target === null) {
      return false;
    }

    transaction.lift(range, target);

    const after = transaction.mapping.map(end, -1) - 1;

    if (canJoin(transaction.doc, after)) {
      transaction.join(after, 0);
    }

    return true;
  }

  private static getCommandDirection(state: EditorState, itemType: NodeType): number {
    const range = state.selection.$from.blockRange(state.selection.$to);
    const selectedRanges = [range.$from.node(range.depth - 1).type, range.$from.node(range.depth).type];
    const listItems = [
      state.schema.nodes.listItem,
      state.schema.nodes.bulletList,
      state.schema.nodes.orderedList
    ];
    const isInList = selectedRanges.some(r => listItems.includes(r));

    if (isInList && !selectedRanges.includes(itemType)) {
      return DirectionPaths.CHANGE;
    }

    if (isInList) {
      return DirectionPaths.OUT;
    }

    return DirectionPaths.WRAP;
  }

  private static getSelectedItems(state: EditorState, transaction: Transaction, predicate: ISelector): IStackItem[] {
    const selectionRange = transaction.selection.$from.blockRange(transaction.selection.$to);
    const listItem = state.schema.nodes.listItem;
    const levelStack: IStackItem[] = [];

    if (selectionRange) {
      let tmpItem: IStackItem = null;

      transaction.doc.nodesBetween(selectionRange.$from.pos, selectionRange.$to.pos, (node: Node, pos: number) => {
        if (predicate(node.type)) {
          tmpItem = { node: node, pos: pos };
        }

        if (node.type === listItem && tmpItem) {
          const from = transaction.doc.resolve(transaction.mapping.map(pos + 1));
          const to = transaction.doc.resolve(transaction.mapping.map(pos + node.nodeSize - 1));
          const range = from.blockRange(to);

          if (range && range.depth >= selectionRange.depth) {
            levelStack.push(tmpItem);
          }
        }
      });
    }

    return levelStack;
  }
}
