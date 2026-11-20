// 장바구니 상품 목록을 관리하고 sessionStorage에 저장하는 모듈입니다.
(function (global) {
  "use strict";

  const STORAGE_KEY = "mongle_mart_cart_v1";

  /**
   * sessionStorage에서 저장된 장바구니 목록을 불러옵니다.
   * @returns {Array<{ className: string, name: string, price: number, quantity: number }>}
   */
  function loadItems() {
    try {
      const raw = global.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("장바구니 불러오기 실패:", err);
      return [];
    }
  }

  /**
   * 장바구니 목록을 sessionStorage에 저장합니다.
   * @param {Array} items
   */
  function saveItems(items) {
    try {
      global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("장바구니 저장 실패:", err);
    }
  }

  /**
   * 현재 장바구니에 담긴 상품 목록을 반환합니다.
   */
  function getItems() {
    return loadItems();
  }

  /**
   * 상품을 장바구니에 1개 담습니다.
   * 이미 같은 상품(className)이 있으면 줄을 늘리지 않고 수량만 1 올립니다.
   * @param {{ className: string, name: string, price: number }} product
   */
  function addItem(product) {
    if (!product || !product.className) {
      return loadItems();
    }

    const items = loadItems();
    const existing = items.find(function (item) {
      return item.className === product.className;
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        className: product.className,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }

    saveItems(items);
    return items;
  }

  /**
   * 특정 상품의 수량을 delta(+1 또는 -1)만큼 바꿉니다.
   * 수량이 0 이하가 되면 장바구니에서 해당 줄을 삭제합니다.
   * @param {string} className
   * @param {number} delta
   */
  function changeQuantity(className, delta) {
    const items = loadItems();
    const nextItems = [];

    items.forEach(function (item) {
      if (item.className !== className) {
        nextItems.push(item);
        return;
      }

      const nextQty = item.quantity + delta;
      if (nextQty > 0) {
        nextItems.push({
          className: item.className,
          name: item.name,
          price: item.price,
          quantity: nextQty
        });
      }
    });

    saveItems(nextItems);
    return nextItems;
  }

  /**
   * 특정 상품을 장바구니에서 완전히 삭제합니다.
   * @param {string} className
   */
  function removeItem(className) {
    const items = loadItems().filter(function (item) {
      return item.className !== className;
    });
    saveItems(items);
    return items;
  }

  /**
   * 장바구니의 총 수량과 총 금액을 계산합니다.
   * @returns {{ totalQuantity: number, totalPrice: number }}
   */
  function getSummary() {
    const items = loadItems();
    let totalQuantity = 0;
    let totalPrice = 0;

    items.forEach(function (item) {
      totalQuantity += item.quantity;
      totalPrice += item.price * item.quantity;
    });

    return {
      totalQuantity: totalQuantity,
      totalPrice: totalPrice
    };
  }

  /**
   * 장바구니를 모두 비웁니다.
   */
  function clear() {
    saveItems([]);
  }

  global.KioskCart = {
    getItems: getItems,
    addItem: addItem,
    changeQuantity: changeQuantity,
    removeItem: removeItem,
    getSummary: getSummary,
    clear: clear
  };
})(window);
