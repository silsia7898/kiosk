// 계산 화면(scan.html)의 카메라 인식 상태 표시를 담당합니다.
(function () {
  "use strict";

  const videoElement = document.getElementById("camera-video");
  const statusElement = document.getElementById("scan-status");
  const errorBox = document.getElementById("error-box");
  const errorTitle = document.getElementById("error-title");
  const errorGuide = document.getElementById("error-guide");

  // 인식 상태 한 줄의 문구와 색상을 바꿉니다.
  function setStatus(text, type) {
    statusElement.textContent = text;
    statusElement.classList.remove("is-idle", "is-error");
    if (type === "idle") {
      statusElement.classList.add("is-idle");
    } else if (type === "error") {
      statusElement.classList.add("is-error");
    }
  }

  // 카메라나 모델 오류가 생겼을 때 이유와 해결 방법을 보여줍니다.
  function showError(info) {
    errorTitle.textContent = info.title;
    errorGuide.textContent = info.guide;
    errorBox.hidden = false;
  }

  // 예측 결과를 받아 확률이 가장 높은 상품 상태를 한 줄로 표시합니다.
  function handleResult(results) {
    if (!results || results.length === 0) {
      return;
    }

    // 가장 확률이 높은 클래스를 찾습니다.
    let topResult = results[0];
    results.forEach(function (item) {
      if (item.probability > topResult.probability) {
        topResult = item;
      }
    });

    // "없음"이 가장 높으면 안내 문구를 보여줍니다.
    if (topResult.className === "없음") {
      setStatus("상품을 카메라에 비춰 주세요", "idle");
      return;
    }

    // 가격표에 있는 상품이면 "상품 이름 가격 (확률%)" 형식으로 보여줍니다.
    const product = window.ProductCatalog.findByClassName(topResult.className);
    const percent = Math.round(topResult.probability * 100);

    if (product) {
      const priceText = window.ProductCatalog.formatPrice(product.price);
      setStatus(product.name + " " + priceText + " (" + percent + "%)", "active");
    } else {
      setStatus("상품을 카메라에 비춰 주세요", "idle");
    }
  }

  // 인식 테스트와 같은 js/recognizer.js 모듈을 사용해 카메라와 모델을 실행합니다.
  const recognizer = window.ProductRecognizer.create({
    videoElement: videoElement,
    modelPath: "./model",
    onStatusChange: function (text, stateType) {
      if (stateType === "error") {
        setStatus(text, "error");
      } else if (stateType === "running") {
        setStatus("상품을 카메라에 비춰 주세요", "idle");
      } else {
        setStatus(text, "idle");
      }
    },
    onResult: handleResult,
    onError: showError
  });

  recognizer.start();

  // 화면을 떠날 때 카메라를 끕니다.
  window.addEventListener("pagehide", function () {
    recognizer.stop();
  });
})();
