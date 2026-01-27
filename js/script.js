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

  // Ambil data form
  const nama = document.querySelector("#name").value;
  const email = document.querySelector("#email").value;
  const phone = document.querySelector("#phone").value;

  // Ambil data dari Alpine Store (keranjang)
  const cartItems = Alpine.store("cart").items;
  const total = Alpine.store("cart").total;

  if (!nama || !phone) {
    alert("Mohon isi nama dan nomor telepon!");
    return;
  }

  // Susun format pesan WhatsApp
  let pesan = `Halo Admin Kopi Ngalam!%0A%0ASaya ingin memesan:%0A`;
  cartItems.forEach((item) => {
    pesan += `- ${item.name} (${item.quantity} x ${item.price})%0A`;
  });
  pesan += `%0A*Total: Rp ${total}*%0A%0A---%0A*Data Pelanggan*%0ANama: ${nama}%0ANo HP: ${phone}`;

  // Buka WhatsApp (Ganti nomor di bawah dengan nomor kamu)
  const whatsappUrl = `https://wa.me/6285961438827/?text=${pesan}`;
  window.open(whatsappUrl, "_blank");
});
