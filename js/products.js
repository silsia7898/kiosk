// 계산대에서 사용할 상품 가격표와 가격 관련 도우미 함수를 모아 둔 파일입니다.
(function (global) {
  "use strict";

  // 모델의 클래스 이름과 짝이 맞는 상품 목록입니다. ("없음" 클래스는 상품이 아니므로 제외)
  const PRODUCTS = [
    {
      className: "오예스",
      name: "오예스",
      price: 1500,
      color: "#7c3aed"
    },
    {
      className: "카스타드",
      name: "카스타드",
      price: 1700,
      color: "#f59e0b"
    },
    {
      className: "크리스피롤",
      name: "크리스피롤",
      price: 1200,
      color: "#10b981"
    },
    {
      className: "쿠크다스",
      name: "쿠크다스",
      price: 1300,
      color: "#ef4444"
    }
  ];

  /**
   * 모델이 인식한 클래스 이름으로 상품 정보를 찾습니다.
   * 해당하는 상품이 없으면 null을 돌려줍니다.
   * @param {string} className - 모델의 클래스 이름
   * @returns {{ className: string, name: string, price: number, color: string } | null}
   */
  function findProductByClassName(className) {
    if (!className) {
      return null;
    }

    const found = PRODUCTS.find(function (product) {
      return product.className === className;
    });

    return found || null;
  }

  /**
   * 숫자 금액을 "1,500원" 같은 한국어 원화 표기로 바꿉니다.
   * @param {number} amount - 원 단위 금액
   * @returns {string}
   */
  function formatPrice(amount) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      return "0원";
    }
    return Math.round(numericAmount).toLocaleString("ko-KR") + "원";
  }

  // 다른 스크립트에서 사용할 수 있도록 전역 객체에 등록합니다.
  global.ProductCatalog = {
    list: PRODUCTS,
    findByClassName: findProductByClassName,
    formatPrice: formatPrice
  };
})(window);
