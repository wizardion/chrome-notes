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
  backToPrevous(node) {
    var sibling = node.previousSibling;

    //#region  UP
    if (!sibling) {
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

      if (this.isEmptyNode(node)) {
        console.log({'remove_2': node});
        node.remove();
      }

      console.log({
        'sibling': sibling,
        // 'node': node,
      });

      if (!sibling) {
        return null;
      }
    }
    //#endregion

    //#region DOWN
    console.log('-------------------- DOWN --------------------');
    console.log(sibling);
    while (sibling.lastChild) {
      sibling = sibling.lastChild;
      console.log(sibling);
    }

    if (this.isEmptyNode(node)) {
      console.log({'remove_3': node});
      node.remove();
    }

    // if (this.isEmptyNode(sibling)) {
    //   console.log({'remove_3': sibling});
    //   sibling.remove();
    //   return null;
    // }
    console.log('-------------------- RESULT --------------------');
    console.log(sibling);
    //#endregion

    return sibling;
  }

  isEmptyNode(node) {
    var result = (
      (node.nodeType === Node.TEXT_NODE && !node.data.length) || 
      (node.nodeType !== Node.TEXT_NODE && !node.lastChild)
    );

    // console.log({
    //   'is':  (node.nodeType === Node.TEXT_NODE)? node.data : node.outerHTML,
    //   'result': result
    // })

    return result;
  }

}