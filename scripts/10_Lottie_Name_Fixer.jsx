/*
Randomize Shape Layer & Path Names.jsx

Active composition:
- Renames every Shape Layer.
- Recursively renames every shape Group and Path item inside Contents.
- Generates unique alphanumeric names.
- Wraps the operation in one Undo step.

Warning:
Expressions or scripts that refer to layers/groups/paths by display name may break.
*/

(function randomizeShapeAndPathNames() {
    var SCRIPT_NAME = "Randomize Shape Layer & Path Names";
    var RANDOM_LENGTH = 12;

    function isCompItem(item) {
        return item && (item instanceof CompItem);
    }

    function randomToken(length) {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var result = "";
        var i;

        for (i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    function makeUniqueName(prefix, usedNames) {
        var name;

        do {
            name = prefix + "_" + randomToken(RANDOM_LENGTH);
        } while (usedNames[name]);

        usedNames[name] = true;
        return name;
    }

    function safeRename(propertyBase, newName) {
        try {
            propertyBase.name = newName;
            return true;
        } catch (error) {
            return false;
        }
    }

    function renameVectorTree(group, usedNames, stats) {
        var i;
        var item;
        var matchName;

        if (!group || group.numProperties === undefined) {
            return;
        }

        // Iterate backwards defensively in case AE refreshes indexed groups.
        for (i = group.numProperties; i >= 1; i--) {
            item = group.property(i);

            if (!item) {
                continue;
            }

            matchName = item.matchName;

            // Shape group shown as "Group 1"
            if (matchName === "ADBE Vector Group") {
                if (safeRename(item, makeUniqueName("GRP", usedNames))) {
                    stats.groups++;
                }

                // Recurse into the group's Contents.
                renameVectorTree(item.property("ADBE Vectors Group"), usedNames, stats);
            }

            // Bézier / parametric path items shown as "Path 1",
            // "Rectangle Path 1", "Ellipse Path 1", etc.
            else if (
                matchName === "ADBE Vector Shape - Group" ||
                matchName === "ADBE Vector Shape - Rect" ||
                matchName === "ADBE Vector Shape - Ellipse" ||
                matchName === "ADBE Vector Shape - Star"
            ) {
                if (safeRename(item, makeUniqueName("PATH", usedNames))) {
                    stats.paths++;
                }
            }

            // Some nested property groups may contain vector groups or paths.
            else if (item.numProperties !== undefined && item.numProperties > 0) {
                renameVectorTree(item, usedNames, stats);
            }
        }
    }

    var comp = app.project ? app.project.activeItem : null;
    var usedNames = {};
    var stats = {
        layers: 0,
        groups: 0,
        paths: 0
    };
    var i;
    var layer;
    var contents;

    if (!isCompItem(comp)) {
        alert("활성 컴포지션을 연 뒤 다시 실행해 주세요.", SCRIPT_NAME);
        return;
    }

    app.beginUndoGroup(SCRIPT_NAME);

    try {
        for (i = 1; i <= comp.numLayers; i++) {
            layer = comp.layer(i);

            if (layer && layer.matchName === "ADBE Vector Layer") {
                if (safeRename(layer, makeUniqueName("SHAPE", usedNames))) {
                    stats.layers++;
                }

                contents = layer.property("ADBE Root Vectors Group");
                renameVectorTree(contents, usedNames, stats);
            }
        }
    } catch (error) {
        alert(
            "처리 중 오류가 발생했습니다.\n\n" +
            error.toString() +
            (error.line ? "\nLine: " + error.line : ""),
            SCRIPT_NAME
        );
    } finally {
        app.endUndoGroup();
    }

    alert(
        "이름 변경 완료\n\n" +
        "Shape Layer: " + stats.layers + "\n" +
        "Group: " + stats.groups + "\n" +
        "Path: " + stats.paths + "\n\n" +
        "주의: 이름을 참조하는 Expression이 있다면 연결이 깨질 수 있습니다.",
        SCRIPT_NAME
    );
}());
