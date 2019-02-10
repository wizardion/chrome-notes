window.addEventListener('load', function(){
    // $('.details-view').show();
    var editor = new Editor('.fast-note[0]');
    var details = new HtmlElement('.details-view[0]');

    details.show();

    editor.focus();

    // editor.

    

    
    // var element = new Element('.details-view[0]');

    // element.show();

    // var edit = new Edit('');

    // console.log({
    //     'get': edit.get()
    // });

    // edit.show();

});

// window.addEventListener('load', function(){
//     // console.log('load main');

//     // var element = document.getElementById(selector.replace('#', ''));

//     // $('.fast-note[0]', true).Editor();

//     var editor = new Editor($('.fast-note[0]'));
    
    
    
//     $('.details-view').show();


//     return;

//     $('.details-view').show();
//     var editor = $('.fast-note')[0];

//     $('#text-div').innerText = editor.innerHTML;

//     editor.focus();

//     editor.addEventListener('input', function(){
//         // $('#text-div').innerText = this.innerHTML.replace(/&nbsp;/gi, ' ');
//         $('#text-div').innerText = this.innerHTML;
//     });

//     editor.addEventListener("paste", function(e) {
//         // cancel paste
//         e.preventDefault();

//         var clipboard = (e.originalEvent || e).clipboardData;
//         var data = clipboard.getData('text/html').toString();
//         // var text = clipboard.getData('text/plain');

//         var prepared = data;
//         // Replace to <br/>
//         prepared = prepared.replace(new RegExp('<\/(li|p|h[0-9])>', 'gi'), '<br/>');
//         // prepared = prepared.replace(/<\s*(\w+).*?>/gi, '<$1>'); // Completely remove all attributes.

//         // Remove all attributes except allowed.
//         var allowedAttributes = ['href'];
//         var exPatterns = ['$1'];
//         var attrPatterns = [];

//         for(var i = 0; i < allowedAttributes.length; i++){
//             exPatterns.push('$' + (i + 2));

//             attrPatterns.push(
//                 '(?:(?:(?:(?!' + allowedAttributes.join('=|') + '=)[^>]))*((?:' + 
//                 allowedAttributes.join('|') + ')=[\'"][^\'"]*[\'"]\\s*)?)'
//             );
//         }

//         var reg = new RegExp('<(\\w+)\\s*' + attrPatterns.join('') + '[^>]*>', 'gi');
//         prepared = prepared.replace(reg, '<' + exPatterns.join(' ') + '>');


//         // Remove all tags except allowed.
//         var allowedTags = ['a', 'b', 'strong', 'br']; //'a|b|strong';
//         var rules = new RegExp('(<\/?(?:' + allowedTags.join('|') + ')[^>]*>)|<[^>]+>', 'gi');
//         var replaced = prepared.replace(rules, '$1');
    
//         // insert text manually
//         document.execCommand("insertHTML", false, replaced);
//     });


//     // $('#notes', true).Notes({
//     //     list_view: $(".list-view")[0],
//     //     details_view: $(".details-view")[0],
//     //     item_template: $(".list-item")[0],
//     //     list_items: $(".list-items")[0],
//     //     title_span: $(".title")[0],
//     //     description_input: $(".fast-note")[0],
//     //     back_button: $(".back")[0],
//     //     add_button: $(".add-note")[0],
//     //     delete_button: $(".delete")[0],
//     //     search_button: $(".search-button")[0],
//     //     loading: $(".loading")[0]
//     // });
// });



// // window.onload = function(){

    
// //     $('#notes', true).Notes({
// //         list_view: $(".list-view")[0],
// //         details_view: $(".details-view")[0],
// //         item_template: $(".list-item")[0],
// //         list_items: $(".list-items")[0],
// //         title_span: $(".title")[0],
// //         description_input: $(".fast-note")[0],
// //         back_button: $(".back")[0],
// //         add_button: $(".add-note")[0],
// //         delete_button: $(".delete")[0],
// //         search_button: $(".search-button")[0],
// //         loading: $(".loading")[0]
// //     });
// // }