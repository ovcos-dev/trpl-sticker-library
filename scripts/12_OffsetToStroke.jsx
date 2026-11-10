// OffsetToStroke.jsx
// Offset Paths -> Stroke (Width = Amount * 2) 변환
// - Offset Paths를 직접 선택했으면 선택한 것만, 아니면 선택한 레이어 안의 전부를 변환
// - Stroke 색: 같은 그룹 Fill 색 (없으면 흰색)
// - Amount 음수: 건너뛰고 알림
// - Amount 키프레임: 값 x2 로 복사 (이징 포함)

(function () {
    var OFFSET = "ADBE Vector Filter - Offset";
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("컴포지션을 열어주세요."); return; }

    // ---- 대상 수집: {layer, path(인덱스 배열)} ----
    var targets = [];

    function indexPath(prop) {
        var path = [];
        var p = prop;
        while (p.propertyDepth > 0) {
            path.unshift(p.propertyIndex);
            p = p.parentProperty;
        }
        return path;
    }

    function resolve(layer, path) {
        var p = layer;
        for (var i = 0; i < path.length; i++) p = p.property(path[i]);
        return p;
    }

    var sel = comp.selectedProperties;
    for (var i = 0; i < sel.length; i++) {
        if (sel[i].matchName === OFFSET) {
            targets.push({ layer: sel[i].propertyGroup(sel[i].propertyDepth), path: indexPath(sel[i]) });
        }
    }

    function collect(layer, group) {
        for (var j = 1; j <= group.numProperties; j++) {
            var c = group.property(j);
            if (c.matchName === OFFSET) {
                targets.push({ layer: layer, path: indexPath(c) });
            } else if (c.matchName === "ADBE Vector Group") {
                collect(layer, c.property("ADBE Vectors Group"));
            }
        }
    }

    if (targets.length === 0) {
        var layers = comp.selectedLayers;
        for (var l = 0; l < layers.length; l++) {
            if (layers[l] instanceof ShapeLayer) collect(layers[l], layers[l].property("ADBE Root Vectors Group"));
        }
    }

    if (targets.length === 0) { alert("변환할 Offset Paths가 없습니다."); return; }

    // ---- 변환 ----
    var skipped = [];
    var warnings = [];
    var done = 0;

    function label(layer, offset) {
        return layer.name + " > " + offset.parentProperty.parentProperty.name + " > " + offset.name;
    }

    function hasNegative(amt) {
        if (amt.numKeys > 0) {
            for (var k = 1; k <= amt.numKeys; k++) if (amt.keyValue(k) < 0) return true;
            return false;
        }
        return amt.value < 0;
    }

    function findFillColor(container) {
        for (var j = 1; j <= container.numProperties; j++) {
            var c = container.property(j);
            if (c.matchName === "ADBE Vector Graphic - Fill") return c.property("ADBE Vector Fill Color").value;
        }
        return [1, 1, 1, 1];
    }

    app.beginUndoGroup("Offset Paths to Stroke");
    try {
    for (var t = 0; t < targets.length; t++) {
        var layer = targets[t].layer;
        var path = targets[t].path;
        var offset = resolve(layer, path);
        var amt = offset.property("ADBE Vector Offset Amount");
        var name = label(layer, offset);

        if (hasNegative(amt)) { skipped.push(name); continue; }

        var copies = offset.property("ADBE Vector Offset Copies");
        if (copies && copies.value > 1) warnings.push(name + " (Copies > 1 은 재현 안 됨)");
        if (amt.expression !== "" && amt.expressionEnabled) warnings.push(name + " (Amount expression은 복사 안 됨)");

        // addProperty/moveTo 후엔 기존 참조가 무효화될 수 있어서 값을 먼저 전부 읽어둠
        var container = offset.parentProperty;
        var idx = offset.propertyIndex;
        var color = findFillColor(container);
        var joinProp = offset.property("ADBE Vector Offset Line Join");
        var join = joinProp ? joinProp.value : null;
        var miterProp = offset.property("ADBE Vector Offset Miter Limit");
        var miter = miterProp ? miterProp.value : null;

        var keys = [];
        for (var k = 1; k <= amt.numKeys; k++) {
            keys.push({
                time: amt.keyTime(k),
                value: amt.keyValue(k),
                inType: amt.keyInInterpolationType(k),
                outType: amt.keyOutInterpolationType(k),
                inEase: amt.keyInTemporalEase(k),
                outEase: amt.keyOutTemporalEase(k),
                cont: amt.keyTemporalContinuous(k),
                auto: amt.keyTemporalAutoBezier(k)
            });
        }
        var staticValue = amt.value;

        // Stroke 추가 후 Offset 자리로 이동
        var stroke = container.addProperty("ADBE Vector Graphic - Stroke");
        stroke.moveTo(idx);
        container = resolve(layer, path).parentProperty; // 참조 재획득
        stroke = container.property(idx);

        stroke.property("ADBE Vector Stroke Color").setValue(color);
        if (join !== null) stroke.property("ADBE Vector Stroke Line Join").setValue(join);
        if (miter !== null) stroke.property("ADBE Vector Stroke Miter Limit").setValue(miter);

        var width = stroke.property("ADBE Vector Stroke Width");
        if (keys.length > 0) {
            for (var a = 0; a < keys.length; a++) width.setValueAtTime(keys[a].time, keys[a].value * 2);
            for (var b = 0; b < keys.length; b++) {
                var kk = keys[b];
                var ki = b + 1;
                try {
                    width.setTemporalEaseAtKey(ki,
                        [new KeyframeEase(kk.inEase[0].speed * 2, kk.inEase[0].influence)],
                        [new KeyframeEase(kk.outEase[0].speed * 2, kk.outEase[0].influence)]);
                } catch (e) {}
                width.setInterpolationTypeAtKey(ki, kk.inType, kk.outType);
                try { width.setTemporalContinuousAtKey(ki, kk.cont); } catch (e) {}
                try { width.setTemporalAutoBezierAtKey(ki, kk.auto); } catch (e) {}
            }
        } else {
            width.setValue(staticValue * 2);
        }

        // Offset은 Stroke 바로 다음 칸으로 밀려나 있음
        container.property(idx + 1).remove();
        done++;
    }
    } catch (err) {
        alert("에러: " + err.toString() + " (line " + err.line + ")");
    } finally {
        app.endUndoGroup();
    }

    var msg = done + "개 변환 완료";
    if (skipped.length) msg += "\n\n[음수 Amount - 건너뜀]\n" + skipped.join("\n");
    if (warnings.length) msg += "\n\n[참고]\n" + warnings.join("\n");
    alert(msg);
})();
