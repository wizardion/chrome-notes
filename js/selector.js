class HtmlElement {
  constructor(selector=new String) {
    var element = document.getElementById(selector.replace('#', ''));

    if(!element) {
      element = document.getElementsByClassName(selector.replace('.', ''));
      var matches = selector.match(/^\.([a-z\-]+)(\[(\d)\])?$/);

      if(matches && matches.length > 0) {
        element = document.getElementsByClassName(matches[1])

        if(matches[3]) {
          element = element[parseInt(matches[3])]
        }
      }
    }

    if(!element){
      throw 'Element {' + selector + '} is not found!'
    }

    this.element = element;
  }

  show() {
    this.element.style.display = 'inherit';
  }

  hide() {
    this.element.style.display = 'none';
  }

  clone() {
    return this.element.cloneNode(true);
  }

  focus() {
    this.element.focus();
  }

  event(name, callback) {
    this.element.addEventListener(name, callback);
  }
  
  append(item) {
    this.element.appendChild(item)
  }
  
  html(value) {
    if (value === null || value === undefined) {
      return this.element.innerHTML;
    }

    this.element.innerHTML = value;
  }

  text(value) {
    if (value === null || value === undefined) {
      return this.element.innerText;
    }

    this.element.innerText = value;
  }
}

Date.prototype.toLocale = function() {
  // var date = this.toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  //var time = this.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" })
  var date = this.toDateString();
  return date;
}

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, '')
}