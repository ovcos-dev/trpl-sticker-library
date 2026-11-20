/*
 * 13_Ease_Copy.jsx  v1.0
 * 선택한 키프레임의 이징(interpolation 타입, speed, influence, continuous, auto bezier)을 복사
 * 사용법: 속성 1개에서 키프레임을 선택하고 실행 → 14_Ease_Paste.jsx로 붙여넣기
 * - speed는 구간 평균 속도 대비 비율로 저장 (값 범위가 다른 속성에 붙여도 커브 모양 유지)
 * - 복사한 값은 app.settings에 저장 (AE 재시작 후에도 유지)
 */
(function () {
    var SECTION = "TRPL_EaseCopyPaste", KEY = "clip";

    // 키 a → b 구간 평균 속도 (ease 배열 길이 n만큼, 계산 불가 항목은 null)
    function avgVel(p, a, b, n) {
        var out = [], d;
        for (d = 0; d < n; d++) out.push(null);
        if (a < 1 || b > p.numKeys) return out;
        var dt = p.keyTime(b) - p.keyTime(a);
        if (dt <= 0) return out;
        var va = p.keyValue(a), vb = p.keyValue(b);
        if (typeof va === "number") {
            out[0] = (vb - va) / dt;
        } else if (va instanceof Array) {
            if (n === 1) { // 공간 속성 등: 직선 거리 기준
                var s = 0;
                for (d = 0; d < va.length; d++) s += (vb[d] - va[d]) * (vb[d] - va[d]);
                out[0] = Math.sqrt(s) / dt;
            } else {
                for (d = 0; d < n && d < va.length; d++) out[d] = (vb[d] - va[d]) / dt;
            }
        }
        for (d = 0; d < n; d++) if (out[d] !== null && Math.abs(out[d]) < 1e-9) out[d] = null;
        return out;
    }

    function easeToStr(eases, avg) {
        var parts = [];
        for (var d = 0; d < eases.length; d++) {
            var r = (avg[d] === null) ? "null" : String(eases[d].speed / avg[d]);
            parts.push("[" + r + "," + eases[d].speed + "," + eases[d].influence + "]");
        }
        return "[" + parts.join(",") + "]";
    }

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("컴포지션을 열고 키프레임을 선택하세요."); return; }

    var props = [], sel = comp.selectedProperties;
    for (var i = 0; i < sel.length; i++) {
        var sp = sel[i];
        if (sp.propertyType === PropertyType.PROPERTY && sp.selectedKeys && sp.selectedKeys.length > 0) props.push(sp);
    }
    if (props.length !== 1) {
        alert(props.length === 0 ? "키프레임을 선택하세요." : "복사는 속성 1개의 키프레임만 선택하세요.\n(현재 " + props.length + "개 속성)");
        return;
    }

    var p = props[0], keys = p.selectedKeys.slice(0), items = [];
    keys.sort(function (a, b) { return a - b; });
    try {
        for (var j = 0; j < keys.length; j++) {
            var k = keys[j];
            var ie = p.keyInTemporalEase(k), oe = p.keyOutTemporalEase(k);
            items.push("{ii:" + p.keyInInterpolationType(k) + ",oi:" + p.keyOutInterpolationType(k) +
                ",tc:" + p.keyTemporalContinuous(k) + ",ab:" + p.keyTemporalAutoBezier(k) +
                ",ie:" + easeToStr(ie, avgVel(p, k - 1, k, ie.length)) +
                ",oe:" + easeToStr(oe, avgVel(p, k, k + 1, oe.length)) + "}");
        }
        app.settings.saveSetting(SECTION, KEY, "[" + items.join(",") + "]");
    } catch (e) {
        alert("이징 복사 오류: " + e.toString() + " (line " + e.line + ")");
    }
})();
