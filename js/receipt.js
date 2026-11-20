// 결제 완료 화면(receipt.html)의 영수증 표시와 새 주문 시작 처리를 담당합니다.
(function () {
  "use strict";

  const emptyCard = document.getElementById("receipt-empty-card");
  const receiptContent = document.getElementById("receipt-content");
  const orderNumberElement = document.getElementById("receipt-order-number");
  const paidAtElement = document.getElementById("receipt-paid-at");
  const methodElement = document.getElementById("receipt-method");
  const orderListElement = document.getElementById("receipt-order-list");
  const totalAmountElement = document.getElementById("receipt-total-amount");
  const newOrderButton = document.getElementById("new-order-button");

  const receipt = window.KioskReceipt.load();

  // 결제를 거치지 않고 바로 들어온 경우 안내와 시작 화면 버튼만 보여줍니다.
  if (!receipt) {
    emptyCard.hidden = false;
    receiptContent.hidden = true;
    return;
  }

  // 완료 화면에 들어오면 장바구니는 비우고, 저장해 둔 영수증은 유지해 새로 고침해도 보이게 합니다.
  window.KioskCart.clear();

  emptyCard.hidden = true;
  receiptContent.hidden = false;

  orderNumberElement.textContent = receipt.orderNumber;
  paidAtElement.textContent = receipt.paidAt;
  methodElement.textContent = receipt.method;
  totalAmountElement.textContent = window.ProductCatalog.formatPrice(receipt.totalPrice);

  receipt.items.forEach(function (item) {
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
    orderListElement.appendChild(li);
  });

  // 새 주문 시작 버튼을 누르면 영수증을 지우고 시작 화면으로 돌아갑니다.
  newOrderButton.addEventListener("click", function () {
    window.KioskReceipt.clear();
    window.location.href = "index.html";
  });
})();
