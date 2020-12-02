class NodeHistory {
  constructor(root) {
    this.$root = root;
    this.$scroll = root.parentNode;

    this.$stack = [];
    this.$curren = null;
  }

  push(node, start) {
    var data = {
      html: this.$root.innerHTML,
      len: this.$root.innerHTML.length,

      start: start,
      backStart: start,
      
      selected: 0,
      possition: this.$getPossition(node),

      scroll: this.$scroll.scrollTop,
      backScroll: this.$scroll.scrollTop,

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
      this.push(node, start);
    } else {
      this.$stack[this.$curren].selected = selected;

      this.$stack[this.$curren].backStart = start;
      this.$stack[this.$curren].backScroll = this.$scroll.scrollTop;
    }
  }

  back(selection) {
    if (this.$curren - 1 < 0) {
      return;
    }

    this.$curren -= 1;
    this.$popData(selection, false);
  }

  forward(selection) {
    if (this.$curren + 1 > this.$stack.length - 1) {
      return;
    }

    this.$curren += 1;
    this.$popData(selection, true);
  }

  reset() {
    this.$stack = [];
    this.$curren = null;
  }

  $popData(selection, forward) {
    var data = this.$stack[this.$curren];

    if (data) {
      this.$root.innerHTML = data.html;

      let node = this.$getNode(data.possition);
      let start = forward ? data.start : data.backStart;
      let scroll = forward ? data.scroll : data.backScroll;

      this.$scroll.scrollTop = scroll;
      selection.setBaseAndExtent(node, start, node, start + data.selected);
    }
  }

  $getPossition(node) {
    var possition = [];
    var nodes = 0;

    while (node.parentNode && node.parentNode !== this.$root) {
      let child = node;
      let siblings = 0;

      while ((child = child.previousSibling) != null) {
        siblings++;
      }

      possition.push(siblings);
      node = node.parentNode;
    }

    while (node && node.previousSibling) {
      nodes++;
      node = node.previousSibling;
    }

    possition.push(nodes);
    return possition;
  }

  $getNode(possition) {
    var index = possition.length - 1;
    var node = this.$root.childNodes[possition[index]];

    for (var i = index - 1; i >= 0; i--) {
      node = node.childNodes[possition[i]];
    }

    return node;
  }
}
