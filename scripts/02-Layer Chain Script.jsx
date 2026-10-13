// 선택된 레이어를 선택된 순서에 따라 부모 레이어로 연결하는 스크립트
(function() {
    // 활성화된 컴포지션 가져오기
    var comp = app.project.activeItem;

    // 컴포지션이 유효한지 확인
    if (!comp || !(comp instanceof CompItem)) {
        alert("활성화된 컴포지션이 없습니다.");
        return;
    }

    // 선택된 레이어 가져오기
    var selectedLayers = comp.selectedLayers;

    // 선택된 레이어가 있는지 확인
    if (selectedLayers.length < 2) {
        alert("두 개 이상의 레이어를 선택해주세요.");
        return;
    }

    // 작업을 Undo 그룹으로 묶기
    app.beginUndoGroup("Layer Chain");

    // 선택된 순서대로 부모-자식 관계 설정
    for (var i = 0; i < selectedLayers.length - 1; i++) {
        selectedLayers[i].parent = selectedLayers[i + 1];
    }

    // 작업 완료
    app.endUndoGroup();

    alert("레이어가 선택된 순서대로 체인되었습니다.");
})();
