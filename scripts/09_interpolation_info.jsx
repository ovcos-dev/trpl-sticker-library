// 09_interpolation_info.jsx
// 키프레임 2개 선택 → 값 변화 / duration / interpolation 표시 + bezier 입력 적용
// 설치: ScriptUI Panels 폴더에 넣고 AE 재시작 → Window 메뉴에서 실행 (도킹 가능)

(function (thisObj) {
    var SECTION = "KeyframeInfo";

    var DPI_LIST = [
        ["ldpi", 120, "0.75x"], ["mdpi", 160, "1x"], ["hdpi", 240, "1.5x"],
        ["xhdpi", 320, "2x"], ["xxhdpi", 480, "3x"], ["xxxhdpi", 640, "4x"]
    ];

    // 참조 프리셋 1: easings.net (postcss-easings) + W3C CSS 표준
    var PRESETS_EASINGS = [
        ["linear", [0, 0, 1, 1]],
        // W3C CSS Easing 표준 키워드
        ["ease", [0.25, 0.1, 0.25, 1]], ["ease-in", [0.42, 0, 1, 1]],
        ["ease-out", [0, 0, 0.58, 1]], ["ease-in-out", [0.42, 0, 0.58, 1]],
        ["easeInSine", [0.12, 0, 0.39, 0]], ["easeOutSine", [0.61, 1, 0.88, 1]], ["easeInOutSine", [0.37, 0, 0.63, 1]],
        ["easeInQuad", [0.11, 0, 0.5, 0]], ["easeOutQuad", [0.5, 1, 0.89, 1]], ["easeInOutQuad", [0.45, 0, 0.55, 1]],
        ["easeInCubic", [0.32, 0, 0.67, 0]], ["easeOutCubic", [0.33, 1, 0.68, 1]], ["easeInOutCubic", [0.65, 0, 0.35, 1]],
        ["easeInQuart", [0.5, 0, 0.75, 0]], ["easeOutQuart", [0.25, 1, 0.5, 1]], ["easeInOutQuart", [0.76, 0, 0.24, 1]],
        ["easeInQuint", [0.64, 0, 0.78, 0]], ["easeOutQuint", [0.22, 1, 0.36, 1]], ["easeInOutQuint", [0.83, 0, 0.17, 1]],
        ["easeInExpo", [0.7, 0, 0.84, 0]], ["easeOutExpo", [0.16, 1, 0.3, 1]], ["easeInOutExpo", [0.87, 0, 0.13, 1]],
        ["easeInCirc", [0.55, 0, 1, 0.45]], ["easeOutCirc", [0, 0.55, 0.45, 1]], ["easeInOutCirc", [0.85, 0, 0.15, 1]],
        ["easeInBack", [0.36, 0, 0.66, -0.56]], ["easeOutBack", [0.34, 1.56, 0.64, 1]], ["easeInOutBack", [0.68, -0.6, 0.32, 1.6]]
    ];

    // 참조 프리셋 2: Flutter Curves (flutter/lib/src/animation/curves.dart 의 Cubic 상수 전체)
    var PRESETS_FLUTTER = [
        ["linear", [0, 0, 1, 1]],
        ["ease", [0.25, 0.1, 0.25, 1]], ["easeIn", [0.42, 0, 1, 1]],
        ["easeOut", [0, 0, 0.58, 1]], ["easeInOut", [0.42, 0, 0.58, 1]],
        ["easeInSine", [0.47, 0, 0.745, 0.715]], ["easeOutSine", [0.39, 0.575, 0.565, 1]], ["easeInOutSine", [0.445, 0.05, 0.55, 0.95]],
        ["easeInQuad", [0.55, 0.085, 0.68, 0.53]], ["easeOutQuad", [0.25, 0.46, 0.45, 0.94]], ["easeInOutQuad", [0.455, 0.03, 0.515, 0.955]],
        ["easeInCubic", [0.55, 0.055, 0.675, 0.19]], ["easeOutCubic", [0.215, 0.61, 0.355, 1]], ["easeInOutCubic", [0.645, 0.045, 0.355, 1]],
        ["easeInQuart", [0.895, 0.03, 0.685, 0.22]], ["easeOutQuart", [0.165, 0.84, 0.44, 1]], ["easeInOutQuart", [0.77, 0, 0.175, 1]],
        ["easeInQuint", [0.755, 0.05, 0.855, 0.06]], ["easeOutQuint", [0.23, 1, 0.32, 1]], ["easeInOutQuint", [0.86, 0, 0.07, 1]],
        ["easeInExpo", [0.95, 0.05, 0.795, 0.035]], ["easeOutExpo", [0.19, 1, 0.22, 1]], ["easeInOutExpo", [1, 0, 0, 1]],
        ["easeInCirc", [0.6, 0.04, 0.98, 0.335]], ["easeOutCirc", [0.075, 0.82, 0.165, 1]], ["easeInOutCirc", [0.785, 0.135, 0.15, 0.86]],
        ["easeInBack", [0.6, -0.28, 0.735, 0.045]], ["easeOutBack", [0.175, 0.885, 0.32, 1.275]], ["easeInOutBack", [0.68, -0.55, 0.265, 1.55]],
        ["fastOutSlowIn", [0.4, 0, 0.2, 1]], ["fastLinearToSlowEaseIn", [0.18, 1, 0.04, 1]],
        ["easeInToLinear", [0.67, 0.03, 0.65, 0.09]], ["linearToEaseOut", [0.35, 0.91, 0.33, 0.97]],
        ["slowMiddle", [0.15, 0.85, 0.85, 0.15]]
    ];

    var PRESET_LIBS = [["easings.net", PRESETS_EASINGS], ["Flutter", PRESETS_FLUTTER]];

    // 단위 판별 (matchName 기준, 필요하면 여기에 추가)
    var UNIT_MAP = {
        "ADBE Position": "px", "ADBE Position_0": "px", "ADBE Position_1": "px", "ADBE Position_2": "px",
        "ADBE Anchor Point": "px",
        "ADBE Vector Position": "px", "ADBE Vector Anchor": "px",
        "ADBE Vector Rect Size": "px", "ADBE Vector Rect Position": "px", "ADBE Vector Rect Roundness": "px",
        "ADBE Vector Ellipse Size": "px", "ADBE Vector Ellipse Position": "px",
        "ADBE Vector Stroke Width": "px",
        "ADBE Scale": "%", "ADBE Opacity": "%", "ADBE Vector Scale": "%",
        "ADBE Vector Group Opacity": "%", "ADBE Vector Fill Opacity": "%", "ADBE Vector Stroke Opacity": "%",
        "ADBE Vector Trim Start": "%", "ADBE Vector Trim End": "%",
        "ADBE Rotate Z": "\u00B0", "ADBE Rotate X": "\u00B0", "ADBE Rotate Y": "\u00B0",
        "ADBE Orientation": "\u00B0", "ADBE Vector Rotation": "\u00B0", "ADBE Vector Trim Offset": "\u00B0"
    };

    var NAME_MAP = {
        "ADBE Position_0": "Position X", "ADBE Position_1": "Position Y", "ADBE Position_2": "Position Z"
    };

    var AXIS = ["X", "Y", "Z", "W"];
    var ARROW = " \u2192 ";

    // ---------- 설정 ----------
    function loadSetting(key, def) {
        return app.settings.haveSetting(SECTION, key) ? app.settings.getSetting(SECTION, key) : def;
    }
    function saveSetting(key, val) {
        app.settings.saveSetting(SECTION, key, String(val));
    }

    var state = {
        useDp: false,
        relative: false,
        omitPoint: true,   // 포인트 속성(Position, Anchor Point 등) 값 생략. 기본값 생략
        // 기본값: xxxhdpi(640dpi) / A형식 / Flutter
        dpiIndex: parseInt(loadSetting("dpiIndex", "5"), 10),
        relFormat: loadSetting("relFormat", "A"),
        presetLib: clampLib(parseInt(loadSetting("presetLib", "1"), 10)),
        data: null
    };

    // ---------- 유틸 ----------
    function fmt(n, dec) {
        var s = n.toFixed(dec);
        if (s.indexOf(".") >= 0) s = s.replace(/\.?0+$/, "");
        if (s === "-0") s = "0";
        return s;
    }
    function signed(n, dec) {
        var s = fmt(n, dec);
        return (n > 0 && s !== "0") ? "+" + s : s;
    }
    function toArr(v) {
        return (v instanceof Array) ? v : [v];
    }
    function dist(a, b) {
        var s = 0;
        for (var i = 0; i < a.length; i++) s += (b[i] - a[i]) * (b[i] - a[i]);
        return Math.sqrt(s);
    }
    function clampLib(n) {
        return (n >= 0 && n < PRESET_LIBS.length) ? n : 1;
    }
    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    // ---------- 선택 대상 ----------
    function propName(prop) {
        return NAME_MAP[prop.matchName] || prop.name;
    }

    // 키프레임이 선택된 속성 전부 반환. 속성별로 조건이 안 맞으면 error 항목으로 반환
    function getTargets() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) throw new Error("컴포지션을 열어줘.");
        var props = comp.selectedProperties;
        var targets = [];
        for (var i = 0; i < props.length; i++) {
            var p = props[i];
            if (!(p.propertyType === PropertyType.PROPERTY && p.selectedKeys && p.selectedKeys.length > 0)) continue;

            var keys = p.selectedKeys.slice(0).sort(function (a, b) { return a - b; });
            var vt = p.propertyValueType;
            var err = null;
            var gui = (vt === PropertyValueType.SHAPE || vt === PropertyValueType.COLOR);   // Path, Color: 값 생략 표시
            if (!gui && vt !== PropertyValueType.OneD && vt !== PropertyValueType.TwoD && vt !== PropertyValueType.ThreeD &&
                vt !== PropertyValueType.TwoD_SPATIAL && vt !== PropertyValueType.ThreeD_SPATIAL) {
                err = "지원하지 않는 속성 타입";
            } else if (keys.length !== 2) {
                err = "키프레임을 정확히 2개 선택해줘 (현재 " + keys.length + "개)";
            } else if (keys[1] !== keys[0] + 1) {
                err = "인접한 키프레임 2개를 선택해줘";
            }
            targets.push(err ? { prop: p, error: err } : { prop: p, k1: keys[0], k2: keys[1], gui: gui });
        }
        if (targets.length === 0) throw new Error("키프레임 2개를 선택해줘.");
        return targets;
    }

    // ---------- 읽기 ----------
    function getInterp(outType, inType, eOut, eIn, avg) {
        if (outType === KeyframeInterpolationType.HOLD) return { type: "hold" };
        if (outType === KeyframeInterpolationType.LINEAR && inType === KeyframeInterpolationType.LINEAR) return { type: "linear" };
        if (avg === 0) return { type: "none" };
        var x1 = eOut.influence / 100;
        var y1 = x1 * eOut.speed / avg;
        var x2 = 1 - eIn.influence / 100;
        var y2 = 1 - (eIn.influence / 100) * eIn.speed / avg;
        return { type: "bezier", v: [x1, y1, x2, y2] };
    }

    function near(a, b) {
        return Math.abs(a - b) <= 0.0051;
    }

    // Sine 규칙
    //  Sine.InN    : [N/100, 0, 0.83, 0.83]      N = x1 × 100
    //  Sine.OutN   : [0.17, 0.17, 1-N/100, 1]    N = (1 − x2) × 100
    //  Sine.InOutN : [0.33, 0, 1-N/100, 1]       N = (1 − x2) × 100
    function sineName(v) {
        if (near(v[1], 0) && near(v[2], 0.83) && near(v[3], 0.83)) return "Sine.In" + Math.round(v[0] * 100);
        if (near(v[0], 0.17) && near(v[1], 0.17) && near(v[3], 1)) return "Sine.Out" + Math.round((1 - v[2]) * 100);
        if (near(v[0], 0.33) && near(v[1], 0) && near(v[3], 1)) return "Sine.InOut" + Math.round((1 - v[2]) * 100);
        return null;
    }

    function interpText(ip) {
        if (ip.type === "hold") return "hold";
        if (ip.type === "linear") return "linear";
        if (ip.type === "none") return "-";
        if (ip.type === "unknown") return "?";
        // Sine 규칙은 기본값: 참조 프리셋 설정과 무관하게 항상 먼저 판정
        var sn = sineName(ip.v);
        if (sn) return sn;
        var presets = PRESET_LIBS[state.presetLib][1];
        for (var i = 0; i < presets.length; i++) {
            var pv = presets[i][1], ok = true;
            for (var j = 0; j < 4; j++) {
                // 소수점 2자리 정밀도: 차이가 0.005 이내면 일치 (Flutter 3자리 값 0.745 등 경계값 대응)
                if (Math.abs(ip.v[j] - pv[j]) > 0.0051) { ok = false; break; }
            }
            if (ok) return presets[i][0];
        }
        var s = [];
        for (var k = 0; k < 4; k++) s.push(fmt(ip.v[k], 2));
        return "Custom [" + s.join(", ") + "]";
    }

    function readData() {
        var targets = getTargets(), items = [];
        for (var i = 0; i < targets.length; i++) {
            items.push(targets[i].error ? { name: propName(targets[i].prop), error: targets[i].error } : readOne(targets[i]));
        }
        return items;
    }

    // ---------- Path / Color ----------
    // speed 단위가 숫자 속성과 달라서 값 차이로 bezier를 계산할 수 없음.
    // 대신 실제 보간 결과(valueAtTime)를 샘플링해 진행률(0→1) 곡선의 시작·끝 기울기를 구하고,
    // influence(%, 단위 없음)와 조합해 bezier를 역산한다.

    // 시간 → 진행률(0~1) 함수. 변화가 없으면 null, 판정 불가면 "unknown"
    function progressFn(prop, t1, t2) {
        var a = prop.valueAtTime(t1, true), b = prop.valueAtTime(t2, true);
        var getV, va, vb;

        if (prop.propertyValueType === PropertyValueType.COLOR) {
            getV = function (v) { return v; };
            va = a; vb = b;
        } else {
            // Shape: 꼭짓점 좌표를 1차원 배열로 펼침
            getV = function (s) {
                var out = [], vt = s.vertices;
                for (var i = 0; i < vt.length; i++) { out.push(vt[i][0]); out.push(vt[i][1]); }
                return out;
            };
            va = getV(a); vb = getV(b);
            if (va.length !== vb.length) return "unknown";   // 꼭짓점 수가 다르면 판정 불가
        }

        // 가장 많이 변하는 성분을 기준으로 진행률 계산
        var best = -1, bestD = 1e-9;
        for (var i = 0; i < va.length; i++) {
            var dd = Math.abs(vb[i] - va[i]);
            if (dd > bestD) { bestD = dd; best = i; }
        }
        if (best < 0) return null;

        return function (time) {
            var v = getV(prop.valueAtTime(time, true));
            return (v[best] - va[best]) / (vb[best] - va[best]);
        };
    }

    // 진행률 곡선의 시작·끝 기울기 (진행률 / 정규화 시간)
    function measureSlopes(prog, t1, t2, x1, x2) {
        var dur = t2 - t1;
        // 샘플 간격(정규화 시간): influence가 작을수록 곡선이 급해서 간격도 줄임
        var h0 = Math.max(1e-6, Math.min(0.0005, x1 * 0.02));
        var h1 = Math.max(1e-6, Math.min(0.0005, (1 - x2) * 0.02));
        return [prog(t1 + h0 * dur) / h0, (1 - prog(t2 - h1 * dur)) / h1];
    }

    function readGui(t) {
        var prop = t.prop, k1 = t.k1, k2 = t.k2;
        var t1 = prop.keyTime(k1), t2 = prop.keyTime(k2), dur = t2 - t1;
        var outType = prop.keyOutInterpolationType(k1);
        var inType = prop.keyInInterpolationType(k2);
        var ip;

        if (outType === KeyframeInterpolationType.HOLD) {
            ip = { type: "hold" };
        } else if (outType === KeyframeInterpolationType.LINEAR && inType === KeyframeInterpolationType.LINEAR) {
            ip = { type: "linear" };
        } else {
            var prog = progressFn(prop, t1, t2);
            if (prog === null) {
                ip = { type: "none" };
            } else if (prog === "unknown") {
                ip = { type: "unknown" };
            } else {
                var x1 = prop.keyOutTemporalEase(k1)[0].influence / 100;
                var x2 = 1 - prop.keyInTemporalEase(k2)[0].influence / 100;
                var m = measureSlopes(prog, t1, t2, x1, x2);
                ip = { type: "bezier", v: [x1, x1 * m[0], x2, 1 - (1 - x2) * m[1]] };
            }
        }
        return { name: propName(prop), gui: true, axes: [{ ip: ip }], ms: Math.round(dur * 1000) };
    }

    function readOne(t) {
        if (t.gui) return readGui(t);
        var prop = t.prop;
        var v1 = toArr(prop.keyValue(t.k1)), v2 = toArr(prop.keyValue(t.k2));
        var dur = prop.keyTime(t.k2) - prop.keyTime(t.k1);
        var outType = prop.keyOutInterpolationType(t.k1);
        var inType = prop.keyInInterpolationType(t.k2);
        var easeOut = prop.keyOutTemporalEase(t.k1);
        var easeIn = prop.keyInTemporalEase(t.k2);
        var spatial = prop.isSpatial;

        var axes = [];
        for (var i = 0; i < v1.length; i++) {
            var avg = spatial ? dist(v1, v2) / dur : (v2[i] - v1[i]) / dur;
            var e = (easeOut.length === 1) ? 0 : i;
            axes.push({ a: v1[i], b: v2[i], ip: getInterp(outType, inType, easeOut[e], easeIn[e], avg) });
        }
        return {
            name: propName(prop),
            unit: UNIT_MAP[prop.matchName] || "",
            point: spatial && v1.length > 1,   // 공간 속성 + 다차원 = 포인트 배열 (Size 등 비공간 속성은 제외)
            axes: axes,
            ms: Math.round(dur * 1000)
        };
    }

    // ---------- 출력 ----------
    function convert(v, unit) {
        if (unit === "px" && state.useDp) return { v: v * 160 / DPI_LIST[state.dpiIndex][1], u: "dp" };
        return { v: v, u: unit };
    }

    function valuePart(a, b, unit) {
        var ca = convert(a, unit), cb = convert(b, unit), u = ca.u;
        if (!state.relative) return fmt(ca.v, 1) + u + ARROW + fmt(cb.v, 1) + u;
        var d = cb.v - ca.v;
        if (state.relFormat === "B") return signed(d, 1) + u;
        return "0" + u + ARROW + signed(d, 1) + u;
    }

    function line(name, ax, d) {
        return name + " : " + valuePart(ax.a, ax.b, d.unit) + " / " + d.ms + "ms / " + interpText(ax.ip);
    }

    function render() {
        if (!state.data) return;
        var lines = [];
        for (var n = 0; n < state.data.length; n++) {
            var d = state.data[n];
            if (d.error) lines.push(d.name + " : " + d.error);
            else pushLines(d, lines);
        }
        ui.out.text = lines.join("\n");
    }

    function pushLines(d, lines) {
        var axes = d.axes, i;

        // 포인트 속성 값 생략 모드: 값 대신 "GUI값 참조" (공간 속성은 모든 축이 같은 이징)
        if (d.gui || (d.point && state.omitPoint)) {
            lines.push(d.name + " : GUI값 참조 / " + d.ms + "ms / " + interpText(axes[0].ip));
            return;
        }

        if (axes.length === 1) {
            lines.push(line(d.name, axes[0], d));
        } else {
            // 변화 없는 축은 제외 (2D 레이어 Scale의 Z=100 등). 전부 변화 없으면 전부 대상
            var changed = [];
            for (i = 0; i < axes.length; i++) if (Math.abs(axes[i].b - axes[i].a) > 1e-6) changed.push(i);
            if (changed.length === 0) for (i = 0; i < axes.length; i++) changed.push(i);

            // 대상 축이 2개 이상이고 값·interpolation이 모두 같으면 한 줄로 통일
            var same = changed.length > 1;
            for (i = 1; same && i < changed.length; i++) {
                var ax = axes[changed[i]], ax0 = axes[changed[0]];
                if (Math.abs(ax.a - ax0.a) > 1e-6 || Math.abs(ax.b - ax0.b) > 1e-6 || interpText(ax.ip) !== interpText(ax0.ip)) same = false;
            }
            if (same) {
                lines.push(line(d.name, axes[changed[0]], d));
            } else {
                for (i = 0; i < changed.length; i++) lines.push(line(d.name + " " + AXIS[changed[i]], axes[changed[i]], d));
            }
        }
    }

    function refresh() {
        try {
            state.data = readData();
            render();
        } catch (e) {
            state.data = null;
            ui.out.text = e.message || String(e);
        }
    }

    // ---------- 적용 ----------
    function parseBezier(str) {
        var parts = str.replace(/[\[\]\s]/g, "").split(",");
        if (parts.length !== 4) throw new Error("값 4개를 입력해줘. 예: [0.17, 0.28, 0, 1]");
        var v = [];
        for (var i = 0; i < 4; i++) {
            var n = parseFloat(parts[i]);
            if (isNaN(n)) throw new Error("숫자가 아닌 값이 있어: " + parts[i]);
            v.push(n);
        }
        if (v[0] < 0 || v[0] > 1 || v[2] < 0 || v[2] > 1) throw new Error("x1, x2는 0~1 범위여야 해.");
        return v;
    }

    function copyEase(arr) {
        var r = [];
        for (var i = 0; i < arr.length; i++) r.push(new KeyframeEase(arr[i].speed, arr[i].influence));
        return r;
    }

    function applyBezier() {
        var b, targets;
        try {
            b = parseBezier(ui.inp.text);
            targets = getTargets();
        } catch (e) {
            alert(e.message || String(e));
            return;
        }
        // 하나라도 조건이 안 맞으면 전체 적용 취소
        var errs = [];
        for (var i = 0; i < targets.length; i++) {
            if (targets[i].error) errs.push(propName(targets[i].prop) + " : " + targets[i].error);
        }
        if (errs.length) {
            alert("적용 취소\n" + errs.join("\n"));
            return;
        }

        app.beginUndoGroup("Apply Bezier");
        for (var j = 0; j < targets.length; j++) {
            try {
                if (targets[j].gui) applyGui(targets[j], b);
                else applyOne(targets[j], b);
            } catch (e2) {
                alert("적용 실패 (" + propName(targets[j].prop) + "): " + (e2.message || String(e2)));
            }
        }
        app.endUndoGroup();
        refresh();
    }

    // Path / Color 적용: speed 단위를 모르므로 보정 방식 사용
    //  1) 목표 influence + 임시 speed 로 적용
    //  2) valueAtTime 으로 실제 시작·끝 기울기 측정
    //  3) 기울기는 speed 에 정비례 → speed × (목표 기울기 / 측정 기울기) 로 재적용 (정밀도 위해 반복)
    function applyGui(t, b) {
        var prop = t.prop, k1 = t.k1, k2 = t.k2;
        var t1 = prop.keyTime(k1), t2 = prop.keyTime(k2);

        var keepIn1 = copyEase(prop.keyInTemporalEase(k1));
        var keepOut2 = copyEase(prop.keyOutTemporalEase(k2));
        var n = prop.keyOutTemporalEase(k1).length;

        var inf1 = clamp(b[0] * 100, 0.1, 100);
        var inf2 = clamp((1 - b[2]) * 100, 0.1, 100);
        var x1 = inf1 / 100, x2 = 1 - inf2 / 100;

        // 목표 기울기 (진행률/정규화 시간)
        var target0 = b[1] / x1;
        var target1 = (1 - b[3]) / (1 - x2);

        prop.setInterpolationTypeAtKey(k1, prop.keyInInterpolationType(k1), KeyframeInterpolationType.BEZIER);
        prop.setInterpolationTypeAtKey(k2, KeyframeInterpolationType.BEZIER, prop.keyOutInterpolationType(k2));
        prop.setTemporalContinuousAtKey(k1, false);
        prop.setTemporalContinuousAtKey(k2, false);
        prop.setTemporalAutoBezierAtKey(k1, false);
        prop.setTemporalAutoBezierAtKey(k2, false);

        function setEase(sOut, sIn) {
            var newOut = [], newIn = [];
            for (var i = 0; i < n; i++) {
                newOut.push(new KeyframeEase(sOut, inf1));
                newIn.push(new KeyframeEase(sIn, inf2));
            }
            prop.setTemporalEaseAtKey(k1, keepIn1, newOut);
            prop.setTemporalEaseAtKey(k2, newIn, keepOut2);
        }

        var sOut = (target0 === 0) ? 0 : 1;
        var sIn = (target1 === 0) ? 0 : 1;
        setEase(sOut, sIn);

        var prog = progressFn(prop, t1, t2);
        if (prog === null) return;   // 두 키 값이 같으면 influence만 적용
        if (prog === "unknown") throw new Error("두 키의 꼭짓점 수가 달라 적용할 수 없어.");

        for (var iter = 0; iter < 3; iter++) {
            var m = measureSlopes(prog, t1, t2, x1, x2);
            if (sOut !== 0) {
                if (Math.abs(m[0]) < 1e-12) throw new Error("시작 기울기를 측정할 수 없어.");
                sOut = sOut * target0 / m[0];
            }
            if (sIn !== 0) {
                if (Math.abs(m[1]) < 1e-12) throw new Error("끝 기울기를 측정할 수 없어.");
                sIn = sIn * target1 / m[1];
            }
            setEase(sOut, sIn);
        }
    }

    function applyOne(t, b) {
        var prop = t.prop, k1 = t.k1, k2 = t.k2;
        var v1 = toArr(prop.keyValue(k1)), v2 = toArr(prop.keyValue(k2));
        var dur = prop.keyTime(k2) - prop.keyTime(k1);

        var keepIn1 = copyEase(prop.keyInTemporalEase(k1));
        var keepOut2 = copyEase(prop.keyOutTemporalEase(k2));
        var n = prop.keyOutTemporalEase(k1).length;

        var inf1 = clamp(b[0] * 100, 0.1, 100);
        var inf2 = clamp((1 - b[2]) * 100, 0.1, 100);

        var newOut = [], newIn = [];
        for (var i = 0; i < n; i++) {
            var avg = (n === 1 && v1.length > 1) ? dist(v1, v2) / dur : (v2[i] - v1[i]) / dur;
            newOut.push(new KeyframeEase(b[1] / (inf1 / 100) * avg, inf1));
            newIn.push(new KeyframeEase((1 - b[3]) / (inf2 / 100) * avg, inf2));
        }

        prop.setInterpolationTypeAtKey(k1, prop.keyInInterpolationType(k1), KeyframeInterpolationType.BEZIER);
        prop.setInterpolationTypeAtKey(k2, KeyframeInterpolationType.BEZIER, prop.keyOutInterpolationType(k2));
        prop.setTemporalContinuousAtKey(k1, false);
        prop.setTemporalContinuousAtKey(k2, false);
        prop.setTemporalAutoBezierAtKey(k1, false);
        prop.setTemporalAutoBezierAtKey(k2, false);
        prop.setTemporalEaseAtKey(k1, keepIn1, newOut);
        prop.setTemporalEaseAtKey(k2, newIn, keepOut2);
    }

    // ---------- 설정 창 ----------
    function openSettings() {
        var d = new Window("dialog", "설정");
        d.orientation = "column";
        d.alignChildren = ["fill", "top"];

        var p1 = d.add("panel", undefined, "DPI");
        p1.alignChildren = ["fill", "top"];
        var items = [];
        for (var i = 0; i < DPI_LIST.length; i++) {
            items.push(DPI_LIST[i][0] + " (" + DPI_LIST[i][1] + "dpi, " + DPI_LIST[i][2] + ")");
        }
        var dd = p1.add("dropdownlist", undefined, items);
        dd.selection = state.dpiIndex;

        var p2 = d.add("panel", undefined, "상대값 표시 형식");
        p2.alignChildren = ["left", "top"];
        var rA = p2.add("radiobutton", undefined, "A :  0dp" + ARROW + "+2dp");
        var rB = p2.add("radiobutton", undefined, "B :  +2dp");
        rA.value = (state.relFormat !== "B");
        rB.value = (state.relFormat === "B");

        var p3 = d.add("panel", undefined, "참조 프리셋");
        p3.alignChildren = ["left", "top"];
        var rLib = [];
        for (var li = 0; li < PRESET_LIBS.length; li++) {
            rLib.push(p3.add("radiobutton", undefined, PRESET_LIBS[li][0]));
            rLib[li].value = (state.presetLib === li);
        }

        var g = d.add("group");
        g.alignment = ["right", "top"];
        g.add("button", undefined, "확인", { name: "ok" });
        g.add("button", undefined, "취소", { name: "cancel" });

        if (d.show() === 1) {
            state.dpiIndex = dd.selection.index;
            state.relFormat = rB.value ? "B" : "A";
            saveSetting("dpiIndex", state.dpiIndex);
            saveSetting("relFormat", state.relFormat);
            for (var lj = 0; lj < rLib.length; lj++) if (rLib[lj].value) state.presetLib = lj;
            saveSetting("presetLib", state.presetLib);
            render();
        }
    }

    // ---------- UI ----------
    var ui = {};

    function buildUI(obj) {
        var win = (obj instanceof Panel) ? obj : new Window("palette", "Keyframe Info", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 6;
        win.margins = 8;

        var row1 = win.add("group");
        row1.alignChildren = ["fill", "center"];
        var btnRead = row1.add("button", undefined, "가져오기");
        var btnUnit = row1.add("button", undefined, "px");
        var btnMode = row1.add("button", undefined, "실제값");
        var btnPoint = row1.add("button", undefined, "xy 생략");
        var btnSet = row1.add("button", undefined, "설정");
        btnPoint.preferredSize.width = 60;
        btnUnit.preferredSize.width = 50;
        btnMode.preferredSize.width = 60;
        btnSet.preferredSize.width = 50;

        ui.out = win.add("edittext", undefined, "키프레임 2개 선택 후 [가져오기]", { multiline: true, readonly: true, scrolling: true });
        ui.out.preferredSize = [340, 80];
        ui.out.alignment = ["fill", "fill"];

        var row2 = win.add("group");
        row2.alignChildren = ["fill", "center"];
        row2.add("statictext", undefined, "Bezier");
        ui.inp = row2.add("edittext", undefined, "[0.17, 0.28, 0, 1]");
        ui.inp.alignment = ["fill", "center"];
        var btnApply = row2.add("button", undefined, "적용");
        btnApply.preferredSize.width = 50;

        btnRead.onClick = refresh;
        btnUnit.onClick = function () {
            state.useDp = !state.useDp;
            btnUnit.text = state.useDp ? "dp" : "px";
            render();
        };
        btnMode.onClick = function () {
            state.relative = !state.relative;
            btnMode.text = state.relative ? "상대값" : "실제값";
            render();
        };
        btnPoint.onClick = function () {
            state.omitPoint = !state.omitPoint;
            btnPoint.text = state.omitPoint ? "xy 생략" : "xy 표시";
            render();
        };
        btnSet.onClick = openSettings;
        btnApply.onClick = applyBezier;

        win.onResizing = win.onResize = function () { this.layout.resize(); };
        win.layout.layout(true);
        return win;
    }

    var w = buildUI(thisObj);
    if (w instanceof Window) {
        w.center();
        w.show();
    }
})(this);
