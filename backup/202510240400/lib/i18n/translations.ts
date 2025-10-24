export const translations = {
  ko: {
    // Header
    title: '도면 배치',
    subtitle: '평면도에 가구를 배치하고 공간을 설계하세요',

    // Language
    language: '언어',
    korean: '한국어',
    english: 'English',

    // Theme
    theme: '테마',
    light: '라이트',
    dark: '다크',

    // Canvas Mode
    canvasMode: '캔버스 모드',
    floorPlanMode: '도면 모드',
    uploadMode: '도면 업로드',
    blankMode: '빈 캔버스',

    // Furniture Panel
    addFurniture: '가구 추가',
    customFurniture: '사용자 정의 가구',
    createCustom: '직접 만들기',
    furnitureList: '가구 목록',

    // Categories
    bed: '침대',
    sofa: '소파',
    table: '테이블',
    desk: '책상',
    storage: '수납',
    appliance: '가전',

    // Tools
    tools: '도구',
    measure: '측정',
    snap: '스냅',
    grid: '격자',
    gridSize: '격자 크기',
    clearAll: '전체 삭제',
    undo: '실행 취소',
    redo: '다시 실행',

    // Selected Item
    selectedItem: '선택된 가구',
    rotate: '회전',
    duplicate: '복사',
    delete: '삭제',
    changeColor: '색상 변경',
    noSelection: '선택된 가구 없음',

    // Layouts
    layouts: '배치안',
    saveLayout: '배치안 저장',
    loadLayout: '배치안 불러오기',
    deleteLayout: '배치안 삭제',
    layoutName: '배치안 이름',
    newLayout: '새 배치안',
    save: '저장',
    load: '불러오기',
    cancel: '취소',

    // Export
    export: '이미지 저장',
    exportJPEG: 'JPEG로 저장',
    exportPNG: 'PNG로 저장',
    withLabels: '라벨 포함',
    withoutLabels: '라벨 제외',

    // Custom Furniture Dialog
    createCustomFurniture: '사용자 정의 가구 만들기',
    furnitureName: '가구 이름',
    width: '너비',
    height: '높이',
    color: '색상',
    create: '만들기',

    // Upload Dialog
    uploadFloorPlan: '도면 업로드',
    selectImage: '이미지 선택',
    scale: '크기 조절',
    upload: '업로드',

    // Blank Canvas Dialog
    createBlankCanvas: '빈 캔버스 만들기',
    canvasWidth: '캔버스 너비',
    canvasHeight: '캔버스 높이',

    // Units
    cm: 'cm',
    mm: 'mm',
    m: 'm',

    // Messages
    confirmClearAll: '모든 가구를 삭제하시겠습니까?',
    confirmDeleteLayout: '이 배치안을 삭제하시겠습니까?',
    confirmResetCalibration: '배율을 초기화하면 모든 가구가 삭제됩니다.\n\n계속하시겠습니까?',
    saved: '저장되었습니다',
    loaded: '불러왔습니다',
    deleted: '삭제되었습니다',
    imageUploadedSuccess: '도면 이미지가 업로드되었습니다',
    imageOnlyError: '이미지 파일만 업로드 가능합니다',
    inputWidthHeightError: '가로/세로 입력해주세요',
    inputDiameterError: '지름을 입력해주세요',
    unnamed: '무명',
    exampleDesk: '예: 책상',
    optional: '선택사항',

    // Keyboard Shortcuts
    shortcuts: '단축키',
    deleteKey: 'Delete: 삭제',
    rotateKey: 'R: 회전',
    undoKey: 'Ctrl+Z: 실행 취소',
    redoKey: 'Ctrl+Y: 다시 실행',
    saveKey: 'Ctrl+S: JPEG 저장',

    // Measurement Tool
    measurementMode: '측정 모드',
    clearMeasurements: '측정 지우기',
    clickTwoPoints: '두 점을 클릭하여 거리 측정',
    distance: '거리',

    // Date/Time
    created: '생성일',
    updated: '수정일',
    createdAt: '생성',
    updatedAt: '수정',

    // Common
    confirm: '확인',
    close: '닫기',
    name: '이름',
    nameKorean: '한글 이름',
    nameEnglish: '영문 이름',

    // Search
    search: '검색',
    fuzzySearchSupported: '초성 검색 가능',
    defaultName: '기본 이름',

    // Furniture Panel
    customFurnitureButton: '사용자정의가구',
    spawnPositionLeft: '생성위치:좌측',
    spawnPositionCenter: '생성위치:중앙',
    autoClose: '자동닫기',
    autoCloseEnabled: '✓ 자동닫기',

    // Home page
    uploadFloorPlanImage: '도면 이미지를 업로드하세요',
    createFloorPlan: '도면 생성',
    uploadFloorPlan: '도면 업로드',
    viewSample: '샘플 보기',
    orUseToolbarButtons: '또는 상단 툴바의 버튼을 사용하세요',

    // Drawing toolbar labels
    thicknessLabel: '두께',
    lineColorLabel: '선색',

    // Toolbar buttons
    reset: '초기화',
    sample: '샘플',
    directDraw: '도면 생성',
    uploadButton: '도면 업로드',
    calibration: '배율적용',
    calibrated: '배율 설정됨',
    notCalibrated: '배율 미설정',
    resetCalibration: '배율 초기화',
    measurement: '거리측정',
    measurementEnd: '거리측정종료',
    eraser: '지우기',
    eraserEnd: '지우기종료',
    clearAllFurniture: '가구 전체 삭제',
    saveButton: '저장',
    loadButton: '로드',

    // Drawing tools
    line: '선',
    rectangle: '사각형',
    circle: '원',
    text: '텍스트',
    pen: '펜',
    freehand: '자유곡선',
    select: '선택',
    lineDrawing: '선 그리기',
    circleEllipse: '원/타원',
    penFreehand: '펜 (자유곡선 / Ctrl+직선)',
    lineType: '선종류',
    solidLine: '실선 ━━━━━━━━━',
    dashedLine: '파선 ━ ━ ━ ━ ━',
    dottedLine: '점선 · · · · · · · · ·',
    inputCustom: '직접 입력',
    size: '크기',
    gridDisplay: '격자 표시',
    settings: '설정',
    collapse: '접기',
    resetWarnings: '경고 팝업 초기화',
    resetWarningsConfirm: '경고 팝업이 초기화되었습니다.\n다음부터 다시 표시됩니다.',

    // Properties Panel
    propertiesPanel: '정보창',
    noItemSelected: '선택된 항목이 없습니다',
    furnitureName: '가구 이름',
    dimensionsCm: '치수 (cm)',
    position: '위치',
    rotation: '회전',
    strokeColor: '선 색상',
    fillColor: '채우기 색상',
    thickness: '두께',
    length: '길이',
    borderColor: '테두리 색상',
    showDimensions: '치수 표시',
    angle: '각도',
    textInput: '텍스트 입력...',
    colorPicker: '색상 선택기',

    // Modes
    drawingMode: '그리기 모드',
    furnitureMode: '가구 배치 모드',
    selectMode: '선택 모드',

    // Dialog buttons
    cancel: '취소',
    confirm: '확인',
    dontShowAgain: '다시 보지 않기',
    backToHome: '메인 페이지로 돌아가기',

    // Tooltip/Title texts
    createFloorPlanTooltip: '도면 생성',
    uploadFloorPlanTooltip: '도면 업로드',
    sampleFloorPlanTooltip: '샘플 도면 보기',
    resetAllTooltip: '도면 + 가구 모두 삭제',
    calibrationTooltip: '배율 설정',
    resetCalibrationTooltip: '배율 초기화 (모든 가구 삭제)',
    saveTooltip: '저장',
    loadTooltip: '로드',
    clearAllFurnitureTooltip: '가구 전체 삭제',
    measurementTooltip: '거리측정',
    measurementEndTooltip: '거리측정 종료',
    eraserTooltip: '지우기',
    eraserEndTooltip: '지우기 종료',
  },
  en: {
    // Header
    title: 'Floor Plan Layout',
    subtitle: 'Design your space with drag-and-drop layout planning',

    // Language
    language: 'Language',
    korean: '한국어',
    english: 'English',

    // Theme
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',

    // Canvas Mode
    canvasMode: 'Canvas Mode',
    floorPlanMode: 'Floor Plan',
    uploadMode: 'Upload Floor Plan',
    blankMode: 'Blank Canvas',

    // Furniture Panel
    addFurniture: 'Add Furniture',
    customFurniture: 'Custom Furniture',
    createCustom: 'Create Custom',
    furnitureList: 'Furniture List',

    // Categories
    bed: 'Beds',
    sofa: 'Sofas',
    table: 'Tables',
    desk: 'Desks',
    storage: 'Storage',
    appliance: 'Appliances',

    // Tools
    tools: 'Tools',
    measure: 'Measure',
    snap: 'Snap',
    grid: 'Grid',
    gridSize: 'Grid Size',
    clearAll: 'Clear All',
    undo: 'Undo',
    redo: 'Redo',

    // Selected Item
    selectedItem: 'Selected Item',
    rotate: 'Rotate',
    duplicate: 'Duplicate',
    delete: 'Delete',
    changeColor: 'Change Color',
    noSelection: 'No item selected',

    // Layouts
    layouts: 'Layouts',
    saveLayout: 'Save Layout',
    loadLayout: 'Load Layout',
    deleteLayout: 'Delete Layout',
    layoutName: 'Layout Name',
    newLayout: 'New Layout',
    save: 'Save',
    load: 'Load',
    cancel: 'Cancel',

    // Export
    export: 'Save Image',
    exportJPEG: 'Save as JPEG',
    exportPNG: 'Save as PNG',
    withLabels: 'With Labels',
    withoutLabels: 'Without Labels',

    // Custom Furniture Dialog
    createCustomFurniture: 'Create Custom Furniture',
    furnitureName: 'Furniture Name',
    width: 'Width',
    height: 'Height',
    color: 'Color',
    create: 'Create',

    // Upload Dialog
    uploadFloorPlan: 'Upload Floor Plan',
    selectImage: 'Select Image',
    scale: 'Scale',
    upload: 'Upload',

    // Blank Canvas Dialog
    createBlankCanvas: 'Create Blank Canvas',
    canvasWidth: 'Canvas Width',
    canvasHeight: 'Canvas Height',

    // Units
    cm: 'cm',
    mm: 'mm',
    m: 'm',

    // Messages
    confirmClearAll: 'Are you sure you want to clear all furniture?',
    confirmDeleteLayout: 'Are you sure you want to delete this layout?',
    confirmResetCalibration: 'Resetting calibration will delete all furniture.\n\nContinue?',
    saved: 'Saved',
    loaded: 'Loaded',
    deleted: 'Deleted',
    imageUploadedSuccess: 'Floor plan image uploaded successfully',
    imageOnlyError: 'Only image files can be uploaded',
    inputWidthHeightError: 'Please enter width/height',
    inputDiameterError: 'Please enter diameter',
    unnamed: 'Unnamed',
    exampleDesk: 'e.g., Desk',
    optional: 'Optional',

    // Keyboard Shortcuts
    shortcuts: 'Shortcuts',
    deleteKey: 'Delete: Delete item',
    rotateKey: 'R: Rotate item',
    undoKey: 'Ctrl+Z: Undo',
    redoKey: 'Ctrl+Y: Redo',
    saveKey: 'Ctrl+S: Save as JPEG',

    // Measurement Tool
    measurementMode: 'Measurement Mode',
    clearMeasurements: 'Clear Measurements',
    clickTwoPoints: 'Click two points to measure distance',
    distance: 'Distance',

    // Date/Time
    created: 'Created',
    updated: 'Updated',
    createdAt: 'Created',
    updatedAt: 'Updated',

    // Common
    confirm: 'Confirm',
    close: 'Close',
    name: 'Name',
    nameKorean: 'Korean Name',
    nameEnglish: 'English Name',

    // Search
    search: 'Search',
    fuzzySearchSupported: 'Fuzzy search supported',
    defaultName: 'Default Name',

    // Furniture Panel
    customFurnitureButton: 'Custom Furniture',
    spawnPositionLeft: 'Spawn:Left',
    spawnPositionCenter: 'Spawn:Center',
    autoClose: 'Auto Close',
    autoCloseEnabled: '✓ Auto Close',

    // Home page
    uploadFloorPlanImage: 'Upload a floor plan image',
    createFloorPlan: 'Create Floor Plan',
    uploadFloorPlan: 'Upload Floor Plan',
    viewSample: 'View Sample',
    orUseToolbarButtons: 'Or use the toolbar buttons above',

    // Drawing toolbar labels
    thicknessLabel: 'Thickness',
    lineColorLabel: 'Line Color',

    // Toolbar buttons
    reset: 'Reset',
    sample: 'Sample',
    directDraw: 'Create Floor Plan',
    uploadButton: 'Upload Floor Plan',
    calibration: 'Calibration',
    calibrated: 'Calibrated',
    notCalibrated: 'Not Calibrated',
    resetCalibration: 'Reset Calibration',
    measurement: 'Measure Distance',
    measurementEnd: 'End Measurement',
    eraser: 'Eraser',
    eraserEnd: 'End Eraser',
    clearAllFurniture: 'Clear All Furniture',
    saveButton: 'Save',
    loadButton: 'Load',

    // Drawing tools
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle',
    text: 'Text',
    pen: 'Pen',
    freehand: 'Freehand',
    select: 'Select',
    lineDrawing: 'Draw Line',
    circleEllipse: 'Circle/Ellipse',
    penFreehand: 'Pen (Freehand / Ctrl+Straight)',
    lineType: 'Line Type',
    solidLine: 'Solid ━━━━━━━━━',
    dashedLine: 'Dashed ━ ━ ━ ━ ━',
    dottedLine: 'Dotted · · · · · · · · ·',
    inputCustom: 'Custom Input',
    size: 'Size',
    gridDisplay: 'Show Grid',
    settings: 'Settings',
    collapse: 'Collapse',
    resetWarnings: 'Reset Warning Popups',
    resetWarningsConfirm: 'Warning popups have been reset.\nThey will be shown again next time.',

    // Properties Panel
    propertiesPanel: 'Properties',
    noItemSelected: 'No item selected',
    furnitureName: 'Furniture Name',
    dimensionsCm: 'Dimensions (cm)',
    position: 'Position',
    rotation: 'Rotation',
    strokeColor: 'Stroke Color',
    fillColor: 'Fill Color',
    thickness: 'Thickness',
    length: 'Length',
    borderColor: 'Border Color',
    showDimensions: 'Show Dimensions',
    angle: 'Angle',
    textInput: 'Enter text...',
    colorPicker: 'Color Picker',

    // Modes
    drawingMode: 'Drawing Mode',
    furnitureMode: 'Furniture Mode',
    selectMode: 'Select Mode',

    // Dialog buttons
    cancel: 'Cancel',
    confirm: 'Confirm',
    dontShowAgain: 'Don\'t show again',
    backToHome: 'Back to Home',

    // Tooltip/Title texts
    createFloorPlanTooltip: 'Create Floor Plan',
    uploadFloorPlanTooltip: 'Upload Floor Plan',
    sampleFloorPlanTooltip: 'View Sample Floor Plan',
    resetAllTooltip: 'Reset All (Floor Plan + Furniture)',
    calibrationTooltip: 'Set Scale',
    resetCalibrationTooltip: 'Reset Scale (Clear All Furniture)',
    saveTooltip: 'Save',
    loadTooltip: 'Load',
    clearAllFurnitureTooltip: 'Clear All Furniture',
    measurementTooltip: 'Measurement Tool',
    measurementEndTooltip: 'End Measurement',
    eraserTooltip: 'Eraser',
    eraserEndTooltip: 'End Eraser',
  },
};

export type TranslationKey = keyof typeof translations.ko;
