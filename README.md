[README.md](https://github.com/user-attachments/files/33374711/README.md)
# TRPL Sticker

After Effects용 스크립트 독(Dock) 패널입니다.
자주 쓰는 스크립트와 익스프레션을 아이콘 버튼으로 등록해 한 번의 클릭으로 실행할 수 있으며, 이 저장소에 올라온 스크립트를 **TRPL Online Script** 목록으로 불러와 바로 추가할 수 있습니다.

---

## 지원 환경

| 항목 | 내용 |
|---|---|
| OS | Windows 10 / 11 |
| After Effects | 2025 (25.0) 이상 |
| 형식 | CEP 확장 패널 (CEP 12) |

---

## 다운로드

**[⬇ TRPL_Sticker.zip 최신 버전 다운로드](https://github.com/ovcos-dev/trpl-sticker-library/releases/latest/download/TRPL_Sticker.zip)**

- 이전 버전과 변경 내역은 [Releases](https://github.com/ovcos-dev/trpl-sticker-library/releases) 페이지에서 확인할 수 있습니다.
- 내려받은 zip 파일의 압축을 풀면 `TRPL_Sticker` 폴더가 나옵니다.

---

## 설치 방법

### 1. 디버그 모드 활성화 (최초 1회)

TRPL Sticker는 서명되지 않은 CEP 확장이므로, After Effects가 불러올 수 있도록 설정이 필요합니다.

1. `TRPL_Sticker` 폴더 안의 **`enable_debug_mode.reg`** 파일을 더블클릭합니다.
2. 레지스트리 편집 확인 창에서 **예**를 선택합니다.

> 직접 설정하려면 `regedit` → `HKEY_CURRENT_USER\Software\Adobe\CSXS.12` 에 문자열 값 `PlayerDebugMode` = `1` 을 추가합니다.

### 2. 확장 폴더 복사

1. After Effects를 **완전히 종료**합니다.
2. `TRPL_Sticker` 폴더를 아래 경로에 그대로 복사합니다.

```
C:\Users\<사용자명>\AppData\Roaming\Adobe\CEP\extensions\
```

- `extensions` 폴더가 없으면 직접 만듭니다.
- 탐색기 주소창에 `%APPDATA%\Adobe\CEP\extensions` 를 입력하면 바로 이동할 수 있습니다.

최종 구조는 다음과 같아야 합니다.

```
...\CEP\extensions\TRPL_Sticker\
├─ CSXS\manifest.xml
├─ index.html
├─ settings.html
└─ ...
```

### 3. 패널 열기

1. After Effects를 실행합니다.
2. **창(Window) > 확장(Extensions) > TRPL Sticker_v1.0** 을 선택합니다.
3. 원하는 위치에 패널을 도킹합니다.

---

## 사용 방법

### 패널

| 기능 | 방법 |
|---|---|
| 실행 | 버튼 클릭 |
| 편집 모드 | 우측 상단 ✏️ 연필 아이콘 |
| 순서 변경 | 편집 모드에서 버튼 드래그 |
| 삭제 | 편집 모드에서 버튼의 ✕ |
| 버튼 설정 | 편집 모드에서 버튼의 ⚙ |
| 새 버튼 추가 | 편집 모드에서 `+` → Script / Expression 선택 |
| 설정 창 | 우측 상단 톱니 아이콘 |

- 모든 실행은 **Ctrl+Z 한 번**으로 되돌릴 수 있습니다.
- Expression 버튼은 선택한 속성에 익스프레션을 적용하며, 기존 익스프레션은 덮어씁니다.

### 설정 창

- **Panel Settings**: 버튼 크기, 아이콘 크기, 폰트 크기(공통값), GitHub 저장소 주소
- **버튼별 설정**: 이름, 아이콘(파일 지정 또는 Iconify 검색), 배경·테두리·아이콘 색상, 아이콘·폰트 크기 개별 지정
- **Execute Script / Add Expression**: 직접 작성하거나 `.jsx` 파일을 연결한 내 스크립트

### TRPL Online Script

이 저장소의 스크립트를 목록으로 불러와 패널에 추가합니다.

1. 설정 창 왼쪽 **TRPL Online Script** 에서 `Script` 또는 `Expression` 목록을 펼칩니다.
2. 항목 오른쪽 □ 를 클릭하면 패널에 추가됩니다. 다시 클릭하면 제거됩니다.
3. 저장소의 파일이 수정되면 **업데이트** 표시가 나타납니다. 클릭하면 최신 버전으로 교체됩니다. (이름·아이콘·색상·크기 설정은 유지됩니다.)
4. ⟳ 버튼으로 목록을 수동 새로고침할 수 있습니다.

- 추가한 스크립트는 PC에 저장되므로 **인터넷 연결 없이도 실행**됩니다.
- 목록은 After Effects 실행 시 자동 갱신되며, 요청 제한을 고려해 **10분에 한 번**만 갱신합니다.

---

## 스크립트 등록 방법 (저장소 관리자용)

이 저장소의 아래 폴더에 파일을 올리면 TRPL Online Script 목록에 자동으로 표시됩니다.

```
trpl-sticker-library/
├─ scripts/        ← .jsx / .jsxbin
└─ expressions/    ← .js / .txt (익스프레션 코드만 그대로)
```

| 항목 | 규칙 |
|---|---|
| 목록 이름 | 파일명(확장자 제외)이 그대로 표시됩니다. |
| 브랜치 | `main` 브랜치 기준입니다. |
| 익스프레션 | 파일 내용 전체가 그대로 적용됩니다. 주석(`//`)은 사용할 수 있습니다. |
| 한글 | UTF-8로 저장합니다. (`.jsx`는 내려받을 때 BOM이 자동 보정됩니다.) |

- 파일 수정 후 GitHub 서버 캐시로 인해 반영까지 수 분이 걸릴 수 있습니다.

## 새 버전 배포 방법 (저장소 관리자용)

1. 저장소 메인 화면 오른쪽의 **Releases** → **Draft a new release** 를 선택합니다.
2. 태그 입력란에 버전을 입력하고 **Create new tag** 를 선택합니다. (예: `v1.0.0`, 대상 브랜치 `main`)
3. 제목(예: `TRPL Sticker v1.0.0`)과 변경 내역을 작성합니다.
4. 첨부 영역에 **`TRPL_Sticker.zip`** 을 올립니다.
   - 파일 이름은 반드시 `TRPL_Sticker.zip` 으로 유지해야 위 다운로드 링크가 최신 버전을 가리킵니다.
5. **Set as the latest release** 를 확인하고 **Publish release** 를 선택합니다.

---

## 데이터 저장 위치

버튼 구성, 아이콘, 내려받은 스크립트는 아래 폴더에 저장됩니다.

```
%APPDATA%\TRPL_Sticker\
├─ config.json     ← 버튼 구성 및 설정
├─ icons\          ← 지정한 아이콘
└─ online\         ← TRPL Online Script에서 내려받은 파일
```

- 이 폴더를 백업하거나 다른 PC에 복사하면 같은 구성을 사용할 수 있습니다.

---

## 업데이트

1. [Releases](https://github.com/ovcos-dev/trpl-sticker-library/releases)에서 새 버전의 `TRPL_Sticker.zip`을 내려받습니다.
2. After Effects를 완전히 종료합니다.
3. `%APPDATA%\Adobe\CEP\extensions\TRPL_Sticker` 폴더를 삭제하고 새 버전 폴더를 복사합니다.
4. After Effects를 실행합니다.

- 버튼 구성은 `%APPDATA%\TRPL_Sticker\` 에 따로 저장되어 있으므로 유지됩니다.

## 제거

1. `%APPDATA%\Adobe\CEP\extensions\TRPL_Sticker` 폴더를 삭제합니다.
2. 설정까지 지우려면 `%APPDATA%\TRPL_Sticker` 폴더도 삭제합니다.

---

## 문제 해결

| 증상 | 확인 사항 |
|---|---|
| 확장 메뉴에 TRPL Sticker가 없습니다. | 디버그 모드(1단계) 설정 여부, 폴더 위치와 구조, After Effects **완전 종료 후 재실행** 여부를 확인하세요. 작업 관리자에 `AfterFX.exe`가 남아 있으면 종료합니다. |
| 업데이트 후 변경 사항이 보이지 않습니다. | `manifest.xml`이 바뀐 경우 After Effects를 완전히 종료한 뒤 다시 실행해야 반영됩니다. |
| 파일 선택 창이 열리지 않습니다. | 파일 선택 창은 PowerShell을 사용합니다. 회사 보안 정책으로 PowerShell 실행이 제한되어 있는지 확인하세요. |
| "GitHub 요청 한도에 도달했습니다" 표시 | 로그인 없이 사용하는 GitHub API는 같은 네트워크(IP) 기준 시간당 60회로 제한됩니다. 잠시 후 ⟳ 로 다시 시도하세요. 그동안 마지막 목록이 표시됩니다. |
| 아이콘 검색 시 "요청이 많아 일시적으로 제한되었습니다" 표시 | Iconify 서버의 요청 제한입니다. 잠시 후 다시 시도하세요. |
| 스크립트 알림창의 한글이 깨집니다. | 직접 연결한 `.jsx` 파일을 **UTF-8 (BOM)** 으로 저장해 보세요. |
