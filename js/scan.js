// 계산 화면(scan.html)의 판정 규칙 연결, 직접 담기, 장바구니 수정 기능을 담당합니다.
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
  const manualAddList = document.getElementById("manual-add-list");

  const clearCartButton = document.getElementById("clear-cart-button");
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

  // 상품을 장바구니에 1개 담고 안내 문구와 줄 강조를 함께 실행합니다.
  function addProductWithFeedback(product) {
    window.KioskCart.addItem(product);
    showAddedOverlay(product.name);
    highlightCartItem(product.className);
  }

  // 가격표의 모든 상품으로 "직접 담기" 버튼 목록을 만듭니다.
  function renderManualAddButtons() {
    manualAddList.innerHTML = "";

    window.ProductCatalog.list.forEach(function (product) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "manual-add-button";

      const nameSpan = document.createElement("span");
      nameSpan.className = "manual-add-name";
      nameSpan.textContent = product.name;

      const priceSpan = document.createElement("span");
      priceSpan.className = "manual-add-price";
      priceSpan.textContent = window.ProductCatalog.formatPrice(product.price);

      button.appendChild(nameSpan);
      button.appendChild(priceSpan);

      button.addEventListener("click", function () {
        addProductWithFeedback(product);
      });

      manualAddList.appendChild(button);
    });
  }

  // 장바구니 목록, 수량 조절/삭제 버튼, 총 수량, 합계 금액, 결제하기 버튼 상태를 그립니다.
  function renderCart() {
    const items = window.KioskCart.getItems();
    const summary = window.KioskCart.getSummary();

    cartTotalQty.textContent = summary.totalQuantity + "개";
    cartTotalAmount.textContent = window.ProductCatalog.formatPrice(summary.totalPrice);
    payButton.disabled = summary.totalQuantity === 0;
    clearCartButton.hidden = items.length === 0;

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

      // 윗줄: 상품 이름과 금액(가격 × 수량)
      const topRow = document.createElement("div");
      topRow.className = "cart-item-top";

      const nameSpan = document.createElement("span");
      nameSpan.className = "cart-item-name";
      nameSpan.textContent = item.name;

      const priceSpan = document.createElement("span");
      priceSpan.className = "cart-item-price";
      priceSpan.textContent = window.ProductCatalog.formatPrice(item.price * item.quantity);

      topRow.appendChild(nameSpan);
      topRow.appendChild(priceSpan);

      // 아랫줄: 수량 조절(−, +) 버튼과 삭제 버튼
      const controlsRow = document.createElement("div");
      controlsRow.className = "cart-item-controls";

      const qtyGroup = document.createElement("div");
      qtyGroup.className = "qty-control-group";

      const minusBtn = document.createElement("button");
      minusBtn.type = "button";
      minusBtn.className = "qty-button";
      minusBtn.setAttribute("aria-label", item.name + " 수량 줄이기");
      minusBtn.textContent = "−";
      minusBtn.addEventListener("click", function () {
        window.KioskCart.changeQuantity(item.className, -1);
        renderCart();
      });

      const qtySpan = document.createElement("span");
      qtySpan.className = "cart-item-qty";
      qtySpan.textContent = item.quantity + "개";

      const plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.className = "qty-button";
      plusBtn.setAttribute("aria-label", item.name + " 수량 늘리기");
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", function () {
        window.KioskCart.changeQuantity(item.className, 1);
        renderCart();
      });

      qtyGroup.appendChild(minusBtn);
      qtyGroup.appendChild(qtySpan);
      qtyGroup.appendChild(plusBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-item-button";
      deleteBtn.textContent = "삭제";
      deleteBtn.addEventListener("click", function () {
        window.KioskCart.removeItem(item.className);
        renderCart();
      });

      controlsRow.appendChild(qtyGroup);
      controlsRow.appendChild(deleteBtn);

      li.appendChild(topRow);
      li.appendChild(controlsRow);
      cartList.appendChild(li);
    });
  }

  // 전체 비우기 버튼 클릭 시 확인 후 장바구니를 비웁니다.
  clearCartButton.addEventListener("click", function () {
    if (window.confirm("장바구니를 모두 비울까요?")) {
      window.KioskCart.clear();
      highlightedClassName = null;
      renderCart();
    }
  });

  // 결제하기 버튼 클릭 시 결제 화면으로 이동합니다.
  payButton.addEventListener("click", function () {
    if (window.KioskCart.getItems().length === 0) {
      return;
    }
    window.location.href = "pay.html";
  });

  // 예측 결과가 나올 때마다 판정 규칙에 넣고 화면을 갱신합니다.
  function handleResult(results) {
    const decision = judge.evaluate(results, Date.now());

    const percentWidth = Math.round(decision.progress * 100);
    progressFill.style.width = percentWidth + "%";

    if (decision.addedProduct) {
      addProductWithFeedback(decision.addedProduct);
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

  // 초기 화면 렌더링
  renderManualAddButtons();
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
