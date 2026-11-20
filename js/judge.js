// AI 예측 결과와 실제 시각(밀리초)을 바탕으로 상품을 장바구니에 담을지 판정하는 모듈입니다.
// 카메라나 화면(DOM) 없이도 독립적으로 동작합니다.
(function (global) {
  "use strict";

  // 브라우저에서는 전역 객체를, Node.js에서는 require로 설정과 가격표를 불러옵니다.
  function loadDependencies() {
    const config =
      global.KioskConfig ||
      (typeof require === "function" ? require("./config.js") : null);
    const catalog =
      global.ProductCatalog ||
      (typeof require === "function" ? require("./products.js") : null);

    return { config: config, catalog: catalog };
  }

  /**
   * 장바구니 담기 판정기를 생성합니다.
   * @param {Object} [customOptions] - 테스트 등에서 기본 설정·가격표를 바꿀 때 사용합니다.
   */
  function createJudge(customOptions) {
    const deps = loadDependencies();
    const options = customOptions || {};
    const config = options.config || deps.config;
    const catalog = options.catalog || deps.catalog;

    // 판정에 필요한 기준값
    const threshold = config.CONFIDENCE_THRESHOLD;
    const holdMs = config.HOLD_MS;
    const clearMs = config.CLEAR_MS;
    const emptyClassName = config.EMPTY_CLASS_NAME;

    // 판정 상태 저장 변수
    let activeClassName = null;
    let candidateStartTime = null;
    let lastAddedClassName = null;
    let clearStartTime = null;

    /**
     * 예측 결과에서 가장 확률이 높은 항목을 찾아 유효한 상품 후보인지 확인합니다.
     * @param {Array<{ className: string, probability: number }>} predictions
     */
    function pickCandidate(predictions) {
      if (!Array.isArray(predictions) || predictions.length === 0) {
        return null;
      }

      let top = predictions[0];
      for (let i = 1; i < predictions.length; i += 1) {
        if (predictions[i].probability > top.probability) {
          top = predictions[i];
        }
      }

      // 빈 상태("없음")이거나 확률 기준 미만이면 후보 없음으로 처리합니다.
      if (!top || top.className === emptyClassName || top.probability < threshold) {
        return null;
      }

      // 가격표에 등록된 상품인 경우에만 후보로 인정합니다.
      return catalog.findByClassName(top.className);
    }

    /**
     * 현재 예측 결과와 시각(밀리초)을 받아 판정 결과를 돌려줍니다.
     * @param {Array<{ className: string, probability: number }>} predictions
     * @param {number} [nowMs=Date.now()] - 현재 시각(밀리초)
     * @returns {{
     *   candidate: Object | null,
     *   progress: number,
     *   addedProduct: Object | null,
     *   status: "대기" | "인식 중" | "담김" | "치워 주세요"
     * }}
     */
    function evaluate(predictions, nowMs) {
      const currentTime = typeof nowMs === "number" ? nowMs : Date.now();
      const candidate = pickCandidate(predictions);

      // 1. 유효한 상품 후보가 없는 경우
      if (!candidate) {
        activeClassName = null;
        candidateStartTime = null;

        // 방금 상품을 담은 상태라면, 치움 시간(CLEAR_MS)이 지날 때까지 대기합니다.
        if (lastAddedClassName !== null) {
          if (clearStartTime === null) {
            clearStartTime = currentTime;
          }

          const clearElapsed = currentTime - clearStartTime;
          if (clearElapsed >= clearMs) {
            // 치움 시간이 지나면 잠금을 풀어 같은 상품도 다시 담을 수 있게 합니다.
            lastAddedClassName = null;
            clearStartTime = null;
            return {
              candidate: null,
              progress: 0,
              addedProduct: null,
              status: "대기"
            };
          }

          return {
            candidate: null,
            progress: 0,
            addedProduct: null,
            status: "치워 주세요"
          };
        }

        return {
          candidate: null,
          progress: 0,
          addedProduct: null,
          status: "대기"
        };
      }

      // 2. 방금 담은 상품과 같은 상품이 계속 보이는 경우 (규칙 3: 다시 담지 않음)
      if (lastAddedClassName !== null && candidate.className === lastAddedClassName) {
        // 치움 상태가 끊겼으므로 치움 시각을 초기화합니다.
        clearStartTime = null;
        return {
          candidate: candidate,
          progress: 0,
          addedProduct: null,
          status: "치워 주세요"
        };
      }

      // 3. 담은 뒤 치우지 않고 바로 다른 상품을 비춘 경우 (규칙 4: 새 후보로 즉시 전환)
      if (lastAddedClassName !== null && candidate.className !== lastAddedClassName) {
        lastAddedClassName = null;
        clearStartTime = null;
      }

      // 4. 후보 유지 시간 측정 (규칙 2)
      if (activeClassName !== candidate.className) {
        activeClassName = candidate.className;
        candidateStartTime = currentTime;
      }

      const elapsed = currentTime - candidateStartTime;
      const progress = Math.min(1, Math.max(0, elapsed / holdMs));

      if (elapsed >= holdMs) {
        lastAddedClassName = candidate.className;
        clearStartTime = null;
        activeClassName = null;
        candidateStartTime = null;

        return {
          candidate: candidate,
          progress: 1,
          addedProduct: candidate,
          status: "담김"
        };
      }

      return {
        candidate: candidate,
        progress: progress,
        addedProduct: null,
        status: "인식 중"
      };
    }

    /**
     * 판정기 상태를 처음 상태로 되돌립니다.
     */
    function reset() {
      activeClassName = null;
      candidateStartTime = null;
      lastAddedClassName = null;
      clearStartTime = null;
    }

    return {
      evaluate: evaluate,
      reset: reset
    };
  }

  const ProductJudge = {
    create: createJudge
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = ProductJudge;
  } else {
    global.ProductJudge = ProductJudge;
  }
})(typeof window !== "undefined" ? window : globalThis);
