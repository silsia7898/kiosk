// 영수증 저장·불러오기와 주문 번호·결제 시각 생성을 담당하는 공통 모듈입니다.
(function (global) {
  "use strict";

  const RECEIPT_KEY = "mongle_mart_receipt_v1";
  const ORDER_SEQ_KEY = "mongle_mart_order_seq_v1";

  // 숫자를 2자리 문자열로 맞춥니다. (예: 5 -> "05")
  function pad2(num) {
    return String(num).padStart(2, "0");
  }

  // 숫자를 3자리 문자열로 맞춥니다. (예: 1 -> "001")
  function pad3(num) {
    return String(num).padStart(3, "0");
  }

  /**
   * 날짜 객체를 "2026.11.19 14:05" 형식의 문자열로 바꿉니다.
   * @param {Date} date
   * @returns {string}
   */
  function formatDateTime(date) {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    return year + "." + month + "." + day + " " + hours + ":" + minutes;
  }

  /**
   * 오늘 날짜와 순서를 이용해 주문 번호(예: 1120-001)를 만듭니다.
   * 같은 날짜에서는 결제할 때마다 1씩 늘어나고, 날짜가 바뀌면 001부터 다시 시작합니다.
   * @param {Date} now
   * @returns {string}
   */
  function createNextOrderNumber(now) {
    const year = now.getFullYear();
    const month = pad2(now.getMonth() + 1);
    const day = pad2(now.getDate());
    const dateKey = String(year) + month + day;
    const shortDate = month + day;

    let nextSeq = 1;
    try {
      const raw = global.localStorage.getItem(ORDER_SEQ_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.dateKey === dateKey && typeof saved.seq === "number") {
          nextSeq = saved.seq + 1;
        }
      }
      global.localStorage.setItem(
        ORDER_SEQ_KEY,
        JSON.stringify({ dateKey: dateKey, seq: nextSeq })
      );
    } catch (err) {
      console.warn("주문 번호 순서 저장 실패:", err);
    }

    return shortDate + "-" + pad3(nextSeq);
  }

  /**
   * 결제하기를 누른 시점의 영수증을 sessionStorage에 저장합니다.
   */
  function saveReceipt(receipt) {
    try {
      global.sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
    } catch (err) {
      console.warn("영수증 저장 실패:", err);
    }
  }

  /**
   * 저장된 영수증을 불러옵니다. 없으면 null을 돌려줍니다.
   */
  function loadReceipt() {
    try {
      const raw = global.sessionStorage.getItem(RECEIPT_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.warn("영수증 불러오기 실패:", err);
      return null;
    }
  }

  /**
   * 저장된 영수증을 지웁니다.
   */
  function clearReceipt() {
    try {
      global.sessionStorage.removeItem(RECEIPT_KEY);
    } catch (err) {
      console.warn("영수증 삭제 실패:", err);
    }
  }

  global.KioskReceipt = {
    formatDateTime: formatDateTime,
    createNextOrderNumber: createNextOrderNumber,
    save: saveReceipt,
    load: loadReceipt,
    clear: clearReceipt
  };
})(window);
