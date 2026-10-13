(function() {
    app.beginUndoGroup("Move Anchor Point to Parent World Position");

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("컴포지션을 선택해 주세요.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("레이어를 하나 이상 선택해 주세요.");
        return;
    }

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var parentLayer = layer.parent;

        if (!parentLayer) continue;

        var anchorProp = layer.transform.anchorPoint;
        var posProp = layer.transform.position;

        // --- 월드 좌표 계산 루틴 ---
        // 부모의 월드 위치를 현재 레이어의 로컬 좌표로 변환하는 표현식을 임시로 사용합니다.
        var tempExpr = 'thisLayer.fromWorld(parent.toWorld(parent.anchorPoint))';
        
        // 현재 시간 기준 타겟 좌표 추출
        var targetAnchorInLayerSpace;
        if (anchorProp.numKeys > 0) {
            // 키프레임이 있다면 첫 번째 키프레임 시간 기준으로 계산
            targetAnchorInLayerSpace = anchorProp.expression = tempExpr;
            targetAnchorInLayerSpace = anchorProp.value;
        } else {
            anchorProp.expression = tempExpr;
            targetAnchorInLayerSpace = anchorProp.value;
        }
        anchorProp.expression = ""; // 표현식 제거

        var oldAnchor = anchorProp.value;
        var delta = [
            targetAnchorInLayerSpace[0] - oldAnchor[0],
            targetAnchorInLayerSpace[1] - oldAnchor[1],
            (oldAnchor.length > 2) ? (targetAnchorInLayerSpace[2] - oldAnchor[2]) : 0
        ];

        // --- 값 적용 (키프레임 유지) ---
        
        // 1. Anchor Point 업데이트
        if (anchorProp.numKeys > 0) {
            for (var k = 1; k <= anchorProp.numKeys; k++) {
                var aVal = anchorProp.keyValue(k);
                anchorProp.setValueAtKey(k, [aVal[0] + delta[0], aVal[1] + delta[1], (aVal.length > 2 ? aVal[2] + delta[2] : 0)]);
            }
        } else {
            anchorProp.setValue([oldAnchor[0] + delta[0], oldAnchor[1] + delta[1], (oldAnchor.length > 2 ? oldAnchor[2] + delta[2] : 0)]);
        }

        // 2. Position 업데이트 (화면 위치 고정)
        if (posProp.numKeys > 0) {
            for (var m = 1; m <= posProp.numKeys; m++) {
                var pVal = posProp.keyValue(m);
                posProp.setValueAtKey(m, [pVal[0] + delta[0], pVal[1] + delta[1], (pVal.length > 2 ? pVal[2] + delta[2] : 0)]);
            }
        } else {
            var curP = posProp.value;
            posProp.setValue([curP[0] + delta[0], curP[1] + delta[1], (curP.length > 2 ? curP[2] + delta[2] : 0)]);
        }
    }

    app.endUndoGroup();
})();