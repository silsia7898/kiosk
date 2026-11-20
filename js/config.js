// 계산대 판정과 동작에 쓰는 기준값을 한곳에 모아 둔 설정 파일입니다.
(function (global) {
  "use strict";

  const KIOSK_CONFIG = {
    // 이 확률 이상일 때만 상품 후보로 인정합니다. (0 ~ 1)
    CONFIDENCE_THRESHOLD: 0.9,

    // 같은 상품 후보가 이 시간(밀리초) 이상 유지되면 장바구니에 담습니다.
    HOLD_MS: 1000,

    // 담은 뒤 상품을 치운 상태가 이 시간(밀리초) 이상 이어져야 같은 상품을 다시 담을 수 있습니다.
    CLEAR_MS: 500,

    // 카메라 앞에 상품이 없는 상태를 뜻하는 모델 클래스 이름입니다.
    EMPTY_CLASS_NAME: "없음"
  };

  // 브라우저와 Node.js 환경 모두에서 불러올 수 있도록 내보냅니다.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = KIOSK_CONFIG;
  } else {
    global.KioskConfig = KIOSK_CONFIG;
  }
})(typeof window !== "undefined" ? window : globalThis);
