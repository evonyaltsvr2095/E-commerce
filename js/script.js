// Kirim pesan ke WhatsApp (Bagian Kontak Kami)
function kirimKeWa() {
  const nama = document.getElementById("nama").value;
  const email = document.getElementById("email").value;
  const wa_user = document.getElementById("wa").value;
  const nomorTujuan = "6285961438827";

  // Validasi agar nama dan nomor tidak kosong
  if (nama === "" || wa_user === "") {
    alert("Please fill in your name and WA number.");
    return;
  }

  // Menyusun pesan dengan tambahan kalimat tetap
  const pesan = `Halo KopiNgalam, saya *${nama}*.%0AEmail: ${email}%0ANomor WA: ${wa_user}.%0A%0Asaya ingin bertanya tentang produk anda.`;

  const url = `https://wa.me/${nomorTujuan}?text=${pesan}`;

  window.open(url, "_blank");
}

// Toggle class active untuk hamburger menu
const navbarNav = document.querySelector(".navbar-nav");
// ketika hamburger menu di klik
document.querySelector("#hamburger-menu").onclick = () => {
  navbarNav.classList.toggle("active");
};

// Toggle class active untuk search form
const searchForm = document.querySelector(".search-form");
const searchBox = document.querySelector("#search-box");

document.querySelector("#search-button").onclick = (e) => {
  searchForm.classList.toggle("active");
  searchBox.focus();
  e.preventDefault();
};

// Toggle class active untuk shopping cart
const shoppingCart = document.querySelector(".shopping-cart");
document.querySelector("#shopping-cart-button").onclick = (e) => {
  shoppingCart.classList.toggle("active");
  e.preventDefault();
};

// Klik di luar elemen
const hm = document.querySelector("#hamburger-menu");
const sb = document.querySelector("#search-button");
const sc = document.querySelector("#shopping-cart-button");

document.addEventListener("click", function (e) {
  if (!hm.contains(e.target) && !navbarNav.contains(e.target)) {
    navbarNav.classList.remove("active");
  }

  if (!sb.contains(e.target) && !searchForm.contains(e.target)) {
    searchForm.classList.remove("active");
  }

  if (!sc.contains(e.target) && !shoppingCart.contains(e.target)) {
    shoppingCart.classList.remove("active");
  }
});

// Modal Box
const itemDetailModal = document.querySelector("#item-detail-modal");
const itemDetailButtons = document.querySelectorAll(".item-detail-button");

itemDetailButtons.forEach((btn) => {
  btn.onclick = (e) => {
    itemDetailModal.style.display = "flex";
    e.preventDefault();
  };
});

// klik tombol close modal
document.querySelector(".modal .close-icon").onclick = (e) => {
  itemDetailModal.style.display = "none";
  e.preventDefault();
};

// klik di luar modal
window.onclick = (e) => {
  if (e.target === itemDetailModal) {
    itemDetailModal.style.display = "none";
  }
};

const checkoutButton = document.querySelector("#checkout");

checkoutButton.addEventListener("click", function (e) {
  e.preventDefault();

  document.querySelector(".shopping-cart").classList.remove("active");

  // 1. Ambil data form
  const nama = document.querySelector("#name").value;
  const email = document.querySelector("#email").value;
  const phone = document.querySelector("#phone").value;

  // 2. Ambil data keranjang
  const cartItems = Alpine.store("cart").items;
  const total = Alpine.store("cart").total;

  // 3. Validasi Form
  if (!nama || !phone) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Mohon isi nama dan nomor telepon!",
    });
    return;
  }

  // 4. Munculkan Pop-up QR Code
  Swal.fire({
    title: "Selesaikan Pembayaran",
    text: `Total yang harus dibayar: ${rupiah(total)}`,
    imageUrl: "img/qr/qr-code.jpeg", // <--- Pastikan file gambar QR Anda ada di sini
    imageWidth: 300,
    imageHeight: 370,
    imageAlt: "QR Code Pembayaran",
    showCancelButton: true,
    confirmButtonText: "Saya Sudah Bayar",
    cancelButtonText: "Batal",
    confirmButtonColor: "#b6895b", // Warna tema kopi
  }).then((result) => {
    // 5. Jika user klik "Sudah Bayar", arahkan ke WhatsApp
    if (result.isConfirmed) {
      const daftarPesanan = cartItems
        .map((item) => `${item.name} (${item.quantity}x)`)
        .join(", ");

      const dataKeSpreadsheet = {
        nama: nama,
        email: email,
        phone: phone,
        pesanan: daftarPesanan,
        total: total,
      };

      const scriptURL =
        "https://script.google.com/macros/s/AKfycbwShqYDm_lmilYXIEpHy04nBvywpzrXWPc1SlruF6AsOvNHqyt1VoVOMxVtbFRDsaCU/exec";

      fetch(scriptURL, {
        method: "POST",
        body: JSON.stringify(dataKeSpreadsheet),
      })
        .then((response) => console.log("Berhasil rekam ke Sheets!"))
        .catch((error) => console.error("Gagal rekam:", error));

      let pesan = `Halo Admin Kopi Ngalam!%0A%0ASaya *Sudah Membayar* pesanan berikut:%0A`;
      cartItems.forEach((item) => {
        pesan += `- ${item.name} (${item.quantity} x ${rupiah(item.price)})%0A`;
      });
      pesan += `%0A*Total: ${rupiah(total)}*%0A%0A---%0A*Data Pelanggan*%0ANama: ${nama}%0ANo HP: ${phone}`;

      const whatsappUrl = `https://wa.me/6285961438827?text=${pesan}`;
      window.open(whatsappUrl, "_blank");

      // Aktifkan ini agar keranjang kosong otomatis setelah checkout
      Alpine.store("cart").items = [];
      Alpine.store("cart").quantity = 0;
      Alpine.store("cart").total = 0;

      // Menutup shopping cart agar tidak menghalangi layar
      document.querySelector(".shopping-cart").classList.remove("active");
    }
  });
});
