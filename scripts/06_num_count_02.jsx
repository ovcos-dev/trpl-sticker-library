/**
 * A Text Controller (Clean & Fixed Version)
 * - 선택된 텍스트 레이어에 Slider Control 자동 추가
 * - Prefix / Suffix 적용
 * - Zero Padding (00, 000, 0000)
 * - Decimal(소수점) 자리 옵션
 * - Multi-layer 지원
 * - 모든 표현식 .value 처리 적용 → toFixed 오류 해결
 * - Dockable UI Panel
 */

(function (thisObj) {

    // -----------------------------
    // UI BUILD
    // -----------------------------
    function buildUI(thisObj) {

        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "A Text Controller", undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];


        // === Format Panel ===
        var gFormat = win.add("panel", undefined, "Format");
        gFormat.orientation = "column";
        gFormat.alignChildren = "left";

        // Prefix
        var prefixGroup = gFormat.add("group");
        prefixGroup.add("statictext", undefined, "Prefix:");
        var prefixTxt = prefixGroup.add("edittext", undefined, "");
        prefixTxt.characters = 8;

        // Suffix
        var suffixGroup = gFormat.add("group");
        suffixGroup.add("statictext", undefined, "Suffix:");
        var suffixTxt = suffixGroup.add("edittext", undefined, "");
        suffixTxt.characters = 8;

        // Zero Padding
        var zeroPadGroup = gFormat.add("group");
        zeroPadGroup.add("statictext", undefined, "Zero Padding:");
        var zeroPad = zeroPadGroup.add("dropdownlist", undefined,
            ["None", "00", "000", "0000"]
        );
        zeroPad.selection = 0;

        // Decimal
        var decimalGroup = gFormat.add("group");
        decimalGroup.add("statictext", undefined, "Decimals:");
        var decimal = decimalGroup.add("dropdownlist", undefined, ["0", "1", "2", "3"]);
        decimal.selection = 0;


        // === Button ===
        var gButtons = win.add("group");
        gButtons.orientation = "row";
        var btnApply = gButtons.add("button", undefined, "Apply to Selected");




        // -----------------------------
        // MAIN FUNCTION
        // -----------------------------
        function applyToSelected() {
            app.beginUndoGroup("A Text Controller");

            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                alert("컴포지션을 선택하세요.");
                return;
            }

            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                alert("텍스트 레이어를 선택하세요.");
                return;
            }


            for (var i = 0; i < layers.length; i++) {

                var lyr = layers[i];
                if (!lyr.property("Source Text")) {
                    continue; // 텍스트 레이어가 아닌 경우 skip
                }

                var effects = lyr.property("Effects");
                var slider = effects.addProperty("ADBE Slider Control");
                slider.name = "A_Control_" + (i + 1);


                // 옵션 값 가져오기
                var pre = prefixTxt.text;
                var suf = suffixTxt.text;

                var padIdx = zeroPad.selection.index;     // 0~3
                var padCount = [0, 2, 3, 4][padIdx];      // None, 00, 000, 0000 대응

                var dec = parseInt(decimal.selection.text, 10);


                // -----------------------------
                // EXPRESSION (오류 없는 버전)
                // -----------------------------
                var expr = "";
                expr += "s = effect(\"" + slider.name + "\")(\"Slider\").value;\n";
                expr += "pre = \"" + pre + "\";\n";
                expr += "suf = \"" + suf + "\";\n";
                expr += "pad = " + padCount + ";\n";
                expr += "dec = " + dec + ";\n";
                expr += "\n";

                expr += "// 숫자 포맷팅\n";
                expr += "val = (dec > 0) ? s.toFixed(dec) : Math.round(s).toString();\n";
                expr += "\n";

                expr += "if (pad > 0) {\n";
                expr += "    parts = val.split('.');\n";
                expr += "    num = parts[0];\n";
                expr += "    if (num.length < pad) num = ('0000' + num).slice(-pad);\n";
                expr += "    if (parts.length > 1) val = num + '.' + parts[1];\n";
                expr += "    else val = num;\n";
                expr += "}\n";
                expr += "\n";

                expr += "pre + val + suf;";


                // 표현식 적용
                lyr.property("Source Text").expression = expr;
            }

            app.endUndoGroup();
        }



        btnApply.onClick = applyToSelected;
        win.layout.layout(true);
        return win;
    }


    // -----------------------------
    // Show UI
    // -----------------------------
    var myUI = buildUI(thisObj);
    if (myUI instanceof Window) myUI.show();

})(this);