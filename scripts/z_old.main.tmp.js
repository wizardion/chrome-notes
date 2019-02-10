window.addEventListener('load', function(){
    console.log('load main');

    // var element = document.getElementById(selector.replace('#', ''));

    $('.details-view').show();
    var editor = $('.fast-note')[0];

//     editor.addEventListener("copy", function(e) {
//         // cancel paste
//         // e.preventDefault();

//         // var selection = window.getSelection();

//         // var range = window.getSelection().getRangeAt(0);
//         // var selectionContents = range.extractContents();
// // 
//         // console.log(selectionContents[0]);

//         // var selectedText = window.getSelection().textContent;

//         // console.log(selectedText);

//         // setTimeout(function (arguments) {
//         //     var clipboard = (e.originalEvent || e).clipboardData;
    
//         //     var data = clipboard.getData('text/html');
//         //     var text = clipboard.getData('text/plain');

//         //     console.log(data);
//         // }, 1500);

//         // document.execCommand("copy");

//         // document.execCommand('copy');

//         // var clipboard = (e.originalEvent || e).clipboardData;
//         // var data = clipboard.getData('text/html');

//         // console.log(data);

//         // console.log(window.getSelection());

//         // var clipboard = (e.originalEvent || e).clipboardData;

//         // console.log(clipboard.getData('text/plain'));


//     });

    // editor.addEventListener("cut", function(e) {

    // });

    /*

    editor.addEventListener('input', function(){
        // $('#text-div').innerText = this.innerHTML.replace(/&nbsp;/gi, ' ');
        $('#text-div').innerText = this.innerHTML;

        // var prepared = 'test two <a href="/test" name="test1" id="id-1" src="/url/1/" style="color: red;" >test w</a>';
        

        // console.log('' + exPattern);


        // var prepared = 'control<br style="box-sizing:1" name="1"> test <a name="2">test</a>'
        // var prepared = 'test two <a href="/test" name="test1" id="id-1" src="/url/1/" style="color: red;" >test w</a>';

        // var allowedAttributes = ['href', 'id', 'name', 'src'];
        // var regex = '<\\s*(\\w+)\\s*' + 
        // ('(' + allowedAttributes.join('=[\'"][^\'"]*[\'"]\\s*)?(') + '=[\'"][^\'"]*[\'"]\\s*)?') +
        // '(.*?)>';
        // // regex = '<(\\w+)\\s*(name=[\'"][^\'"]*[\'"]\\s*)?(.*?)>';
        // var reg = new RegExp(regex, 'gi');

        // console.log(regex);

        // var reg = new RegExp('<(\\w+)\\s*' + 
        // '(?:(?:(?:(?!href=|id=|name=|src=)[^>]))*((?:href|id|name|src)=[\'"][^\'"]*[\'"]\\s*)?)' +
        // '[^>]*>', 'gi');

        /*var exPatterns = ['$1'];
        var attrPatterns = [];

        for(var i = 0; i < allowedAttributes.length; i++){
            exPatterns.push('$' + (i + 2));

            attrPatterns.push(
                '(?:(?:(?:(?!' + allowedAttributes.join('=|') + '=)[^>]))*((?:' + 
                allowedAttributes.join('|') + ')=[\'"][^\'"]*[\'"]\\s*)?)'
            );
        }

        var reg = new RegExp('<(\\w+)\\s*' + attrPatterns.join('') + '[^>]*>', 'gi');

        prepared = prepared.replace(reg, '<' + exPatterns.join(' ') + '>');

        $('#text-div').innerText = prepared +
         '\n\n' + 
         prepared.replace(reg, '<$1 $2>') +
         '\n\n----------\n' + 
         prepared.replace(reg, '\n1=<$1>\n2=<$2>\n3=<$3>\n4=<$4>\n5=<$5>\n');

        // console.log(exPattern);
        console.log(prepared.match(reg));*/

    // });
    
    editor.addEventListener('input', function(){
        // $('#text-div').innerText = this.innerHTML.replace(/&nbsp;/gi, ' ');
        $('#text-div').innerText = this.innerHTML;

        // var prepared = 'test two <a href="/test" name="test1" id="id-1" src="/url/1/" style="color: red;" >test w</a>';
        

        // console.log('' + exPattern);


        var prepared = 'control<br style="box-sizing:1" name="1"> test <a name="2">test</a>'
        // var prepared = 'test two <a href="/test" name="test1" id="id-1" src="/url/1/" style="color: red;" >test w</a>';

        var allowedAttributes = ['name'];
        // var regex = '<\\s*(\\w+)\\s*' + 
        // ('(' + allowedAttributes.join('=[\'"][^\'"]*[\'"]\\s*)?(') + '=[\'"][^\'"]*[\'"]\\s*)?') +
        // '(.*?)>';
        // // regex = '<(\\w+)\\s*(name=[\'"][^\'"]*[\'"]\\s*)?(.*?)>';
        // var reg = new RegExp(regex, 'gi');

        // console.log(regex);

        var reg = new RegExp('<(\\w+)\\s*' + 
        '(?:(?:(?:(?!href=|id=|name=|src=)[^>]))*((?:href|id|name|src)=[\'"][^\'"]*[\'"]\\s*)?)' +
        '[^>]*>', 'gi');

        var exPattern = '$1';
        for(var i = 0; i < allowedAttributes.length; i++){
            exPattern += ' $' + (i + 2)
        }

        prepared = prepared.replace(reg, '<' + exPattern + '>');

        $('#text-div').innerText = prepared +
         '\n\n' + 
         prepared.replace(reg, '<$1 $2>') +
         '\n\n----------\n' + 
         prepared.replace(reg, '\n1=<$1>\n2=<$2>\n3=<$3>\n4=<$4>\n5=<$5>\n');

        // console.log(exPattern);
        console.log(prepared.match(reg));

    });

    editor.addEventListener("paste", function(e) {
        // cancel paste
        e.preventDefault();

        var tags = 'a|b|strong';
        var clipboard = (e.originalEvent || e).clipboardData;
        var data = clipboard.getData('text/html').toString();
        // var text = clipboard.getData('text/plain');

        var prepared = data;
        // prepared = prepared.replace(new RegExp('<\/(li|p|h[0-9])>', 'gi'), '<br/>');
        // prepared = prepared.replace(/<\s*(\w+).*?>/gi, '<$1>');



        // var allowedAttributes = ['href'];
        // var reg = new RegExp('<\\s*(\\w+)\\s*' + 
        // ('(' + allowedAttributes.join('=[\'"][^\'"]*[\'"]\\s*?)(') + '=[\'"][^\'"]*[\'"]\\s*?)') +
        // '(.*?)>', 'gi');

        // var exPattern = '$1';
        // for(var i = 0; i < allowedAttributes.length; i++){
        //     exPattern += ' $' + (i + 2)
        // }

        // prepared = prepared.replace(reg, '<' + exPattern + '>');

        // console.log(prepared);
        


        // (?href=|id=|name=)
        // (?!class=|id=|name=)
        // /(<\/?(?:a|b|strong)[^>]*>)|<[^>]+>/gi
        var rules = new RegExp('(<\/?(?:' + tags + ')[^>]*>)|<[^>]+>', 'gi');
        var replaced = prepared.replace(rules, '$1');

        // console.log(data);
        // console.log(prepared);
        // console.log(replaced);
    
        // insert text manually
        document.execCommand("insertHTML", false, replaced);
    });
    
    */

    $('#text-div').innerText = editor.innerHTML;

    editor.addEventListener('input', function(){
        // $('#text-div').innerText = this.innerHTML.replace(/&nbsp;/gi, ' ');
        $('#text-div').innerText = this.innerHTML;

        // var reg = /<\s*(\w+).*?>/gi
        // var reg = /<\s*(\w+)\s*(href=['"][^'"]*['"]\s*?)(.*?)>/gi;

        // var reg = new RegExp('<(\\w+)\\s*(?:(?:(?:(?!class=|id=|name=)[^>]))*((?:class|id|name)=[\'"][^\'"]*[\'"]\\s*)?)(?:(?:(?:(?!class=|id=|name=)[^>]))*((?:class|id|name)=[\'"][^\'"]*[\'"]\\s*)?)(?:(?:(?:(?!class=|id=|name=)[^>]))*((?:class|id|name)=[\'"][^\'"]*[\'"]\\s*)?)[^>]*>', 'gi');
        // var reg = new RegExp('<(\\w+)\\s*' + 
        // '(?:(?:(?:(?!href=|id=|name=|src=)[^>]))*((?:href|id|name|src)=[\'"][^\'"]*[\'"]\\s*)?)' +
        // '(?:(?:(?:(?!href=|id=|name=|src=)[^>]))*((?:href|id|name|src)=[\'"][^\'"]*[\'"]\\s*)?)' +
        // '(?:(?:(?:(?!href=|id=|name=|src=)[^>]))*((?:href|id|name|src)=[\'"][^\'"]*[\'"]\\s*)?)' + 
        // '(?:(?:(?:(?!href=|id=|name=|src=)[^>]))*((?:href|id|name|src)=[\'"][^\'"]*[\'"]\\s*)?)' + 
        // '[^>]*>', 'gi');
    });

    editor.addEventListener("paste", function(e) {
        // cancel paste
        e.preventDefault();

        var clipboard = (e.originalEvent || e).clipboardData;
    
        // var data = clipboard.getData('text/html').toString();
        var data = clipboard.getData('text/html');
        var text = clipboard.getData('text/plain');
        // var text = (e.originalEvent || e).clipboardData.getData('text/html');
        // var text = (e.originalEvent || e).clipboardData.getData('text/uri-list');

        // data = '<div>this is a test <p attribute1="val1" attribute2="val2" attribut="val3">text blah blah</p></div>';

        // console.log(data);
        // console.log(data.replace('/<(\w+)[^>]*>/', '<$1>'));
        // var replaced = data.replace('style=(\"|\')[^(\"|\')]*(\"|\')', '');
        // var replaced = data.replace(/<\s*(\w+).*?>/, '<$1>');
        // var replaced = data.replace(new RegExp(/<\s*(\w+).*?>/, 'g'), '<$1>').replace(/\<meta\>/gi, '');
        
        // var prepared = data.replace(/<\s*(\w+).*?>/g, '<$1>').replace(/\<meta\>/gi, '');
        // var replaced = prepared.replace(/<\/(li)>/g, '<br/>');
        // replaced = replaced.replace(/<(\/)?(p|ul|li|h.)>/g, '');

        var prepared = data.replace(/<\/(li)>/g, '<br/>').replace(/<\s*(\w+).*?>/g, '<$1>');
        // var replaced = prepared.replace(/(<((?!(br))[^>]+)>)/ig, '');
        var replaced = prepared.replace(/(<\/?(?:a|b|strong)[^>]*>)|<[^>]+>/ig, '$1');;
        // var replaced = prepared.replace('</?(?!(?:br|strong|b)\b)[a-z](?:[^>"\']|"[^"]*"|\'[^\']*\')*>/gi', '');

        console.log(prepared);
        console.log(replaced);
    
        // insert text manually
        // document.execCommand("insertHTML", false, data);
        document.execCommand("insertHTML", false, replaced);
    });

    var EventListener = function(e) {

    };

    var copyEvent = function(e){

    }


    // $('#notes', true).Notes({
    //     list_view: $(".list-view")[0],
    //     details_view: $(".details-view")[0],
    //     item_template: $(".list-item")[0],
    //     list_items: $(".list-items")[0],
    //     title_span: $(".title")[0],
    //     description_input: $(".fast-note")[0],
    //     back_button: $(".back")[0],
    //     add_button: $(".add-note")[0],
    //     delete_button: $(".delete")[0],
    //     search_button: $(".search-button")[0],
    //     loading: $(".loading")[0]
    // });
});



// window.onload = function(){

    
//     $('#notes', true).Notes({
//         list_view: $(".list-view")[0],
//         details_view: $(".details-view")[0],
//         item_template: $(".list-item")[0],
//         list_items: $(".list-items")[0],
//         title_span: $(".title")[0],
//         description_input: $(".fast-note")[0],
//         back_button: $(".back")[0],
//         add_button: $(".add-note")[0],
//         delete_button: $(".delete")[0],
//         search_button: $(".search-button")[0],
//         loading: $(".loading")[0]
//     });
// }