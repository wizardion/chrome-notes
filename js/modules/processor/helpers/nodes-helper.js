class NodeHelper {
  constructor (root, nodes) {
    this.$root = root;
    this.$nodes = nodes;
  }

  // The End of the node!
  /*
    1 - "#text<b>#text</b>#text".
    2 - "#text<b>#text<i>#text</i></b>#text".
    3 - "#text<b>#text<u><i>#text</i></u></b>#text".
    4 - "#text<b>#text<i>#text</i>#text</b>#text".
    5 - "<b>#text<u><i>#text</i></u></b>".
  */
  backToPrevous(nodeElement, toSibling) {
    var node = this.$deegDown(nodeElement, toSibling);
    var sibling = node[toSibling];

    if (!sibling) {
      sibling = this.$moveUp(node, toSibling);

      if (!sibling) {
        return null;
      }
    }

    if (this.isEmpty(node)) {
      node.remove();
    }

    return this.$deegDown(sibling, toSibling);
  }

  $moveUp(node, toSibling) {
    var sibling;

    while (node.parentNode && node.parentNode !== this.$root) {
      var tmp = null;

      if (this.isEmpty(node)) {
        tmp = node;
      }

      node = node.parentNode;

      if (tmp) {
        tmp.remove();
        tmp = null;
      }

      if (node[toSibling]) {
        sibling = node[toSibling];

        if (this.isEmpty(node)) {
          node.remove();
        }

        break;
      }
    }

    if (this.isEmpty(node)) {
      node.remove();
    }

    return sibling;
  }

  $deegDown(sibling, toSibling) {
    var dirrection = {'previousSibling': 'lastChild', 'nextSibling': 'firstChild'};
    var toChild = dirrection[toSibling];

    while (sibling && sibling[toChild]) {
      sibling = sibling[toChild];
    }

    return sibling;
  }

  isEmpty(node) {
    return (
      (node.nodeType === Node.TEXT_NODE && !node.data.length) || 
      (node.nodeType !== Node.TEXT_NODE && !node.lastChild)
    );
  }

  //#region Future
  mergeNext(node) {
    var sibling = node.nextSibling;

    if (!sibling) {
      sibling = this.$moveUp(node, 'nextSibling');

      if (!sibling) {
        return null;
      }
    }

    var second = this.$findParagraph(sibling);

    console.log({
      'second': second
    });

    // sibling = this.$deegDown(sibling);

    // // document.insertBefore()
    // this.$insertAfter(sibling, node);
  }

  $findParagraph(node) {
    console.log('-------------------- FIND --------------------');
    while (node && node.nextSibling) {
      var value = this.$toString(node);

      if (node.nodeType === Node.TEXT_NODE && node.data.match(/\r|\n/gi)) {
        return node;
      }

      if (node.nodeType !== Node.TEXT_NODE && node.outerHTML.match(/\r|\n/gi)) {
        return node;
      }

      // if (this.$toString(node).indexOf('\n') >= 0)

      node = node.nextSibling;
    }

    console.log({
      'node2': this.$toString(node)
    });
  }

  $toString(node) {
    return node && (node.nodeType === Node.TEXT_NODE ? node.data : node.outerHTML) || null;
  }

  $insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
  }
  //#endregion
}