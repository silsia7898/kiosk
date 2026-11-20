// 결제 화면(pay.html)의 주문 내역 표시, 결제 수단 선택, 모의 결제 처리를 담당합니다.
(function () {
  "use strict";

  const emptyCard = document.getElementById("pay-empty-card");
  const payContent = document.getElementById("pay-content");
  const orderList = document.getElementById("pay-order-list");
  const totalQtyElement = document.getElementById("pay-total-qty");
  const totalAmountElement = document.getElementById("pay-total-amount");
  const methodButtons = document.querySelectorAll(".method-button");
  const confirmPayButton = document.getElementById("confirm-pay-button");
  const moreItemsLink = document.getElementById("more-items-link");

  let selectedMethod = null;
  let isProcessing = false;

  const items = window.KioskCart.getItems();
  const summary = window.KioskCart.getSummary();

  // 장바구니가 비어 있으면 안내 문구와 계산 화면 이동 버튼만 보여줍니다.
  if (items.length === 0) {
    emptyCard.hidden = false;
    payContent.hidden = true;
    return;
  }

  emptyCard.hidden = true;
  payContent.hidden = false;

  // 주문 내역을 한 줄씩 표시합니다.
  items.forEach(function (item) {
    const li = document.createElement("li");
    li.className = "order-row";

    const nameSpan = document.createElement("span");
    nameSpan.className = "order-row-name";
    nameSpan.textContent = item.name;

    const qtySpan = document.createElement("span");
    qtySpan.className = "order-row-qty";
    qtySpan.textContent = item.quantity + "개";

    const priceSpan = document.createElement("span");
    priceSpan.className = "order-row-price";
    priceSpan.textContent = window.ProductCatalog.formatPrice(item.price * item.quantity);

    li.appendChild(nameSpan);
    li.appendChild(qtySpan);
    li.appendChild(priceSpan);
    orderList.appendChild(li);
  });

  totalQtyElement.textContent = summary.totalQuantity + "개";
  totalAmountElement.textContent = window.ProductCatalog.formatPrice(summary.totalPrice);

  // 결제 수단 버튼 클릭 처리
  methodButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (isProcessing) {
        return;
      }

      selectedMethod = button.getAttribute("data-method");

      methodButtons.forEach(function (btn) {
        const isSelected = btn === button;
        btn.classList.toggle("is-selected", isSelected);
        btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
      });

      confirmPayButton.disabled = false;
    });
  });

  // 결제하기 버튼 클릭 시 영수증을 저장하고 2초 뒤 완료 화면으로 이동합니다.
  confirmPayButton.addEventListener("click", function () {
    if (!selectedMethod || isProcessing) {
      return;
    }

    isProcessing = true;
    confirmPayButton.disabled = true;
    confirmPayButton.textContent = "결제 중...";
    moreItemsLink.classList.add("is-disabled");
    moreItemsLink.setAttribute("aria-disabled", "true");

    methodButtons.forEach(function (btn) {
      btn.disabled = true;
    });

    const now = new Date();
    const receipt = {
      orderNumber: window.KioskReceipt.createNextOrderNumber(now),
      paidAt: window.KioskReceipt.formatDateTime(now),
      method: selectedMethod,
      items: items,
      totalQuantity: summary.totalQuantity,
      totalPrice: summary.totalPrice
    };

    window.KioskReceipt.save(receipt);

    setTimeout(function () {
      window.location.href = "receipt.html";
    }, 2000);
  });
})();
