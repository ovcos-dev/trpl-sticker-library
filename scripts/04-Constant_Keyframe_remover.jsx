(function() {
    app.beginUndoGroup("Optimize and then Clear Expressions");

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("컴포지션을 선택해주세요.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("레이어를 선택해주세요.");
        return;
    }

    // --- 1단계: 키프레임 최적화 (중간값 삭제) 진행 ---
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var selectedProps = layer.selectedProperties;

        if (selectedProps.length > 0) {
            for (var j = 0; j < selectedProps.length; j++) {
                processOptimization(selectedProps[j]);
            }
        } else {
            searchAndOptimize(layer);
        }
    }

    // --- 2단계: 익스프레션만 찾아 삭제 진행 ---
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var selectedProps = layer.selectedProperties;

        if (selectedProps.length > 0) {
            for (var j = 0; j < selectedProps.length; j++) {
                clearExpressionOnly(selectedProps[j]);
            }
        } else {
            searchAndClearExpression(layer);
        }
    }

    // [함수] 1단계용: 속성 탐색 및 최적화
    function searchAndOptimize(parent) {
        for (var k = 1; k <= parent.numProperties; k++) {
            var prop = parent.property(k);
            if (prop.propertyType === PropertyType.PROPERTY) {
                processOptimization(prop);
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
                searchAndOptimize(prop);
            }
        }
    }

    function processOptimization(prop) {
        if (prop.propertyType !== PropertyType.PROPERTY) return;

        // 익스프레션이 있다면 먼저 베이킹 (키프레임 생성)
        if (prop.canSetExpression && prop.expressionEnabled) {
            prop.selected = true;
            app.executeCommand(app.findMenuCommandId("Convert Expression to Keyframes"));
        }

        // 키프레임 중간값 최적화
        if (prop.numKeys > 2) {
            optimizeKeyframes(prop);
        }
    }

    // [함수] 2단계용: 익스프레션 삭제 전용
    function searchAndClearExpression(parent) {
        for (var k = 1; k <= parent.numProperties; k++) {
            var prop = parent.property(k);
            if (prop.propertyType === PropertyType.PROPERTY) {
                clearExpressionOnly(prop);
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
                searchAndClearExpression(prop);
            }
        }
    }

    function clearExpressionOnly(prop) {
        if (prop.propertyType !== PropertyType.PROPERTY) return;
        
        // 익스프레션이 존재한다면 빈 문자열로 삭제
        if (prop.canSetExpression && prop.expression !== "") {
            prop.expression = ""; 
        }
    }

    // [함수] 키프레임 비교 및 삭제 로직
    function optimizeKeyframes(prop) {
        for (var m = prop.numKeys - 1; m > 1; m--) {
            var valPrev = prop.keyValue(m - 1);
            var valCurr = prop.keyValue(m);
            var valNext = prop.keyValue(m + 1);

            if (compareValuesWithTolerance(valPrev, valCurr) && compareValuesWithTolerance(valCurr, valNext)) {
                prop.removeKey(m);
            }
        }
    }

    function compareValuesWithTolerance(v1, v2) {
        if (v1 instanceof Array) {
            for (var i = 0; i < v1.length; i++) {
                if (Math.abs(v1[i] - v2[i]) > 0.01) return false;
            }
            return true;
        }
        if (typeof v1 === "number") {
            return Math.abs(v1 - v2) <= 0.01;
        }
        return v1 === v2;
    }

    app.endUndoGroup();
    alert("순차 완료: 1. 키프레임 최적화 -> 2. 익스프레션 삭제");
})();