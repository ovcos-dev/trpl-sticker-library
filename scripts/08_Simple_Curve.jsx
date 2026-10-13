(function () {

    app.beginUndoGroup("Create Simple Curve");

    var comp = app.project.activeItem;

    if (!(comp instanceof CompItem)) {
        alert("먼저 작업할 Composition을 활성화해주세요.");
        app.endUndoGroup();
        return;
    }

    // ==================================================
    // 기본 설정
    // ==================================================

    var cx = comp.width / 2;
    var cy = comp.height / 2;
    var pointDistance = 300;

    // ==================================================
    // 선택된 Null을 pointEnd로 참조할지 확인
    // ==================================================

    var referenceP2 = null; // 참조할 기존 Null (null이면 새로 생성)

    if (comp.selectedLayers.length === 1 && comp.selectedLayers[0].nullLayer) {
        var selectedNull = comp.selectedLayers[0];
        var useAsP2 = confirm(
            "선택한 널 \"" + selectedNull.name + "\"을(를) pointEnd로 참조할까요?\n\n예: 이 레이어를 pointEnd로 사용\n아니오: 새 pointEnd를 생성",
            false,
            "pointEnd 참조 확인"
        );
        if (useAsP2) {
            referenceP2 = selectedNull;
        }
    }

    // ==================================================
    // 이름 중복 방지
    // ==================================================

    function layerNameExists(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name) return true;
        }
        return false;
    }

    function getUniqueSuffix(comp, bases) {
        var suffix = 1;
        while (true) {
            var collision = false;
            for (var i = 0; i < bases.length; i++) {
                var name = suffix === 1 ? bases[i] : bases[i] + " " + suffix;
                if (layerNameExists(comp, name)) {
                    collision = true;
                    break;
                }
            }
            if (!collision) return suffix;
            suffix++;
        }
    }

    var nameBases = referenceP2 ? ["Curve", "pointStart"] : ["Curve", "pointStart", "pointEnd"];
    var nameSuffix = getUniqueSuffix(comp, nameBases);
    var curveName = nameSuffix === 1 ? "Curve" : "Curve " + nameSuffix;
    var p0Name = nameSuffix === 1 ? "pointStart" : "pointStart " + nameSuffix;
    var p2Name = referenceP2 ? referenceP2.name : (nameSuffix === 1 ? "pointEnd" : "pointEnd " + nameSuffix);

    // ==================================================
    // Shape Layer
    // ==================================================

    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = curveName;

    // ==================================================
    // Path Group
    // ==================================================

    var contents = shapeLayer.property("ADBE Root Vectors Group");

    var pathGroup = contents.addProperty("ADBE Vector Group");
    pathGroup.name = "Path";

    var groupContents = pathGroup.property("ADBE Vectors Group");

    // Path Group을 먼저 만든다.
    groupContents.addProperty("ADBE Vector Shape - Group");

    // ==================================================
    // Stroke
    // ==================================================

    var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
    stroke.name = "Stroke";
    stroke.property("ADBE Vector Stroke Color").setValue([1, 1, 1]);
    stroke.property("ADBE Vector Stroke Width").setValue(6);

    // ==================================================
    // Slider Controls
    // ==================================================

    var effects = shapeLayer.property("ADBE Effect Parade");

    var centerSlider = effects.addProperty("ADBE Slider Control");
    centerSlider.name = "Center";
    centerSlider.property("ADBE Slider Control-0001").setValue(50);

    var handleSlider = effects.addProperty("ADBE Slider Control");
    handleSlider.name = "Handle";
    handleSlider.property("ADBE Slider Control-0001").setValue(35);

    var verticalSlider = effects.addProperty("ADBE Slider Control");
    verticalSlider.name = "Vertical";
    verticalSlider.property("ADBE Slider Control-0001").setValue(-100);

    var angleControl = effects.addProperty("ADBE Angle Control");
    angleControl.name = "Angle";
    angleControl.property("ADBE Angle Control-0001").setValue(0);

    var autoFlipCheckbox = effects.addProperty("ADBE Checkbox Control");
    autoFlipCheckbox.name = "Auto Flip";
    autoFlipCheckbox.property("ADBE Checkbox Control-0001").setValue(1);

    // ==================================================
    // pointStart Null
    // ==================================================

    var p0 = comp.layers.addNull();
    p0.name = p0Name;
    p0.threeDLayer = false;
    p0.transform.position.setValue([
        cx - pointDistance,
        cy
    ]);
    p0.transform.scale.setValue([60, 60]);
    p0.comment = "Curve Point 0";

    // ==================================================
    // pointEnd Null
    // ==================================================

    var p2;

    if (referenceP2) {
        p2 = referenceP2;
    } else {
        p2 = comp.layers.addNull();
        p2.name = p2Name;
        p2.threeDLayer = false;
        p2.transform.position.setValue([
            cx + pointDistance,
            cy
        ]);
        p2.transform.scale.setValue([60, 60]);
        p2.comment = "Curve Point 2";
    }

    // ==================================================
    // IMPORTANT:
    // addProperty() 후 Path Group 객체가 무효화될 수 있으므로
    // 모든 추가 작업 후 실제 Path의 내부 Property를 다시 가져온다.
    // ==================================================

    var finalContents = shapeLayer
        .property("ADBE Root Vectors Group")
        .property("Path")
        .property("ADBE Vectors Group");

    var finalPathGroup = finalContents.property("ADBE Vector Shape - Group");

    // 실제 Path 값 Property
    var finalPath = finalPathGroup.property("ADBE Vector Shape");

    if (!finalPath || !finalPath.setValue) {
        alert("Path Property를 찾을 수 없습니다.");
        app.endUndoGroup();
        return;
    }

    // ==================================================
    // 초기 Path
    // ==================================================

    var shape = new Shape();

    shape.vertices = [
        [-pointDistance, 0],
        [0, 0],
        [pointDistance, 0]
    ];

    shape.inTangents = [
        [0, 0],
        [-100, 0],
        [0, 0]
    ];

    shape.outTangents = [
        [0, 0],
        [100, 0],
        [0, 0]
    ];

    shape.closed = false;

    finalPath.setValue(shape);

    // ==================================================
    // Expression
    // ==================================================

    finalPath.expression =
'var path = thisProperty;\n' +
'var center = effect("Center")("Slider");\n' +
'var handle = effect("Handle")("Slider");\n' +
'var vertical = effect("Vertical")("Slider");\n' +
'var angle = effect("Angle")("Angle");\n' +
'var autoFlip = effect("Auto Flip")("Checkbox");\n' +
'\n' +
'var pts = path.points();\n' +
'var ins = path.inTangents();\n' +
'var outs = path.outTangents();\n' +
'\n' +
'var a = thisComp.layer("' + p0Name + '");\n' +
'var b = thisComp.layer("' + p2Name + '");\n' +
'\n' +
'var p0 = fromCompToSurface(a.toComp(a.anchorPoint));\n' +
'var p2 = fromCompToSurface(b.toComp(b.anchorPoint));\n' +
'\n' +
'var delta = p2 - p0;\n' +
'var distance = length(delta);\n' +
'\n' +
'if (distance > 0) {\n' +
'    var dir = normalize(delta);\n' +
'\n' +
'    if (autoFlip && time > 0) {\n' +
'        var prevTime = Math.max(0, time - thisComp.frameDuration);\n' +
'        var p0Prev = fromCompToSurface(a.toComp(a.anchorPoint, prevTime));\n' +
'        var p2Prev = fromCompToSurface(b.toComp(b.anchorPoint, prevTime));\n' +
'        var deltaPrev = p2Prev - p0Prev;\n' +
'        if (length(deltaPrev) > 0) {\n' +
'            var dirPrev = normalize(deltaPrev);\n' +
'            if (dot(dir, dirPrev) < 0) {\n' +
'                dir = -dir;\n' +
'            }\n' +
'        }\n' +
'    }\n' +
'\n' +
'    var perp = [-dir[1], dir[0]];\n' +
'\n' +
'    var p1 = linear(center, 0, 100, p0, p2);\n' +
'    p1 += perp * vertical;\n' +
'\n' +
'    pts[0] = p0;\n' +
'    pts[1] = p1;\n' +
'    pts[2] = p2;\n' +
'\n' +
'    var handleLength = distance * handle / 100;\n' +
'\n' +
'    var angleRad = degreesToRadians(angle);\n' +
'    var cosA = Math.cos(angleRad);\n' +
'    var sinA = Math.sin(angleRad);\n' +
'    var handleDir = [\n' +
'        dir[0] * cosA - dir[1] * sinA,\n' +
'        dir[0] * sinA + dir[1] * cosA\n' +
'    ];\n' +
'\n' +
'    ins[0] = [0, 0];\n' +
'    outs[0] = [0, 0];\n' +
'\n' +
'    ins[1] = -handleDir * handleLength;\n' +
'    outs[1] = handleDir * handleLength;\n' +
'\n' +
'    ins[2] = [0, 0];\n' +
'    outs[2] = [0, 0];\n' +
'}\n' +
'\n' +
'createPath(pts, ins, outs, false);';

    // ==================================================
    // Layer Order
    // ==================================================

    p0.moveBefore(shapeLayer);
    if (!referenceP2) {
        p2.moveBefore(shapeLayer);
    }

    p0.selected = false;
    p2.selected = false;
    shapeLayer.selected = true;

    app.endUndoGroup();

})();
