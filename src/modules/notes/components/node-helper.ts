export class NodeHelper {
  public static getSelection(element: Node): string {
    var selection: Selection = document.getSelection();
    var selected = selection.toString().length;

    if (selected) {
      let anchorPossition = this.getPossition(<HTMLElement>selection.anchorNode, element);
      let focusPossition = this.getPossition(<HTMLElement>selection.focusNode, element);

      return [anchorPossition, focusPossition, selection.anchorOffset, selection.focusOffset].join(':');
    }

    return '';
  }

  public static setSelection(data: string, element: Node) {
    if (data && data.length) {
      let [left, right, start, end] = data.split(':');
      
      let leftNode: Node = this.getNode(left.split(','), element);
      let rightNode: Node = this.getNode(right.split(','), element);
      let selection: Selection = document.getSelection();

      selection.setBaseAndExtent(leftNode, parseInt(start), rightNode, parseInt(end));
    }
  }

  private static getPossition(node: Node, $root: Node) {
    var possition = [];
    var nodes = 0;

    while (node.parentNode && node.parentNode !== $root) {
      let child: Node = node;
      let siblings = 0;

      while ((child = <HTMLElement>child.previousSibling) != null) {
        siblings++;
      }

      possition.push(siblings);
      node = <HTMLElement>node.parentNode;
    }

    while (node && node.previousSibling) {
      nodes++;
      node = <HTMLElement>node.previousSibling;
    }

    possition.push(nodes);
    return possition;
  }

  private static getNode(possition: string[], $root: Node): Node {
    var index = possition.length - 1;
    var node = $root.childNodes[parseInt(possition[index])];

    for (var i = index - 1; i >= 0; i--) {
      node = node.childNodes[parseInt(possition[i])];
    }

    return node;
  }
}