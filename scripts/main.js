window.onload = function(){
    //var bgr = chrome.extension.getBackgroundPage();

    $('#notes').Notes({
        back_bt: 'back',
        add_bt: 'add-note',
        delete_bt: 'delete',

        title: 'title',
        edit_title: 'edit-title',

        list_view: 'list-view',
        edit_view: 'edit-view',

        description: 'fast-note',
        list_item: 'list-item'
    });
}

