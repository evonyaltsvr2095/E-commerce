// ==========================================
// 1. TAMBAHKAN FUNGSI RUPIAH DI SINI
// ==========================================
const rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// ==========================================
// KODE BAWAAN ANDA
// ==========================================

// Kirim pesan ke WhatsApp (Bagian Kontak Kami)
function kirimKeWa() {
  const nama = document.getElementById("nama").value;
  const email = document.getElementById("email").value;
  const wa_user = document.getElementById("wa").value;
  const nomorTujuan = "6285961438827";

  if (nama === "" || wa_user === "") {
    alert("Please fill in your name and WA number.");
    return;
  }

  const pesan = `Halo KopiNgalam, saya *${nama}*.%0AEmail: ${email}%0ANomor WA: ${wa_user}.%0A%0Asaya ingin bertanya tentang produk anda.`;
  const url = `https://wa.me/${nomorTujuan}?text=${pesan}`;
  window.open(url, "_blank");
}

// Toggle class active untuk hamburger menu
const navbarNav = document.querySelector(".navbar-nav");
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

// Toggle Modal History
const historyModal = document.querySelector('#history-modal');
document.querySelector('#history-button').onclick = (e) => {
  historyModal.style.display = 'flex';
  e.preventDefault();
};

// Modal Box Item Detail
const itemDetailModal = document.querySelector("#item-detail-modal");
const itemDetailButtons = document.querySelectorAll(".item-detail-button");

itemDetailButtons.forEach((btn) => {
  btn.onclick = (e) => {
    itemDetailModal.style.display = "flex";
    e.preventDefault();
  };
});

document.querySelector(".modal .close-icon").onclick = (e) => {
  itemDetailModal.style.display = "none";
  e.preventDefault();
};

window.onclick = (e) => {
  if (e.target === itemDetailModal) {
    itemDetailModal.style.display = "none";
  }
};

// ==========================================
// 2. PERBAIKAN PADA BAGIAN CHECKOUT
// ==========================================
const checkoutButton = document.querySelector("#checkout");

// Gunakan if(checkoutButton) agar tidak error jika tombol tidak ada di halaman
if (checkoutButton) {
  checkoutButton.addEventListener("click", function (e) {
    e.preventDefault();

    document.querySelector(".shopping-cart").classList.remove("active");

    const nama = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    const phone = document.querySelector("#phone").value;

    const cartItems = Alpine.store("cart").items;
    const total = Alpine.store("cart").total;

    if (!nama || !phone) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Mohon isi nama dan nomor telepon!",
      });
      return;
    }

    Swal.fire({
      title: "Selesaikan Pembayaran",
      text: `Total yang harus dibayar: ${rupiah(total)}`,
      imageUrl: "img/qr/qr-code.jpeg", 
      imageWidth: 300,
      imageHeight: 370,
      imageAlt: "QR Code Pembayaran",
      showCancelButton: true,
      confirmButtonText: "Saya Sudah Bayar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#b6895b",
    }).then((result) => {
      
      if (result.isConfirmed) {
        // --- PROSES GOOGLE SHEETS ---
        const daftarPesanan = cartItems
          .map((item) => `${item.name} (${item.quantity}x)`)
          .join(", ");

        // Perbaikan format URLSearchParams untuk menghindari error CORS di Google Sheets
        const dataKeSpreadsheet = new URLSearchParams();
        dataKeSpreadsheet.append('nama', nama);
        dataKeSpreadsheet.append('email', email);
        dataKeSpreadsheet.append('phone', phone);
        dataKeSpreadsheet.append('pesanan', daftarPesanan);
        dataKeSpreadsheet.append('total', total);

        const scriptURL = "https://script.google.com/macros/s/AKfycbwShqYDm_lmilYXIEpHy04nBvywpzrXWPc1SlruF6AsOvNHqyt1VoVOMxVtbFRDsaCU/exec";

        fetch(scriptURL, {
          method: "POST",
          body: dataKeSpreadsheet,
        })
          .then((response) => console.log("Berhasil rekam ke Sheets!"))
          .catch((error) => console.error("Gagal rekam:", error));

        // --- PROSES HISTORY (Dipindah ke sini, tempat yang benar) ---
        const newHistoryEntry = {
          date: new Date().toLocaleString('id-ID'),
          items: daftarPesanan,
          total: total
        };

        const currentHistory = JSON.parse(localStorage.getItem("kopi-history")) || [];
        currentHistory.unshift(newHistoryEntry);
        localStorage.setItem("kopi-history", JSON.stringify(currentHistory));

        // --- PROSES WHATSAPP ---
        let pesan = `Halo Admin Kopi Ngalam!%0A%0ASaya *Sudah Membayar* pesanan berikut:%0A`;
        cartItems.forEach((item) => {
          pesan += `- ${item.name} (${item.quantity} x ${rupiah(item.price)})%0A`;
        });
        pesan += `%0A*Total: ${rupiah(total)}*%0A%0A---%0A*Data Pelanggan*%0ANama: ${nama}%0ANo HP: ${phone}`;

        const whatsappUrl = `https://wa.me/6285961438827?text=${pesan}`;
        window.open(whatsappUrl, "_blank");

        // Kosongkan keranjang
        Alpine.store("cart").items = [];
        Alpine.store("cart").quantity = 0;
        Alpine.store("cart").total = 0;

        document.querySelector(".shopping-cart").classList.remove("active");
      }
    });
  });
}
