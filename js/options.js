var _view = null;

window.onload = function(){
    var reset = document.getElementById('reset-timer');

    document.getElementById('help-tab').onclick = help;
    document.getElementById('options-tab').onclick = options;
    document.getElementById('options-tab').onclick();

    if(!localStorage.reset_timers){
        localStorage.reset_timers = true;
    }

    reset.onchange = resetTimer;
    if(localStorage.reset_timers == 'true'){
        reset.setAttribute('checked', 'checked');
    }

    //chrome.storage.sync.get('value2', register);
}

//----------------------------------------------------------------------------------------------------
function openTab(view, tab){
    var selected = document.getElementsByClassName('selected')[0];

    if(_view){
        _view.style.display = 'none';
    }

    if(selected){
        selected.className = selected.className.replace(/(selected)/g,"");
    }

    _view = view;
    tab.className += 'selected';
    view.style.display = 'block';

    return false;
}

//----------------------------------------------------------------------------------------------------
function help(){
    return openTab(document.getElementById('help-view'), this);
}

//----------------------------------------------------------------------------------------------------
function options(){
    return openTab(document.getElementById('options-view'), this);
}

//----------------------------------------------------------------------------------------------------
function resetTimer(){
    localStorage.reset_timers = this.checked;
}

//----------------------------------------------------------------------------------------------------
function register(user){
    if(!user.value2){

    }
}

function Test(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://music-world.cc.ua/test2.php", true);
    xhr.setRequestHeader();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            // WARNING! Might be injecting a malicious script!
            //document.getElementById("help-view").innerHTML = xhr.responseText;
            alert(xhr.responseText)
        }
    }
    xhr.send("");
}