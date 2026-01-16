document.addEventListener("alphine:init", () => {
  Alphine.data("products", () => ({
    items: [
      { id: 1, name: "Brazil", img: "1.jpg", price: 35000 },
      { id: 2, name: "Robusta", img: "2.jpg", price: 30000 },
      { id: 3, name: "Arabica", img: "3.jpg", price: 25000 },
      { id: 4, name: "Latte", img: "4.jpg", price: 25000 },
      { id: 5, name: "Mocha Latte", img: "5.jpg", price: 25000 },
    ],
  }));
});
