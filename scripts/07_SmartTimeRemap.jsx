// 07_SmartTimeRemap.jsx v3.4
// 선택된 프리컴프 레이어를 분석하여 변화 없는 구간에 Time Remap Hold 키프레임을 적용합니다.
// - 키프레임 1개 이상 OR Expression 활성화된 속성을 대상으로 분석
// - 중첩 프리컴프 재귀 탐색 및 적용 (안에서 밖으로)
// - timeRemapEnabled = true  → 스킵 (내부 탐색 안함)
// - timeRemapEnabled = false → 내부 탐색 후 Time Remap 적용
// - 눈 꺼진 레이어, 가이드 레이어 탐색 제외
// - v3.2: Expression 전용 속성 무조건 전 구간 CHANGED 처리 (wiggle 샘플링 오감지 방지)
// - v3.3: changed[0]도 true 처리 (f=0부터 순회)
// - v3.4: var 스코프 충돌 수정 (fi 변수로 분리)
// - v3.2: 프리컴프 레이어 자체의 키프레임도 수집 (포지션, 이펙트 등)

(function SmartTimeRemap() {

    // ─────────────────────────────────────────────
    // 유틸: 두 값이 같은지 비교
    // ─────────────────────────────────────────────
    function valuesAreEqual(a, b) {
        if (a === null || b === null) return a === b;
        if (typeof a === "number" && typeof b === "number") {
            return Math.abs(a - b) < 1e-9;
        }
        if (a instanceof Array && b instanceof Array) {
            if (a.length !== b.length) return false;
            for (var i = 0; i < a.length; i++) {
                if (Math.abs(a[i] - b[i]) > 1e-9) return false;
            }
            return true;
        }
        return a === b;
    }

    // ─────────────────────────────────────────────
    // 프로퍼티 재귀 순회
    // 키프레임 1개 이상 OR Expression 활성화된 속성만 수집
    // ─────────────────────────────────────────────
    function collectTargetProps(prop, result) {
        try {
            if (prop.numProperties !== undefined && prop.numProperties > 0) {
                for (var i = 1; i <= prop.numProperties; i++) {
                    collectTargetProps(prop.property(i), result);
                }
            } else {
                var hasKeys = (prop.numKeys !== undefined && prop.numKeys >= 1);
                var hasExpr = (prop.expressionEnabled === true);
                if (hasKeys || hasExpr) result.push(prop);
            }
        } catch (e) {}
    }

    function getTargetPropsFromLayer(layer) {
        var result = [];
        try {
            for (var i = 1; i <= layer.numProperties; i++) {
                collectTargetProps(layer.property(i), result);
            }
        } catch (e) {}
        return result;
    }

    // 컴프 내 모든 레이어의 대상 속성 수집
    // 프리컴프 레이어도 레이어 자체에 붙은 키프레임(포지션, 이펙트 등)은 수집
    // 내부 탐색은 analyzePrecompLayer에서 별도 처리
    function getTargetPropsFromComp(comp) {
        var result = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (!layer.enabled) continue;
            if (layer.guideLayer) continue;
            var layerProps = getTargetPropsFromLayer(layer);
            for (var j = 0; j < layerProps.length; j++) result.push(layerProps[j]);
        }
        return result;
    }

    // ─────────────────────────────────────────────
    // 프레임별 변화 감지
    // 키프레임 범위 밖은 무조건 정지
    // Expression 속성은 전 구간 valueAtTime 비교
    // ─────────────────────────────────────────────
    function buildChangeMap(props, comp) {
        var fps         = comp.frameRate;
        var totalFrames = Math.round(comp.duration * fps);
        var changed     = [];
        var fi, pi;

        for (fi = 0; fi < totalFrames; fi++) changed[fi] = false;

        for (pi = 0; pi < props.length; pi++) {
            var prop    = props[pi];
            var hasKeys = (prop.numKeys !== undefined && prop.numKeys >= 1);
            var hasExpr = (prop.expressionEnabled === true);

            if (!hasKeys && hasExpr) {
                // Expression 전용: 전 구간 CHANGED (var 스코프 충돌 방지를 위해 fi 사용)
                for (fi = 0; fi < totalFrames; fi++) changed[fi] = true;
                continue;
            }

            // 키프레임 범위 안에서만 비교
            var firstKeyFrame = Math.round(prop.keyTime(1) * fps);
            var lastKeyFrame  = Math.round(prop.keyTime(prop.numKeys) * fps);

            for (fi = 1; fi < totalFrames; fi++) {
                if (changed[fi]) continue;
                if (fi <= firstKeyFrame || fi > lastKeyFrame) continue;
                try {
                    var v0 = prop.valueAtTime((fi - 1) / fps, false);
                    var v1 = prop.valueAtTime(fi / fps, false);
                    if (!valuesAreEqual(v0, v1)) changed[fi] = true;
                } catch (e) { changed[fi] = true; }
            }
        }
        return changed;
    }

    // ─────────────────────────────────────────────
    // changeMap → 구간 배열
    // ─────────────────────────────────────────────
    function buildSegments(changed) {
        if (changed.length === 0) return [];
        var segments  = [];
        var segStart  = 0;
        var segStatic = !changed[0];

        for (var f = 1; f < changed.length; f++) {
            var curStatic = !changed[f];
            if (curStatic !== segStatic) {
                segments.push({ start: segStart, end: f - 1, isStatic: segStatic });
                segStart  = f;
                segStatic = curStatic;
            }
        }
        segments.push({ start: segStart, end: changed.length - 1, isStatic: segStatic });
        return segments;
    }

    // ─────────────────────────────────────────────
    // 유틸: 키프레임 추가 (기존 키 있으면 재사용)
    // ─────────────────────────────────────────────
    function getOrAddKey(tr, compTime) {
        for (var k = 1; k <= tr.numKeys; k++) {
            if (Math.abs(tr.keyTime(k) - compTime) < 1e-9) return k;
        }
        return tr.addKey(compTime);
    }

    // ─────────────────────────────────────────────
    // Time Remap 키프레임 적용
    // ─────────────────────────────────────────────
    function applyTimeRemap(precompLayer, segments, fps) {

        precompLayer.shy     = false;
        precompLayer.enabled = true;
        precompLayer.timeRemapEnabled = true;

        var tr = precompLayer.timeRemap;
        if (!tr) {
            alert("Time Remap 속성을 찾을 수 없습니다: " + precompLayer.name);
            return;
        }

        var layerStart  = precompLayer.startTime;
        var ourKeyTimes = [];

        for (var si = 0; si < segments.length; si++) {
            var seg       = segments[si];
            var compTime  = layerStart + seg.start / fps;
            var innerTime = seg.start / fps;

            if (seg.isStatic) {
                var keyIdx = getOrAddKey(tr, compTime);
                tr.setValueAtKey(keyIdx, innerTime);
                tr.setInterpolationTypeAtKey(keyIdx,
                    KeyframeInterpolationType.HOLD,
                    KeyframeInterpolationType.HOLD);
                ourKeyTimes.push(compTime);

            } else {
                // 변화 구간 시작: LINEAR
                var keyIdx = getOrAddKey(tr, compTime);
                tr.setValueAtKey(keyIdx, innerTime);
                tr.setInterpolationTypeAtKey(keyIdx,
                    KeyframeInterpolationType.LINEAR,
                    KeyframeInterpolationType.LINEAR);
                ourKeyTimes.push(compTime);

                var nextSeg = (si + 1 < segments.length) ? segments[si + 1] : null;

                if (nextSeg && nextSeg.isStatic) {
                    // 변화 끝: LINEAR
                    var endCompTime  = layerStart + seg.end / fps;
                    var endInnerTime = seg.end / fps;
                    var endKeyIdx    = getOrAddKey(tr, endCompTime);
                    tr.setValueAtKey(endKeyIdx, endInnerTime);
                    tr.setInterpolationTypeAtKey(endKeyIdx,
                        KeyframeInterpolationType.LINEAR,
                        KeyframeInterpolationType.LINEAR);
                    ourKeyTimes.push(endCompTime);

                    // 정지 시작: HOLD (value = 변화 끝과 동일)
                    var holdCompTime = layerStart + nextSeg.start / fps;
                    var holdKeyIdx   = getOrAddKey(tr, holdCompTime);
                    tr.setValueAtKey(holdKeyIdx, endInnerTime);
                    tr.setInterpolationTypeAtKey(holdKeyIdx,
                        KeyframeInterpolationType.HOLD,
                        KeyframeInterpolationType.HOLD);
                    ourKeyTimes.push(holdCompTime);

                } else if (!nextSeg) {
                    // 마지막 구간이 변화: 끝점 LINEAR
                    var endCompTime  = layerStart + seg.end / fps;
                    var endInnerTime = seg.end / fps;
                    var endKeyIdx    = getOrAddKey(tr, endCompTime);
                    tr.setValueAtKey(endKeyIdx, endInnerTime);
                    tr.setInterpolationTypeAtKey(endKeyIdx,
                        KeyframeInterpolationType.LINEAR,
                        KeyframeInterpolationType.LINEAR);
                    ourKeyTimes.push(endCompTime);
                }
            }
        }

        // 우리 키프레임 목록에 없는 키프레임 제거 (AE 기본 키프레임 정리)
        for (var k = tr.numKeys; k >= 1; k--) {
            var kt       = tr.keyTime(k);
            var isOurKey = false;
            for (var oi = 0; oi < ourKeyTimes.length; oi++) {
                if (Math.abs(kt - ourKeyTimes[oi]) < 1e-9) { isOurKey = true; break; }
            }
            if (!isOurKey) {
                try { tr.removeKey(k); } catch (e) {}
            }
        }
    }

    // ─────────────────────────────────────────────
    // 프리컴프 레이어 분석 및 taskList 등록
    // ─────────────────────────────────────────────
    function analyzePrecompLayer(precompLayer, parentFps, visitedComps, taskList) {

        var comp = precompLayer.source;

        // 중복 방문 방지
        for (var vi = 0; vi < visitedComps.length; vi++) {
            if (visitedComps[vi] === comp.id) return;
        }
        visitedComps.push(comp.id);

        // 내부 레이어 순회
        for (var li = 1; li <= comp.numLayers; li++) {
            var layer = comp.layer(li);
            if (!(layer instanceof AVLayer) || !(layer.source instanceof CompItem)) continue;
            if (!layer.enabled) continue;
            if (layer.guideLayer) continue;
            if (layer.timeRemapEnabled) continue;
            analyzePrecompLayer(layer, comp.frameRate, visitedComps, taskList);
        }

        // 이 컴프의 일반 레이어 속성 분석 후 taskList 등록
        var props = getTargetPropsFromComp(comp);
        if (props.length === 0) return;

        var changeMap = buildChangeMap(props, comp);
        var segments  = buildSegments(changeMap);

        var hasStatic = false;
        for (var si = 0; si < segments.length; si++) {
            if (segments[si].isStatic) { hasStatic = true; break; }
        }
        if (!hasStatic) return;

        taskList.push({
            layer    : precompLayer,
            segments : segments,
            fps      : parentFps
        });
    }

    // ─────────────────────────────────────────────
    // 메인 실행
    // ─────────────────────────────────────────────
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("활성화된 컴포지션이 없습니다.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("레이어를 하나 이상 선택해 주세요.");
        return;
    }

    var visitedComps = [];
    var taskList     = [];

    for (var li = 0; li < selectedLayers.length; li++) {
        var layer = selectedLayers[li];
        if (!(layer instanceof AVLayer) || !(layer.source instanceof CompItem)) continue;
        if (layer.timeRemapEnabled) continue;
        analyzePrecompLayer(layer, comp.frameRate, visitedComps, taskList);
    }

    if (taskList.length === 0) {
        alert("처리할 대상이 없습니다.\n(변화 없는 구간이 감지되지 않았거나,\n프리컴프 레이어가 없거나,\n이미 Time Remap이 적용된 레이어만 선택됐습니다.)");
        return;
    }

    app.beginUndoGroup("SmartTimeRemap");

    for (var ti = 0; ti < taskList.length; ti++) {
        applyTimeRemap(taskList[ti].layer, taskList[ti].segments, taskList[ti].fps);
    }

    app.endUndoGroup();

    alert("완료!\n\nTime Remap 적용 레이어: " + taskList.length + "개");

})();
