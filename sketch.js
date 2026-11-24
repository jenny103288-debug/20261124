let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let char2StopSprite; // 儲存角色二的待機精靈圖
let char2ActionSprite; // 儲存角色二的動作精靈圖
let bgImg; // 儲存背景圖片
let characterX; // 儲存角色一目前的水平中心位置
let bgX = 0; // 儲存背景的捲動偏移量
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

// 角色二精靈圖參數
const char2StopFrameCount = 8; // 角色二待機影格數
const char2StopFrameWidth = 599 / char2StopFrameCount; // 角色二待機每格寬度
const char2StopFrameHeight = 190; // 角色二待機每格高度

const char2ActionFrameCount = 9; // 角色二動作影格數
const char2ActionFrameWidth = 1219 / char2ActionFrameCount; // 角色二動作每格寬度
const char2ActionFrameHeight = 171; // 角色二動作每格高度

const proximityThreshold = 220; // 角色一靠近角色二的感應距離（像素）

function preload() { // 在畫布建立前載入圖片
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
  char2StopSprite = loadImage("2/停/停全.png"); // 載入角色二的八格待機精靈圖
  char2ActionSprite = loadImage("2/動作/動作全.png"); // 載入角色二的九格動作精靈圖
  bgImg = loadImage("圖/4.png"); // 載入 4.png 背景圖片（若在根目錄可改為 "4.png"）
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓角色座標代表影格的中心點
  characterX = width / 2; // 將角色初始位置設在畫布正中央
  bgX = 0; // 初始化背景偏移量
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

function draw() { // 每個畫面更新一次背景與角色
  // 計算背景等比例縮放後的寬高（填滿整個畫布高度）
  const bgScale = height / bgImg.height;
  const scaledBgWidth = bgImg.width * bgScale;
  const scaledBgHeight = height;

  // 限制背景偏移量的極限（三張背景串接：左、中、右）
  const maxBgOffset = scaledBgWidth;
  bgX = constrain(bgX, -maxBgOffset, maxBgOffset);

  // 繪製三張串接的背景圖（左、中、右）
  background("#87CEEB");
  imageMode(CORNER);
  image(bgImg, -scaledBgWidth + bgX, 0, scaledBgWidth, scaledBgHeight); // 最左邊背景（起點為 -scaledBgWidth + bgX）
  image(bgImg, bgX, 0, scaledBgWidth, scaledBgHeight);                   // 中間背景
  image(bgImg, scaledBgWidth + bgX, 0, scaledBgWidth, scaledBgHeight);   // 右側背景
  imageMode(CENTER); // 還原圖片模式為中心點

  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切回站立動畫
  const movementStep = constrain(width * 0.004, 2, 8); // 移動速度

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    // 當按右鍵時：背景先往左滾動，直到滾動到極限（bgX <= -maxBgOffset），才讓角色往右移動
    if (bgX > -maxBgOffset) {
      bgX -= movementStep;
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    // 當按左鍵時：背景先往右滾動，直到滾動到極限（bgX >= maxBgOffset），才讓角色往左移動
    if (bgX < maxBgOffset) {
      bgX += movementStep;
    } else {
      characterX -= movementStep;
    }
  }

  // 調整角色高度為畫布高度的 1/3，並等比例縮放寬度
  const characterScale = (height / 3) / frameHeight;

  const characterWidth = frameWidth * characterScale; // 計算角色基本顯示寬度
  const characterHeight = frameHeight * characterScale; // 計算角色基本顯示高度
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2); // 限制角色中心避免超出畫布左右邊界

  // --- 繪製角色二（位於最左邊背景圖的中間） ---
  // 最左邊背景圖的區間為 [-scaledBgWidth + bgX, bgX]，其中間水平座標為 -scaledBgWidth * 0.5 + bgX
  const char2X = -scaledBgWidth * 0.5 + bgX;
  const isNearChar2 = abs(characterX - char2X) <= proximityThreshold; // 判斷角色一是否靠近角色二

  const char2Sprite = isNearChar2 ? char2ActionSprite : char2StopSprite;
  const char2Count = isNearChar2 ? char2ActionFrameCount : char2StopFrameCount;
  const char2FrameW = isNearChar2 ? char2ActionFrameWidth : char2StopFrameWidth;
  const char2FrameH = isNearChar2 ? char2ActionFrameHeight : char2StopFrameHeight;

  // 以角色一相同的高度比例縮放角色二，保持視覺比例一致
  const char2Scale = (height / 3) / frameHeight;
  const char2DrawW = char2FrameW * char2Scale;
  const char2DrawH = char2FrameH * char2Scale;
  const char2Y = height - char2DrawH / 2; // 底部對齊畫布底部
  const char2FrameIndex = floor(frameCount / framesPerStep) % char2Count;
  const char2SourceX = char2FrameIndex * char2FrameW;

  // 若角色二精靈圖預設朝左，且在角色一左側需面向角色一（向右），可將 scale 改為 (1, 1) 或 (-1, 1) 視素材朝向調整
  const char2Facing = characterX >= char2X ? 1 : -1;

  push();
  translate(char2X, char2Y);
  scale(char2Facing, 1);
  image(char2Sprite, 0, 0, char2DrawW, char2DrawH, char2SourceX, 0, char2FrameW, char2FrameH);
  pop();

  // --- 繪製角色一 ---
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) { // 檢查施法動畫是否已完整播放一次
    isCasting = false; // 結束施法動畫並恢復一般角色動作
    activeEffects.push({ x: characterX + magicDirection * characterWidth / 2, y: height - characterHeight * 0.58, direction: magicDirection }); // 在角色前方建立特效
  } // 結束施法動畫完成判斷

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite; // 根據角色狀態選擇精靈圖
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite; // 取得目前精靈圖的影格總數
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth; // 取得目前精靈圖每格的寬度
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight; // 取得目前精靈圖每格的高度
  const elapsedMagicFrames = frameCount - magicStartFrame; // 計算施法動畫已播放的畫面數
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount; // 計算目前要顯示的精靈影格
  const sourceX = frameIndex * activeFrameWidth; // 計算目前影格在精靈圖中的水平起點
  const activeWidth = activeFrameWidth * characterScale; // 計算目前角色影格的顯示寬度
  const activeHeight = activeFrameHeight * characterScale; // 計算目前角色影格的顯示高度
  const characterY = height - activeHeight / 2; // 將目前角色影格底部對齊畫布底部

  push(); // 暫存目前的繪圖座標轉換狀態
  translate(characterX, characterY); // 將繪圖原點移至角色中心
  scale(isCasting ? magicDirection : facingDirection, 1); // 依施法或角色朝向決定是否水平翻轉
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight); // 裁切並繪製目前角色影格
  pop(); // 還原繪圖座標轉換狀態

  const effectScale = characterScale; // 使用角色縮放倍率讓特效適應不同畫布
  const effectWidth = effectFrameWidth * effectScale; // 計算特效影格的顯示寬度
  const effectHeight = effectFrameHeight * effectScale; // 計算特效影格的顯示高度
  const effectSpeed = max(6, width * 0.008); // 依畫布寬度計算特效飛行速度

  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) { // 由後往前更新所有飛行中的特效
    const effect = activeEffects[effectIndex]; // 取得目前更新的特效資料
    effect.x += effect.direction * effectSpeed; // 依特效方向更新水平位置
    if (effect.x > width || effect.x < 0) { // 判斷特效是否已抵達畫布左右邊緣
      activeEffects.splice(effectIndex, 1); // 移除已飛出畫布的特效
      continue; // 略過已移除特效的繪製
    } // 結束特效邊界判斷
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount; // 計算特效目前播放的影格
    push(); // 暫存目前的繪圖座標轉換狀態
    translate(effect.x, effect.y); // 將繪圖原點移至特效中心
    scale(effect.direction, 1); // 依飛行方向翻轉特效影格
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight); // 裁切並繪製目前特效影格
    pop(); // 還原繪圖座標轉換狀態
  } // 結束飛行中特效更新迴圈
} // 結束繪圖函式

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (keyCode === RIGHT_ARROW) { // 判斷是否按下右方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = 1; // 讓角色面向右方
    return false; // 防止方向鍵捲動網頁
  } // 結束右方向鍵判斷
  if (keyCode === LEFT_ARROW) { // 判斷是否按下左方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = -1; // 讓角色面向左方
    return false; // 防止方向鍵捲動網頁
  } // 結束左方向鍵判斷
  if (keyCode === 32) { // 判斷是否按下空白鍵
    if (!spaceIsDown && !isCasting) { // 僅在空白鍵新按下且角色未施法時觸發
      isCasting = true; // 開始播放施法動畫
      magicStartFrame = frameCount; // 記錄施法動畫的起始畫面
      magicDirection = facingDirection; // 鎖定施法當下角色面向
    } // 結束施法啟動判斷
    spaceIsDown = true; // 記錄空白鍵已按住以避免連續觸發
    return false; // 防止空白鍵捲動網頁
  } // 結束空白鍵判斷
} // 結束按鍵事件處理函式

function keyReleased() { // 鍵盤按鍵放開時更新按鍵狀態
  if (keyCode === 32) { // 判斷放開的是否為空白鍵
    spaceIsDown = false; // 允許下次按空白鍵重新施法
  } // 結束空白鍵放開判斷
} // 結束按鍵放開事件處理函式

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 將畫布同步為新的視窗尺寸
  characterX = constrain(characterX, 1, width - 1); // 將角色位置限制在縮放後畫布內
} // 結束視窗縮放處理函式