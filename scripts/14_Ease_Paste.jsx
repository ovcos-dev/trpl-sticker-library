/*
 * 14_Ease_Paste.jsx  v1.0
 * 13_Ease_Copy.jsx로 복사한 이징을 선택한 키프레임에 붙여넣기
 * 사용법: 대상 키프레임을 선택하고 실행 (속성 여러 개 가능, 속성마다 선택 개수가 복사한 개수와 같아야 함)
 * - 개수가 다른 속성이 하나라도 있으면 팝업 후 전체 중단
 * - 차원이 다르면 원본의 첫 번째 값을 사용
 * - Undo 1회로 원복
 */
(function () {
    var SECTION = "TRPL_EaseCopyPaste", KEY = "clip";

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
            if (n === 1) {
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

    // 원본 [ratio, speed, influence] → 대상 KeyframeEase 배열
    function buildEase(src, avg, n) {
        var res = [];
        for (var d = 0; d < n; d++) {
            var e = src[d < src.length ? d : 0];
            var speed = (e[0] !== null && avg[d] !== null) ? e[0] * avg[d] : e[1];
            res.push(new KeyframeEase(speed, Math.max(0.1, Math.min(100, e[2]))));
        }
        return res;
    }

    if (!app.settings.haveSetting(SECTION, KEY)) { alert("먼저 13_Ease_Copy로 이징을 복사하세요."); return; }
    var clip;
    try { clip = eval("(" + app.settings.getSetting(SECTION, KEY) + ")"); } catch (e0) { clip = null; }
    if (!(clip instanceof Array) || clip.length === 0) { alert("복사된 이징을 읽을 수 없습니다. 다시 복사하세요."); return; }

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("컴포지션을 열고 키프레임을 선택하세요."); return; }

    var props = [], sel = comp.selectedProperties, i;
    for (i = 0; i < sel.length; i++) {
        var sp = sel[i];
        if (sp.propertyType === PropertyType.PROPERTY && sp.selectedKeys && sp.selectedKeys.length > 0) props.push(sp);
    }
    if (props.length === 0) { alert("붙여넣을 키프레임을 선택하세요."); return; }

    // 개수 검사: 하나라도 다르면 전체 중단 (Undo 그룹 열기 전)
    var bad = [];
    for (i = 0; i < props.length; i++) {
        if (props[i].selectedKeys.length !== clip.length) bad.push(props[i].name + " (" + props[i].selectedKeys.length + "개)");
    }
    if (bad.length) {
        alert("키프레임 개수가 다릅니다.\n복사한 개수: " + clip.length + "개\n\n" + bad.join("\n"));
        return;
    }

    var err = null;
    app.beginUndoGroup("Ease Paste");
    try {
        for (i = 0; i < props.length; i++) {
            var p = props[i], keys = p.selectedKeys.slice(0);
            keys.sort(function (a, b) { return a - b; });
            for (var j = 0; j < keys.length; j++) {
                var k = keys[j], c = clip[j];
                var n = p.keyInTemporalEase(k).length;
                var okType = p.isInterpolationTypeValid(c.ii) && p.isInterpolationTypeValid(c.oi);
                // 타입 → ease → 타입: ease 설정이 타입을 바꾸는 경우에도 최종 타입이 원본과 같도록
                if (okType) p.setInterpolationTypeAtKey(k, c.ii, c.oi);
                p.setTemporalEaseAtKey(k,
                    buildEase(c.ie, avgVel(p, k - 1, k, n), n),
                    buildEase(c.oe, avgVel(p, k, k + 1, n), n));
                if (okType) p.setInterpolationTypeAtKey(k, c.ii, c.oi);
                p.setTemporalContinuousAtKey(k, c.tc);
                p.setTemporalAutoBezierAtKey(k, c.ab);
            }
        }
    } catch (e) {
        err = e.toString() + " (line " + e.line + ")";
    } finally {
        app.endUndoGroup();
    }
    if (err) alert("이징 붙여넣기 오류: " + err);
})();
