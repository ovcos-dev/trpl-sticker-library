{
    function addSliderToTextLayer() {
        var proj = app.project;
        if (!proj) return;

        var activeItem = proj.activeItem;
        if (!(activeItem instanceof CompItem)) {
            alert("컴포지션을 선택해 주세요.");
            return;
        }

        var selectedLayers = activeItem.selectedLayers;
        if (selectedLayers.length === 0) {
            alert("텍스트 레이어를 선택해 주세요.");
            return;
        }

        app.beginUndoGroup("Add Slider to Text");

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];

            if (!(layer.property("Source Text"))) {
                alert("텍스트 레이어만 가능합니다.");
                continue;
            }

            // Slider Control 추가
            var slider = layer.Effects.addProperty("ADBE Slider Control");

            // 텍스트 표현식 연결
            var expr = 
                "s = effect(\"" + slider.name + "\")(\"Slider\");\n" +
                "Math.round(s);";

            layer.property("Source Text").expression = expr;
        }

        app.endUndoGroup();
    }

    addSliderToTextLayer();
}