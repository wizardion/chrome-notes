class NodeHistory {
  constructor(root) {
    this.$root = root;
    this.$scroll = root.parentNode;

    this.$stack = [];
    this.$curren = null;

    this.$edited = {
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
  }

  preserve(node, start, value) {
    // var edited = this.$edited || {node: {data: '', }};

    // if (!this.$stack.length) {
    //   this.push(node, start, selected);
    // } else {
    //   this.$stack[this.$curren].caret.backward = start;
    //   this.$stack[this.$curren].selection.backward = selected;
    // }

    // if (this.$edited.node && value === ' ' || !this.$edited.node) {
    //   this.push(node, start, selected);
    //   this.$edited.node = null;
    // }

    if (this.$edited.node && value === ' ') {
      console.log({
        'data': node.data,
        'html': this.$root.innerHTML,
      }, 'preserve.push');

      this.push(node, start);
    }

    // console.log({
    //   '1': this.$edited && this.$edited.data || '',
    //   '2': node.data,
    //   '3': node.data.replace(this.$edited && this.$edited.data || '', ''),
    //   '4': value,
    // }, 'preserve', this.$stack);

    // console.log({
    //   'data': node.data,
    //   'start': start,
    // }, 'preserve', this.$stack);

    // this.$edited.data = node.data;
    this.$edited.node = node;
    this.$edited.start = start;
    this.$edited.selected = 0;
  }

  ensure(node, start, selected=0) {
    var isEmpty = !this.$stack.length;

    if (!isEmpty && (this.$edited.node) && (this.$edited.node !== node || this.$edited.start !== start)) {
      this.push(this.$edited.node, this.$edited.start, this.$edited.selected);
      return this.push(node, start, selected);
    }

    if (isEmpty || selected) {
      return this.push(node, start, selected);
    }

    this.$edited.node = node;
    this.$edited.start = start;
    this.$edited.selected = selected;
  }

  ensure_(node, start, selected=0) {
    if (!node) {
      return;
    }

    if ((!this.$stack.length) || (selected) || 
        (this.$edited.node && (this.$edited.node !== node || this.$edited.start !== start))) {
      console.log('ensure.push');
      this.push(node, start, selected);
    } else {
      this.$edited.node = node;
      this.$edited.start = start;
      this.$edited.selected = selected;
    }
  }

  ensure2(node, start, selected=0) {
    var push = (node && 
      (!this.$stack.length || selected || 
        (this.$edited.node && (this.$edited.node !== node || this.$edited.start !== start))))

    if (push) {
      console.log('ensure.push');
      this.push(node, start, selected);
    } else {
      this.$edited.node = node;
      this.$edited.start = start;
      this.$edited.selected = selected;
    }
  }

  ensure3(node, start, selected=0) {
    var push = false;

    if (node && !this.$stack.length) {
      push = true;
    } else {
      if (node && this.$edited.node && (selected || this.$edited.node !== node || this.$edited.start !== start)) {
        push = true;
      }
    }

    if (push) {
      console.log('ensure.push');
      this.push(node, start, selected);
    } else {
      this.$edited.node = node;
      this.$edited.start = start;
      this.$edited.selected = selected;
    }
  }

  ensure5(node, start, selected=0) {
    var isEmpty = !this.$stack.length;
    var oldPush = (this.$edited.node) && (this.$edited.node !== node || this.$edited.start !== start);
    var push =  (oldPush && isEmpty) || (selected);

    if (!isEmpty && oldPush) {
      this.push(this.$edited.node, this.$edited.start, this.$edited.selected);
    }

    if (push) {
      this.push(node, start, selected);
    } else {
      this.$edited.node = node;
      this.$edited.start = start;
      this.$edited.selected = selected;
    }
  }

  ensure4(node, start, selected=0) {
    if (node && !this.$stack.length) {
      this.push(node, start, selected);
    } else {
      if (this.$edited.node) {
        if ((this.$edited.node !== node) || (this.$edited.start !== start)) {
          console.log('prev: ensure.push');
          this.push(this.$edited.node, this.$edited.start, this.$edited.selected);

          if (!selected) {
            this.push(node, start, selected);
          }
        }
      }

      // this.$edited.data = node.data;
      this.$edited.node = node;
      this.$edited.start = start;
      this.$edited.selected = selected;

      if (this.$edited.node && this.$edited.selected) {
        console.log('cur: ensure.push');
        this.push(node, start, selected);
      }
    }
  }

  back(selection) {
    if (this.$edited.node) {
      this.push(this.$edited.node, this.$edited.start, this.$edited.selected);
      console.log('back.push', this.$stack);
    }

    console.log({
      '': this.$curren
    });

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
}
