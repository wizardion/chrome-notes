
function Editor(domElement)
{
    // const element = domElement;

    const allowedTags = ['a', 'b', 'strong', 'br'];
    const allowedAttributes = ['href'];
    var removeTagsPattern;
    var removeAttributesPattern;

    //----------------------------------------------------------------------------------------------------
    // Constructor
    //----------------------------------------------------------------------------------------------------
    (function(self) {
        // Remove all tags except allowed.
        self.removeTagsPattern = new RegExp('(<\/?(?:' + allowedTags.join('|') + ')[^>]*>)|<[^>]+>', 'gi');
        // var replaced = prepared.replace(rules, '$1');

        // this.addEventListener("paste", self.onPaste);
    })(this);

    //----------------------------------------------------------------------------------------------------
    // Events
    //----------------------------------------------------------------------------------------------------
    function onPaste(e) {
        console.log({
            'removeTagsPattern': this.removeTagsPattern
        });
    }
}


// $.fn.Editor = function(controls)
// {
//     const allowedTags = ['a', 'b', 'strong', 'br'];
//     const allowedAttributes = ['href'];
//     var removeTagsPattern;
//     var removeAttributesPattern;

//     //----------------------------------------------------------------------------------------------------
//     // Constructor
//     //----------------------------------------------------------------------------------------------------
//     (function(self) {

//         // Remove all tags except allowed.
//         this.removeTagsPattern = new RegExp('(<\/?(?:' + allowedTags.join('|') + ')[^>]*>)|<[^>]+>', 'gi');
//         // var replaced = prepared.replace(rules, '$1');

//         this.addEventListener("paste", this.onPaste);



//     }).apply(this);

//     //----------------------------------------------------------------------------------------------------
//     // Events
//     //----------------------------------------------------------------------------------------------------
//     function onPaste(e) {
//         console.log({
//             'removeTagsPattern': this.removeTagsPattern
//         });
//     }
// }