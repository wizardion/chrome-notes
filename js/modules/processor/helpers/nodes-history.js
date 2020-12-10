class NodeHistory {
  constructor(root) {
    this.$root = root;
    this.$scroll = root.parentNode;

    this.$stack = [];
    this.$curren = null;

    this.$edited = {
      added: false,
      type: null,
      node: null,
      start: null,
      selected: null,
    };
  }

  push(node, start, selected=0) {
    var data = {
      html: this.$root.innerHTML,
      possition: this.$getPossition(node),
      caret: {
        forward: start,
        backward: start,
      },
      selection: {
        forward: selected,
        backward: selected,
      }
    };

    if (this.$curren !== null && this.$curren < this.$stack.length - 1) {
      this.$stack = this.$stack.splice(0, this.$curren + 1);
    }

    this.$stack.push(data);
    this.$curren = this.$stack.length - 1;
    this.$edited.node = null;
    this.$edited.added = true;
  }

  preserve(node, start, selected, value, type, push=false) {
    var isEmpty = !this.$stack.length;

    // console.log({
    //   '1': start,
    //   '2': this.$edited.start,
    //   'type': type,
    //   'value': value,
    //   'edited.type': this.$edited.type,
    // });

    if (!isEmpty && this.$edited.node && 
      (this.$edited.node !== node || this.$edited.start !== start)) {
      console.log('preserve.prev.push');
      this.push(this.$edited.node, this.$edited.start, this.$edited.selected);
      return this.push(node, start, selected);
    }

    if (isEmpty || selected || push) {
      console.log('preserve.new.push');
      return this.push(node, start, selected);
    }

    if (this.$edited.node && value && value.match(/\W/i) && 
        (!node.data[start - 1] || !node.data[start - 1].match(/\W/i))) {
      console.log('preserve.match.push');
      return this.push(node, start);
    }

    if (this.$edited.type && this.$edited.type !== type) {
      console.log('preserve.type.push');
      return this.push(node, start);
    }

    this.$edited.node = node;
    this.$edited.start = start;
    this.$edited.selected = selected;
    this.$edited.type = type;
  }

  ensure(node, start, type) {
    this.$edited.added = false;
    this.$edited.node = node;
    this.$edited.start = start;
    this.$edited.selected = 0;
    this.$edited.type = type;
  }

  back(selection) {
    if (this.$edited.node && !this.$edited.added) {
      console.log('preserve.back.push');
      this.push(this.$edited.node, this.$edited.start, this.$edited.selected);
    }

    if (this.$curren - 1 < 0) {
      return;
    }

    this.$curren -= 1;
    return this.$popData(selection, false);
  }

  forward(selection) {
    if (this.$curren + 1 > this.$stack.length - 1) {
      return;
    }

    this.$curren += 1;
    return this.$popData(selection, true);
  }

  reset() {
    this.$stack = [];
    this.$curren = null;
    this.$edited.node = null;
  }

  $popData(selection, forward) {
    var data = this.$stack[this.$curren];

    if (data) {
      this.$root.innerHTML = data.html;
      let node = this.$getNode(data.possition);

      if (node) {
        let start = forward ? data.caret.forward : data.caret.backward;
        let selected = forward ? data.selection.forward : data.selection.backward;

        start = data.caret.forward;

        selection.setBaseAndExtent(node, start, node, start + selected);
        return { left: node, start: start };
      }
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

  $copy(list) {
    var result = [];

    for (var i = 0; i < list.length; i++) {
      const item = list[i];
      result.push(item);
    }

    return result;
  }
}
