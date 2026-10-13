{
app.beginUndoGroup("Auto Monospace FINAL STABLE v3");

var comp = app.project.activeItem;

if (!(comp instanceof CompItem)) {
    alert("컴포지션 선택");
} else if (comp.selectedLayers.length === 0) {
    alert("텍스트 레이어 선택");
} else {

    var base = comp.selectedLayers[0];

    if (!base.property("Source Text")) {
        alert("텍스트 레이어 선택");
    } else {

        var txtDoc = base.property("Source Text").value;
        var pos = base.property("Transform").property("Position").value;
        var anchor = base.property("Transform").property("Anchor Point").value;
        var scale = base.property("Transform").property("Scale").value;

        var parentLayer = base.parent;

        var rect = base.sourceRectAtTime(comp.time, false);
        var initWidth = rect.width;

        base.name = "TEXT_BASE";

        // 🔥 BASE 숨김
        base.enabled = false;
        base.shy = true;

        var valSlider = base.Effects.addProperty("ADBE Slider Control");
        valSlider.name = "Value";

        var widthSlider = base.Effects.addProperty("ADBE Slider Control");
        widthSlider.name = "Target Width";
        widthSlider.property("Slider").setValue(initWidth);

        base.property("Source Text").expression =
        "s = effect(\"Value\")(\"Slider\");\n" +
        "pre = \"\";\n" +
        "suf = \"\";\n" +
        "pad = 3;\n" +
        "dec = 0;\n" +
        "\n" +
        "val = (dec > 0) ? s.toFixed(dec) : Math.round(s).toString();\n" +
        "\n" +
        "if (pad > 0) {\n" +
        "    parts = val.split('.');\n" +
        "    num = parts[0];\n" +
        "    if (num.length < pad) num = ('0000' + num).slice(-pad);\n" +
        "    if (parts.length > 1) val = num + '.' + parts[1];\n" +
        "    else val = num;\n" +
        "}\n" +
        "\n" +
        "pre + val + suf;";

        var out = comp.layers.addText(txtDoc);
        out.name = "TEXT_OUTPUT";

        if (parentLayer != null){
            out.parent = parentLayer;
        }

        out.property("Transform").property("Position").setValue(pos);
        out.property("Transform").property("Anchor Point").setValue(anchor);
        out.property("Transform").property("Scale").setValue(scale);

        out.property("Source Text").expression =
        'thisComp.layer("TEXT_BASE").text.sourceText';

        var textProp = out.property("Text");
        var anim = textProp.property("Animators").addProperty("ADBE Text Animator");

        var tracking = anim.property("ADBE Text Animator Properties")
                           .addProperty("ADBE Text Tracking Amount");

        tracking.expression =
        "base = thisComp.layer(\"TEXT_BASE\");\n" +
        "txt = base.text.sourceText;\n" +
        "len = txt.length;\n" +
        "\n" +
        "if (len <= 1){\n" +
        "  0;\n" +
        "}else{\n" +
        "  r = base.sourceRectAtTime(time,false);\n" +
        "  W = r.width;\n" +
        "  A = base.effect(\"Target Width\")(\"Slider\");\n" +
        "  (A - W) / (len - 1);\n" +
        "}";

        // 🔥 Anchor X만 적용, Y는 유지
        out.property("Transform").property("Anchor Point").expression =
        "r = sourceRectAtTime(time,false);\n" +
        "[r.left + r.width/2, value[1]];";

        out.moveBefore(base);
    }
}

app.endUndoGroup();
}