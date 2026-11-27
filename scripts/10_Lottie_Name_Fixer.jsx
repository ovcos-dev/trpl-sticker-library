/*
10_Lottie_Name_Fixer.jsx  v2.0

Bodymovin 그라디언트 컬러 꼬임 방지용 이름 검사/정돈 스크립트.

원인:
  Bodymovin은 그라디언트 컬러를 저장된 .aep 안에서
  [컴프 > 레이어 > 그룹 > 그라디언트] 이름을 부분 문자열(indexOf)로 찾아 읽는다.
  그래서 어떤 이름이 다른 이름 안에 통째로 포함되면(중복 포함)
  엉뚱한 그라디언트의 컬러를 읽어 온다.
  예) "Radial_Gradient Fill 1" 아래의 "Gradient Fill 1"

사용법:
  1. 검사할 컴포지션을 열고 실행 (안에 들어있는 프리컴프까지 검사)
  2. 충돌 목록 확인 후 정돈 방식 선택 → [정돈]
     - 안전 정돈(기본): 충돌한 이름만 뒤에 [01] 번호 추가
     - 랜덤 이름: 그라디언트 경로의 레이어/그룹/그라디언트 이름 전체를 랜덤으로 변경
  3. 프로젝트 저장 후 Bodymovin export

주의:
  이름을 참조하는 Expression이 있으면 연결이 깨질 수 있음.
  Undo 1회로 전체 원복.
*/

(function lottieNameFixer() {
    var SCRIPT_NAME = "Lottie Name Fixer";
    var MAX_PASSES = 5;
    var RANDOM_LENGTH = 12;

    var MN_SHAPE_LAYER = "ADBE Vector Layer";
    var MN_ROOT = "ADBE Root Vectors Group";
    var MN_GROUP = "ADBE Vector Group";
    var MN_GROUP_CONTENTS = "ADBE Vectors Group";
    var MN_GFILL = "ADBE Vector Graphic - G-Fill";
    var MN_GSTROKE = "ADBE Vector Graphic - G-Stroke";
    var MN_MASKS = "ADBE Mask Parade";
    var MN_EFFECTS = "ADBE Effect Parade";

    // ---------- 수집 ----------

    function collectScopeComps(rootComp) {
        var list = [];
        var visited = {};

        function walk(comp) {
            var i, layer;
            if (visited[comp.id]) {
                return;
            }
            visited[comp.id] = true;
            list.push(comp);
            for (i = 1; i <= comp.numLayers; i++) {
                layer = comp.layer(i);
                if (layer.source && (layer.source instanceof CompItem)) {
                    walk(layer.source);
                }
            }
        }

        walk(rootComp);
        return list;
    }

    function addEntry(pool, name, key) {
        pool.push({ name: name, key: key });
    }

    // 레이어 안의 Shape 항목(그룹/패스/필/스트로크/그라디언트 등) 이름을 상위 pool 전부에 넣고,
    // 그라디언트를 만나면 onGradient(경로배열) 호출.
    // 그룹마다 하위 항목 pool을 따로 둔다: Bodymovin은 그룹 위치부터 검색하므로
    // 그룹 안 항목의 검색 범위는 그 그룹의 하위 항목이다.
    function walkContents(contents, keyPrefix, ancestorPools, parentPoolKey, pools, pathEls, onGradient) {
        var i, j, item, key, el, groupPool;
        for (i = 1; i <= contents.numProperties; i++) {
            item = contents.property(i);
            key = keyPrefix + "/" + i;
            for (j = 0; j < ancestorPools.length; j++) {
                addEntry(ancestorPools[j], item.name, key);
            }
            el = { kind: "item", obj: item, name: item.name, key: key, poolKey: parentPoolKey };

            if (item.matchName === MN_GROUP) {
                groupPool = [];
                pools[key] = groupPool;
                ancestorPools.push(groupPool);
                pathEls.push(el);
                walkContents(item.property(MN_GROUP_CONTENTS), key, ancestorPools, key, pools, pathEls, onGradient);
                pathEls.pop();
                ancestorPools.pop();
            } else if (item.matchName === MN_GFILL || item.matchName === MN_GSTROKE) {
                pathEls.push(el);
                onGradient(pathEls);
                pathEls.pop();
            }
        }
    }

    function addParadeNames(layer, matchName, keyPrefix, pool) {
        var parade = layer.property(matchName);
        var i;
        if (!parade) {
            return;
        }
        for (i = 1; i <= parade.numProperties; i++) {
            addEntry(pool, parade.property(i).name, keyPrefix + i);
        }
    }

    // 프로젝트 전체 이름 pool + 범위 컴프의 그라디언트 경로 요소 수집
    function collectAll(scopeComps) {
        var data = {
            globalPool: [],   // 컴프 이름 검색 범위: 파일 전체
            compPools: {},    // 레이어 이름 검색 범위: 해당 컴프
            layerPools: {},   // 그룹/그라디언트 검색 범위: 해당 레이어 또는 상위 그룹 (키: 레이어/그룹 키)
            elements: [],     // 그라디언트 경로에 있는 요소 (중복 제거)
            gradientCount: 0
        };
        var inScope = {};
        var seen = {};
        var i, j, item, comp, layer, compKey, layerKey, compPool, layerPool, root;

        for (i = 0; i < scopeComps.length; i++) {
            inScope[scopeComps[i].id] = true;
        }

        function pushElement(el, poolRef) {
            if (seen[el.key]) {
                return;
            }
            seen[el.key] = true;
            el.pool = poolRef;
            data.elements.push(el);
        }

        for (i = 1; i <= app.project.numItems; i++) {
            item = app.project.item(i);
            addEntry(data.globalPool, item.name, "I" + item.id);
            if (!(item instanceof CompItem)) {
                continue;
            }
            comp = item;
            compKey = "I" + comp.id;
            compPool = [];
            data.compPools[compKey] = compPool;

            for (j = 1; j <= comp.numLayers; j++) {
                layer = comp.layer(j);
                layerKey = "L" + comp.id + ":" + j;
                layerPool = [];
                data.layerPools[layerKey] = layerPool;

                // 소스 이름을 그대로 쓰는 레이어(프리컴프/푸티지)는 .aep에 이름이 따로 저장되지 않음
                if (!(layer.source && !layer.isNameSet)) {
                    addEntry(compPool, layer.name, layerKey);
                }
                addParadeNames(layer, MN_MASKS, layerKey + "M", layerPool);
                addParadeNames(layer, MN_EFFECTS, layerKey + "E", layerPool);

                if (layer.matchName !== MN_SHAPE_LAYER) {
                    continue;
                }
                root = layer.property(MN_ROOT);
                (function (comp, compKey, layer, layerKey, layerPool) {
                    var compEl = { kind: "comp", obj: comp, name: comp.name, key: compKey };
                    var layerEl = { kind: "layer", obj: layer, name: layer.name, key: layerKey };
                    walkContents(root, layerKey + "S", [layerPool], layerKey, data.layerPools, [], function (pathEls) {
                        var k;
                        if (!inScope[comp.id]) {
                            return;
                        }
                        data.gradientCount++;
                        compEl.pathLabel = comp.name;
                        layerEl.pathLabel = comp.name + " > " + layer.name;
                        pushElement(compEl, "global");
                        pushElement(layerEl, compKey);
                        for (k = 0; k < pathEls.length; k++) {
                            pathEls[k].pathLabel = makeLabel(comp, layer, pathEls, k);
                            pushElement(pathEls[k], pathEls[k].poolKey);
                        }
                    });
                }(comp, compKey, layer, layerKey, layerPool));
            }
        }

        // 레이어/Shape 이름도 파일 전체 범위에 포함 (컴프 이름 검색은 파일 처음부터 진행되므로)
        for (compKey in data.compPools) {
            appendPool(data.globalPool, data.compPools[compKey]);
        }
        for (layerKey in data.layerPools) {
            appendPool(data.globalPool, data.layerPools[layerKey]);
        }
        return data;
    }

    function appendPool(target, source) {
        var i;
        for (i = 0; i < source.length; i++) {
            target.push(source[i]);
        }
    }

    function makeLabel(comp, layer, pathEls, upto) {
        var s = comp.name + " > " + layer.name;
        var i;
        for (i = 0; i <= upto; i++) {
            s += " > " + pathEls[i].name;
        }
        return s;
    }

    // ---------- 판정 ----------

    function getPool(data, poolRef) {
        if (poolRef === "global") {
            return data.globalPool;
        }
        if (data.compPools[poolRef]) {
            return data.compPools[poolRef];
        }
        return data.layerPools[poolRef];
    }

    // 요소 이름이 같은 검색 범위의 다른 이름 안에 포함되면(같은 이름 포함) 충돌
    function analyze(data) {
        var conflicts = [];
        var i, j, el, pool;
        for (i = 0; i < data.elements.length; i++) {
            el = data.elements[i];
            pool = getPool(data, el.pool);
            for (j = 0; j < pool.length; j++) {
                if (pool[j].key !== el.key && pool[j].name.indexOf(el.name) !== -1) {
                    conflicts.push({ el: el, other: pool[j].name });
                    break;
                }
            }
        }
        return conflicts;
    }

    // ---------- 이름 생성 ----------

    // 새 이름이 기존 이름 안에 포함되지 않아야 함.
    // (반대 방향, 즉 새 이름이 다른 이름을 포함하는 경우는 정돈 후 재검사에서 처리)
    function nameIsFree(candidate, globalPool) {
        var i;
        for (i = 0; i < globalPool.length; i++) {
            if (globalPool[i].name.indexOf(candidate) !== -1) {
                return false;
            }
        }
        return true;
    }

    function pad2(n) {
        return (n < 10 ? "0" : "") + n;
    }

    function makeSafeName(baseName, state, globalPool) {
        var base = baseName.replace(/\s\[\d+\]$/, "");
        var candidate;
        do {
            candidate = base + " [" + pad2(state.counter) + "]";
            state.counter++;
        } while (!nameIsFree(candidate, globalPool));
        globalPool.push({ name: candidate, key: "__new" });
        return candidate;
    }

    function randomToken(length) {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var s = "";
        var i;
        for (i = 0; i < length; i++) {
            s += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return s;
    }

    function prefixFor(el) {
        if (el.kind === "comp") {
            return "CMP_";
        }
        if (el.kind === "layer") {
            return "LYR_";
        }
        if (el.obj.matchName === MN_GROUP) {
            return "GRP_";
        }
        if (el.obj.matchName === MN_GFILL) {
            return "GFL_";
        }
        return "GST_";
    }

    // 접두어 4자 + 랜덤 12자 = 길이 고정 → 서로 포함될 수 없음(같은 이름 제외)
    function makeRandomName(el, globalPool) {
        var candidate;
        do {
            candidate = prefixFor(el) + randomToken(RANDOM_LENGTH);
        } while (!nameIsFree(candidate, globalPool));
        globalPool.push({ name: candidate, key: "__new" });
        return candidate;
    }

    function safeRename(obj, newName) {
        try {
            obj.name = newName;
            return true;
        } catch (e) {
            return false;
        }
    }

    // ---------- 정돈 실행 ----------

    // mode: "safe" | "random"
    function fix(rootComp, mode) {
        var state = { counter: 1 };
        var renamed = 0;
        var failed = 0;
        var pass, data, conflicts, i, el, newName;

        // 랜덤 모드: 1회차에 경로상의 레이어/그룹/그라디언트 전부 변경
        if (mode === "random") {
            data = collectAll(collectScopeComps(rootComp));
            for (i = 0; i < data.elements.length; i++) {
                el = data.elements[i];
                if (el.kind === "comp") {
                    continue;
                }
                newName = makeRandomName(el, data.globalPool);
                if (safeRename(el.obj, newName)) {
                    renamed++;
                } else {
                    failed++;
                }
            }
        }

        // 남은 충돌 정리 (안전 모드는 여기서만 처리). 이름이 바뀌면 다시 수집해 재검사
        for (pass = 0; pass < MAX_PASSES; pass++) {
            data = collectAll(collectScopeComps(rootComp));
            conflicts = analyze(data);
            if (conflicts.length === 0) {
                break;
            }
            for (i = 0; i < conflicts.length; i++) {
                el = conflicts[i].el;
                newName = (mode === "random")
                    ? makeRandomName(el, data.globalPool)
                    : makeSafeName(el.name, state, data.globalPool);
                if (safeRename(el.obj, newName)) {
                    renamed++;
                } else {
                    failed++;
                }
            }
        }

        data = collectAll(collectScopeComps(rootComp));
        return { renamed: renamed, failed: failed, remaining: analyze(data) };
    }

    // ---------- UI ----------

    // 반환: "safe" | "random" | null(취소)
    function showDialog(conflicts, gradientCount) {
        var w = new Window("dialog", SCRIPT_NAME);
        var i, row, list, rbSafe, rbRandom, btns, result = null;

        w.orientation = "column";
        w.alignChildren = ["fill", "top"];

        w.add("statictext", undefined,
            "그라디언트 " + gradientCount + "개 중 이름 충돌 " + conflicts.length + "건 " +
            "(Bodymovin export 시 컬러가 꼬일 수 있음)");

        list = w.add("listbox", undefined, "", {
            numberOfColumns: 2,
            showHeaders: true,
            columnTitles: ["충돌 항목 (위치)", "포함하고 있는 이름"],
            columnWidths: [420, 220]
        });
        list.preferredSize = [660, 220];
        for (i = 0; i < conflicts.length; i++) {
            row = list.add("item", conflicts[i].el.pathLabel);
            row.subItems[0].text = conflicts[i].other;
        }

        var modePanel = w.add("panel", undefined, "정돈 방식");
        modePanel.alignChildren = ["left", "top"];
        rbSafe = modePanel.add("radiobutton", undefined,
            "안전 정돈 (기본) - 충돌한 이름만 뒤에 [01] 번호 추가");
        rbRandom = modePanel.add("radiobutton", undefined,
            "랜덤 이름 - 그라디언트 경로의 레이어/그룹/그라디언트 이름 전체 변경");
        rbSafe.value = true;

        w.add("statictext", undefined,
            "주의: 이름을 참조하는 Expression은 연결이 깨질 수 있습니다. (Undo 1회로 원복)");

        btns = w.add("group");
        btns.alignment = ["right", "top"];
        btns.add("button", undefined, "정돈", { name: "ok" });
        btns.add("button", undefined, "취소", { name: "cancel" });

        if (w.show() === 1) {
            result = rbRandom.value ? "random" : "safe";
        }
        return result;
    }

    // ---------- main ----------

    function main() {
        var comp = app.project ? app.project.activeItem : null;
        var data, conflicts, mode, res, msg;

        if (!(comp instanceof CompItem)) {
            alert("검사할 컴포지션을 연 뒤 다시 실행해 주세요.", SCRIPT_NAME);
            return;
        }

        data = collectAll(collectScopeComps(comp));
        if (data.gradientCount === 0) {
            alert("검사 범위에 Gradient Fill/Stroke가 없습니다.", SCRIPT_NAME);
            return;
        }

        conflicts = analyze(data);
        if (conflicts.length === 0) {
            alert("문제 없음\n\n그라디언트 " + data.gradientCount + "개 모두 이름 충돌이 없습니다.", SCRIPT_NAME);
            return;
        }

        // 대화상자는 Undo 그룹 밖에서 처리 (Undo 그룹 안에는 이름 변경만)
        mode = showDialog(conflicts, data.gradientCount);
        if (!mode) {
            return;
        }

        app.beginUndoGroup(SCRIPT_NAME);
        try {
            res = fix(comp, mode);
        } catch (e) {
            res = null;
            msg = "처리 중 오류가 발생했습니다.\n\n" + e.toString() + (e.line ? "\nLine: " + e.line : "");
        } finally {
            app.endUndoGroup();
        }

        if (!res) {
            alert(msg, SCRIPT_NAME);
            return;
        }

        msg = "정돈 완료\n\n변경: " + res.renamed + "개";
        if (res.failed > 0) {
            msg += "\n변경 실패: " + res.failed + "개";
        }
        if (res.remaining.length > 0) {
            msg += "\n남은 충돌: " + res.remaining.length + "건 (스크립트를 다시 실행해 확인하세요)";
        }
        msg += "\n\n프로젝트를 저장한 뒤 Bodymovin으로 export 하세요.\n(Bodymovin은 저장된 .aep에서 그라디언트를 읽습니다)";
        alert(msg, SCRIPT_NAME);
    }

    main();
}());
