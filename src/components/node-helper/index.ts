export class NodeHelper {
  public static getSelection(element: Node): string | null {
    const selection: Selection = document.getSelection();
    const selected = selection.toString().length > 0;

    if (selected) {
      const anchorPosition = this.getPosition(<HTMLElement>selection.anchorNode, element);
      const focusPosition = this.getPosition(<HTMLElement>selection.focusNode, element);

      return [anchorPosition, focusPosition, selection.anchorOffset, selection.focusOffset].join(':');
    }

    return null;
  }

  public static setSelection(data: string, element: Node) {
    if (data && data.length > 1) {
      const [left, right, start, end] = data.split(':');

      const leftNode: Node = this.getNode(left.split(','), element);
      const rightNode: Node = this.getNode(right.split(','), element);

      if (leftNode && rightNode) {
        const selection: Selection = document.getSelection();

        selection.setBaseAndExtent(leftNode, Number(start), rightNode, Number(end));
        leftNode.parentElement?.scrollIntoView({ block: 'center' });
      }
    }
  }

  private static getPosition(node: Node, $root: Node) {
    const position = [];
    let nodes = 0;

    while (node.parentNode && node.parentNode !== $root) {
      let child: Node = node;
      let siblings = 0;

      while ((child = <HTMLElement>child.previousSibling) !== null) {
        siblings++;
      }

      position.push(siblings);
      node = <HTMLElement>node.parentNode;
    }

    while (node && node.previousSibling) {
      nodes++;
      node = <HTMLElement>node.previousSibling;
    }

    position.push(nodes);

    return position;
  }

  private static getNode(position: string[], root: Node): Node {
    const index = position.length - 1;
    let node = root.childNodes[Number(position[index])];

    for (let i = index - 1; i >= 0 && node; i--) {
      node = node.childNodes[Number(position[i])];
    }

    return node;
  }
}
