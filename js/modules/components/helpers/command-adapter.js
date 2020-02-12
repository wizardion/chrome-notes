class CommandAdapter extends Helper {
  constructor (element, keyCode) {
    super(element, keyCode);

    
  }

  command(action) {
    let scrollTop = this.$element.parentNode.scrollTop;

    console.log({
      'action': action
    })

    document.execCommand(action);
    this.$element.parentNode.scrollTop = scrollTop;
  }
}