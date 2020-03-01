var btns = [{"id":"x", "innerHTML":"X", "directional":false},
            {"id":"", "innerHTML":"", "directional":false},
            {"id":"y", "innerHTML":"Y", "directional":false},
            {"id":"a", "innerHTML":"A", "directional":false},
            {"id":"Up", "innerHTML":"↑", "directional":true},
            {"id":"b", "innerHTML":"B", "directional":false},
            {"id":"Left", "innerHTML":"←", "directional":true},
            {"id":"Down", "innerHTML":"↓", "directional":true},
            {"id":"Right", "innerHTML":"→", "directional":true}];
            
var selectElem = document.getElementById("playerSelect");
var selectButton = document.getElementById("playerSelectButton");
    
/**
 * Sets multiselect buttons of controller
 */
function SetTableButtons(tableButtonCounts) {
    selectElem.disabled = false;
    selectButton.disabled = false;
    selectElem.classList.remove('disabledButton');
    selectButton.classList.remove('disabledButton');
    selectElem.options.length = 0;
    for(var i = 0; i < tableButtonCounts[0]; i++) {
        var opt = document.createElement('option');
        if(i == 0) opt.selected = true;
        opt.value = i;
        opt.innerHTML = "Hero " + i;
        selectElem.appendChild(opt);
    }
}

selectButton.onclick = function () {
    var key = "Select";
    if(enabledButtons == null || !arrayContains(enabledButtons, key))
        return;
    var selectedHero = selectElem.options[selectElem.selectedIndex].value;
    if(selectedHero == null || selectedHero == "")
        return;
    PostKeyMessageToContainer("Key--" + key + "--Press--" + selectedHero);
};