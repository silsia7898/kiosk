// 계산 화면(scan.html)의 판정 규칙 연결, 카메라 오버레이, 장바구니 화면 갱신을 담당합니다.
(function () {
  "use strict";

  const videoElement = document.getElementById("camera-video");
  const addedOverlay = document.getElementById("added-overlay");
  const addedOverlayText = document.getElementById("added-overlay-text");
  const progressFill = document.getElementById("hold-progress-fill");
  const statusElement = document.getElementById("scan-status");
  const errorBox = document.getElementById("error-box");
  const errorTitle = document.getElementById("error-title");
  const errorGuide = document.getElementById("error-guide");

  const cartEmpty = document.getElementById("cart-empty");
  const cartList = document.getElementById("cart-list");
  const cartTotalQty = document.getElementById("cart-total-qty");
  const cartTotalAmount = document.getElementById("cart-total-amount");
  const payButton = document.getElementById("pay-button");

  const judge = window.ProductJudge.create();
  let overlayTimerId = null;
  let highlightTimerId = null;
  let highlightedClassName = null;

  // 인식 상태 한 줄의 문구와 색상을 바꿉니다.
  function setStatus(text, type) {
    statusElement.textContent = text;
    statusElement.classList.remove("is-idle", "is-error", "is-warn");
    if (type === "idle") {
      statusElement.classList.add("is-idle");
    } else if (type === "error") {
      statusElement.classList.add("is-error");
    } else if (type === "warn") {
      statusElement.classList.add("is-warn");
    }
  }

  // 카메라나 모델 오류가 생겼을 때 이유와 해결 방법을 보여줍니다.
  function showError(info) {
    errorTitle.textContent = info.title;
    errorGuide.textContent = info.guide;
    errorBox.hidden = false;
  }

  // 카메라 영역에 "상품명 담았어요" 문구를 1.5초 동안 크게 보여줍니다.
  function showAddedOverlay(productName) {
    if (overlayTimerId !== null) {
      clearTimeout(overlayTimerId);
    }

    addedOverlayText.textContent = productName + " 담았어요";
    addedOverlay.hidden = false;

    overlayTimerId = setTimeout(function () {
      addedOverlay.hidden = true;
      overlayTimerId = null;
    }, 1500);
  }

  // 장바구니 목록, 총 수량, 합계 금액, 결제하기 버튼 상태를 화면에 그립니다.
  function renderCart() {
    const items = window.KioskCart.getItems();
    const summary = window.KioskCart.getSummary();

    cartTotalQty.textContent = summary.totalQuantity + "개";
    cartTotalAmount.textContent = window.ProductCatalog.formatPrice(summary.totalPrice);
    payButton.disabled = summary.totalQuantity === 0;

    if (items.length === 0) {
      cartEmpty.hidden = false;
      cartList.hidden = true;
      cartList.innerHTML = "";
      return;
    }

    cartEmpty.hidden = true;
    cartList.hidden = false;
    cartList.innerHTML = "";

    items.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "cart-item";
      if (item.className === highlightedClassName) {
        li.classList.add("is-just-added");
      }

      const nameSpan = document.createElement("span");
      nameSpan.className = "cart-item-name";
      nameSpan.textContent = item.name;

      const qtySpan = document.createElement("span");
      qtySpan.className = "cart-item-qty";
      qtySpan.textContent = item.quantity + "개";

      const priceSpan = document.createElement("span");
      priceSpan.className = "cart-item-price";
      priceSpan.textContent = window.ProductCatalog.formatPrice(item.price * item.quantity);

      li.appendChild(nameSpan);
      li.appendChild(qtySpan);
      li.appendChild(priceSpan);
      cartList.appendChild(li);
    });
  }

  // 방금 담긴 상품 줄을 잠깐 강조합니다.
  function highlightCartItem(className) {
    highlightedClassName = className;
    if (highlightTimerId !== null) {
      clearTimeout(highlightTimerId);
    }
    renderCart();

    highlightTimerId = setTimeout(function () {
      highlightedClassName = null;
      highlightTimerId = null;
      renderCart();
    }, 1500);
  }

  // 예측 결과가 나올 때마다 판정 규칙에 넣고 화면을 갱신합니다.
  function handleResult(results) {
    const decision = judge.evaluate(results, Date.now());

    // 후보 진행 막대 갱신 (후보가 사라지면 바로 0%로 비웁니다)
    const percentWidth = Math.round(decision.progress * 100);
    progressFill.style.width = percentWidth + "%";

    // "담기" 판정이 나면 장바구니에 추가하고 안내를 띄웁니다.
    if (decision.addedProduct) {
      window.KioskCart.addItem(decision.addedProduct);
      showAddedOverlay(decision.addedProduct.name);
      highlightCartItem(decision.addedProduct.className);
      setStatus(decision.addedProduct.name + " 담았어요", "active");
      return;
    }

    if (decision.status === "치워 주세요") {
      setStatus("상품을 치워 주세요", "warn");
      return;
    }

    if (decision.status === "인식 중" && decision.candidate) {
      const priceText = window.ProductCatalog.formatPrice(decision.candidate.price);
      setStatus(decision.candidate.name + " " + priceText + " (" + percentWidth + "%)", "active");
      return;
    }

    setStatus("상품을 카메라에 비춰 주세요", "idle");
  }

  // 페이지에 들어올 때 sessionStorage에 저장된 장바구니를 바로 표시합니다.
  renderCart();

  // 인식기와 카메라를 시작합니다.
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
