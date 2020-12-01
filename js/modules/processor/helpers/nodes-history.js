class NodeHistory {
  constructor(root) {
    this.$root = root;

    this.$stack = [];
    this.$curren = null;
  }

  push(node, start) {
    var data = {
      html: this.$root.innerHTML,
      len: this.$root.innerHTML.length,

      start: start,
      selected: 0,
      possition: this.$getPossition(node),

      nodes: this.$root.childNodes
    };

    if (this.$curren && this.$curren < this.$stack.length - 1) {
      this.$stack = this.$stack.splice(0, this.$curren + 1);
    }

    this.$stack.push(data);
    this.$curren = this.$stack.length - 1;
  }

  preserve(node, start, selected) {
    if (!this.$stack.length) {
      this.$setHistory(node, start);
    } else {
      this.$stack[this.$curren].selected = selected;
      this.$stack[this.$curren].start = start;
    }
  }

  back(selection) {
    if (this.$curren - 1 < 0) {
      return;
    }

    this.$curren -= 1;
    this.$popData(selection);
  }

  forward(selection) {
    if (this.$curren + 1 > this.$stack.length - 1) {
      return;
    }

    this.$curren += 1;
    this.$popData(selection);
  }

  reset() {
    this.$stack = [];
    this.$curren = null;
  }

  $popData(selection) {
    var data = this.$stack[this.$curren];

    console.log({
      'h': this.$stack
    });

    if (data) {
      this.$root.innerHTML = data.html;
      let node = this.$getNode(data.possition);

      selection.setBaseAndExtent(node, data.start, node, data.start + data.selected);
    }
  }

  $getPossition(node) {
    var children = 0;
    var nodes = 0;

    while (node.parentNode && node.parentNode !== this.$root) {
      children++;
      node = node.parentNode;
    }

    while (node && node.previousSibling) {
      nodes++;
      node = node.previousSibling;
    }

    return { children: children, nodes: nodes };
  }

  $getNode(possition) {
    var node = this.$root.childNodes[possition.nodes];

    for (var i = 0; i < possition.children; i++) {
      node = node.firstChild;
    }

    return node;
  }
}
