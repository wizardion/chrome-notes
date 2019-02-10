/*var $ = function(selector, inherit){
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
        throw 'Element is not found!'
    }

    // if(inherit) {
    //     for(var key in $.fn){
    //         element[key] = $.fn[key];
    //     }
    // }

    return element;
}; $.fn = {};*/

// $.fn.show = function() {
//     this.style.display = 'inherit';
// }

// $.fn.hide = function() {
//     this.style.display = 'hidden';
// }
/*
HTMLElement.prototype.show = function() {
    this.style.display = 'inherit';
}

HTMLElement.prototype.hide = function() {
    this.style.display = 'inherit';
}

HTMLCollection.prototype.show = function() {
    var collection = this;

    for (var i = 0; i < collection.length; i++) {
        collection[i].show();
    }
}

HTMLCollection.prototype.hide = function() {
    var collection = this;

    for (var i = 0; i < collection.length; i++) {
        collection[i].hide();
    }
}
*/
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '')
}

Date.prototype.toLocale = function() {
    var date = this.toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit" });
    //var time = this.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" })
    return date;
}