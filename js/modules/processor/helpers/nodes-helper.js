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
  backToPrevous(nodeElement) {
    var node = this.$deegDown(nodeElement);
    var sibling = node.previousSibling;

    if (!sibling) {
      sibling = this.$backToUp(node);

      if (!sibling) {
        return null;
      }
    }

    sibling = this.$deegDown(sibling);

    if (this.isEmptyNode(node)) {
      console.log({'remove_3': node});
      node.remove();
    }

    //#region END
    // if (this.isEmptyNode(sibling)) {
    //   console.log({'remove_3': sibling});
    //   sibling.remove();
    //   return null;
    // }
    console.log('-------------------- RESULT --------------------');
    console.log(sibling);
    //#endregion

    return sibling;
    //#endregion
  }

  $backToUp(node) {
    var sibling;

    console.log('-------------------- UP --------------------');
    console.log(node);

    while (node.parentNode && node.parentNode !== this.$root) {
      var tmp = null;

      if (this.isEmptyNode(node)) {
        console.log({'remove_1': node});
        tmp = node;
      }

      node = node.parentNode;
      console.log(node);

      if (tmp) {
        tmp.remove();
        tmp = null;
      }

      if (node.previousSibling) {
        sibling = node.previousSibling;

        if (this.isEmptyNode(node)) {
          console.log({'remove_2': node});
          node.remove();
        }

        break;
      }
    }

    //#region END
    if (this.isEmptyNode(node)) {
      console.log({'remove_2': node});
      node.remove();
    }

    console.log({
      'sibling': sibling,
      // 'node': node,
    });

    return sibling;
    //#endregion
  }

  $frontToUp(node) {
    var sibling;

    console.log('-------------------- UP --------------------');
    console.log(node);

    while (node.parentNode && node.parentNode !== this.$root) {
      var tmp = null;

      if (this.isEmptyNode(node)) {
        console.log({'remove_1': node});
        tmp = node;
      }

      node = node.parentNode;
      console.log(node);

      if (tmp) {
        tmp.remove();
        tmp = null;
      }

      if (node.nextSibling) {
        sibling = node.nextSibling;

        if (this.isEmptyNode(node)) {
          console.log({'remove_2': node});
          node.remove();
        }

        break;
      }
    }

    //#region END
    if (this.isEmptyNode(node)) {
      console.log({'remove_2': node});
      node.remove();
    }

    console.log({
      'sibling': sibling,
      // 'node': node,
    });

    return sibling;
    //#endregion
  }

  $deegDown(sibling) {
    console.log('-------------------- DOWN --------------------');
    console.log(sibling);

    while (sibling && sibling.lastChild) {
      sibling = sibling.lastChild;
      console.log(sibling);
    }

    return sibling;
  }

  merge(node) {
    var sibling = node.nextSibling;

    if (!sibling) {
      sibling = this.$frontToUp(node);

      if (!sibling) {
        return null;
      }
    }

    sibling = this.$deegDown(sibling);

    // document.insertBefore()
    this.$insertAfter(sibling, node);
  }

  isEmptyNode(node) {
    var result = (
      (node.nodeType === Node.TEXT_NODE && !node.data.length) || 
      (node.nodeType !== Node.TEXT_NODE && !node.lastChild)
    );

    return result;
  }

  $insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
  }

}