document.addEventListener("alpine:init", () => {
  Alpine.data("products", () => ({
    items: [
      {
        id: 1,
        name: "Americano",
        img: "1.jpg",
        price: 35000,
        desc: "Kopi hitam klasik dengan aroma yang kuat, dibuat dari espresso pilihan.",
      },
      {
        id: 2,
        name: "Robusta",
        img: "2.jpg",
        price: 30000,
        desc: "Cita rasa kopi yang bold dan body yang tebal dengan sedikit rasa kacang.",
      },
      {
        id: 3,
        name: "Arabica",
        img: "3.jpg",
        price: 35000,
        desc: "Kopi dengan tingkat keasaman yang pas dan aroma floral yang lembut.",
      },
      {
        id: 4,
        name: "Latte",
        img: "4.jpg",
        price: 25000,
        desc: "Perpaduan sempurna antara espresso dan susu yang sangat creamy.",
      },
      {
        id: 5,
        name: "Mocha Latte",
        img: "5.jpg",
        price: 25000,
        desc: "Kombinasi manis cokelat dan lembutnya susu dalam satu cangkir kopi.",
      },
    ],

    init() {
      this.$nextTick(() => {
        feather.replace();
      });
    },

    showDetail(item) {
      this.currentItem = item;
      const modal = document.querySelector("#item-detail-modal");
      modal.style.display = "flex";
      // Panggil lagi agar ikon di dalam modal juga muncul
      this.$nextTick(() => feather.replace());
    },

    currentItem: {}, // Menyimpan data untuk modal

    changeItem(item) {
      this.currentItem = item;
      const modal = document.querySelector("#item-detail-modal");
      modal.style.display = "flex";
    },
  }));

  Alpine.store("cart", {
    items: [],
    total: 0,
    quantity: 0,

    add(newItem) {
      const cartItem = this.items.find((item) => item.id === newItem.id);
      if (!cartItem) {
        this.items.push({ ...newItem, quantity: 1, total: newItem.price });
      } else {
        this.items = this.items.map((item) => {
          if (item.id === newItem.id) {
            item.quantity++;
            item.total = item.price * item.quantity;
          }
          return item;
        });
      }
      this.quantity++;
      this.total += newItem.price;
    },

    remove(id) {
      const cartItem = this.items.find((item) => item.id === id);
      if (!cartItem) return;
      if (cartItem.quantity > 1) {
        this.items = this.items.map((item) => {
          if (item.id === id) {
            item.quantity--;
            item.total = item.price * item.quantity;
          }
          return item;
        });
      } else {
        this.items = this.items.filter((item) => item.id !== id);
      }
      this.quantity--;
      this.total -= cartItem.price;
    },

    clearCart() {
      this.items = [];
      this.total = 0;
      this.quantity = 0;
    },
  });
});

function rupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}
