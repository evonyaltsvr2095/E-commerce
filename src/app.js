document.addEventListener("alpine:init", () => {
  Alpine.data("products", () => ({
    items: [
      { id: 1, name: "Brazil", img: "1.jpg", price: 35000 },
      { id: 2, name: "Robusta", img: "2.jpg", price: 30000 },
      { id: 3, name: "Arabica", img: "3.jpg", price: 35000 },
      { id: 4, name: "Latte", img: "4.jpg", price: 25000 },
      { id: 5, name: "Mocha Latte", img: "5.jpg", price: 25000 },
    ],
  }));

  Alpine.store("cart", {
    items: [],
    total: 0,
    quantity: 0,
    add(newItem) {
      // Cek apakah barang sudah ada di keranjang
      const cartItem = this.items.find((item) => item.id === newItem.id);

      if (!cartItem) {
        // Jika belum ada, masukkan sebagai item baru
        this.items.push({ ...newItem, quantity: 1, total: newItem.price });
        this.quantity++;
        this.total += newItem.price;
      } else {
        // Jika sudah ada, update quantity dan total per item
        this.items = this.items.map((item) => {
          if (item.id === newItem.id) {
            item.quantity++;
            item.total = item.price * item.quantity;
            this.quantity++;
            this.total += item.price;
          }
          return item;
        });
      }
    },
    remove(id) {
      const cartItem = this.items.find((item) => item.id === id);

      if (cartItem.quantity > 1) {
        this.items = this.items.map((item) => {
          if (item.id === id) {
            item.quantity--;
            item.total = item.price * item.quantity;
            this.quantity--;
            this.total -= item.price;
          }
          return item;
        });
      } else {
        this.items = this.items.filter((item) => item.id !== id);
        this.quantity--;
        this.total -= cartItem.price;
      }
    },
  }); // Kurung penutup Alpine.store tadi hilang
});

// Fungsi rupiah harus berada di luar scope alpine:init
// agar bisa dipanggil secara global di HTML (x-text="rupiah(...)")
const rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};
