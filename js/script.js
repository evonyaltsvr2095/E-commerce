// ======================================================
// KOPI NGALAM - SCRIPT.JS FINAL
// ======================================================

// ======================================================
// KONFIGURASI
// ======================================================

const WHATSAPP_ADMIN = "6285961438827";

// Catatan: GOOGLE_SCRIPT_URL sudah TIDAK dipakai lagi.
// Pesanan sekarang disimpan langsung ke Supabase (lihat kirimKeSupabase()).
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwWoEOWybdNb3gCnSSTuyF99ZWrdg0P30sbnIcFVZvbIPh-OQO0cGS4_M5C1BaMWYVk/exec";

// ======================================================
// FUNGSI KIRIM PESAN KONTAK KE WHATSAPP
// ======================================================

function kirimKeWa() {
  const nama = document.querySelector("#nama")?.value.trim() || "";
  const email = document.querySelector("#email")?.value.trim() || "";
  const waUser = document.querySelector("#wa")?.value.trim() || "";

  if (!nama || !waUser) {
    alert("Silakan isi nama dan nomor WhatsApp.");
    return;
  }

  const pesan = [
    "Halo Kopi Ngalam, saya *" + nama + "*.",
    "Email: " + email,
    "Nomor WA: " + waUser + ".",
    "",
    "Saya ingin bertanya tentang produk Anda.",
  ].join("\n");

  const whatsappUrl =
    "https://wa.me/" + WHATSAPP_ADMIN + "?text=" + encodeURIComponent(pesan);

  // Gunakan HTTPS, bukan whatsapp://
  window.location.href = whatsappUrl;
}

// ======================================================
// NAVBAR
// ======================================================

const navbarNav = document.querySelector(".navbar-nav");
const hamburgerMenu = document.querySelector("#hamburger-menu");

if (hamburgerMenu && navbarNav) {
  hamburgerMenu.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    navbarNav.classList.toggle("active");
  });
}

// ======================================================
// SEARCH FORM
// ======================================================

const searchForm = document.querySelector(".search-form");
const searchBox = document.querySelector("#search-box");
const searchButton = document.querySelector("#search-button");

if (searchButton && searchForm && searchBox) {
  searchButton.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    searchForm.classList.toggle("active");

    if (searchForm.classList.contains("active")) {
      searchBox.focus();
    }
  });
}

// ======================================================
// SHOPPING CART
// ======================================================

const shoppingCart = document.querySelector(".shopping-cart");
const shoppingCartButton = document.querySelector("#shopping-cart-button");

if (shoppingCartButton && shoppingCart) {
  shoppingCartButton.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    shoppingCart.classList.toggle("active");
  });
}

// ======================================================
// KLIK DI LUAR NAVBAR / SEARCH / CART
// ======================================================

document.addEventListener("click", function (e) {
  const target = e.target;

  // Navbar
  if (
    navbarNav &&
    hamburgerMenu &&
    !hamburgerMenu.contains(target) &&
    !navbarNav.contains(target)
  ) {
    navbarNav.classList.remove("active");
  }

  // Search
  if (
    searchForm &&
    searchButton &&
    !searchButton.contains(target) &&
    !searchForm.contains(target)
  ) {
    searchForm.classList.remove("active");
  }

  // Shopping cart
  if (
    shoppingCart &&
    shoppingCartButton &&
    !shoppingCartButton.contains(target) &&
    !shoppingCart.contains(target)
  ) {
    shoppingCart.classList.remove("active");
  }
});

// ======================================================
// HISTORY MODAL
// ======================================================

const historyModal = document.querySelector("#history-modal");
const historyButton = document.querySelector("#history-button");

if (historyButton && historyModal) {
  historyButton.addEventListener("click", function (e) {
    e.preventDefault();

    historyModal.style.display = "flex";
  });
}

// ======================================================
// RIWAYAT PESANAN - GOOGLE SHEETS
// ======================================================

window.orderHistory = function () {
  return {
    // Nomor HP yang dimasukkan pelanggan
    phone: "",

    // Daftar pesanan
    historyItems: [],

    // Status loading
    loading: false,

    // Apakah pencarian sudah dilakukan
    searched: false,

    // Pesan error
    errorMessage: "",

    // ==================================================
    // CARI PESANAN
    // ==================================================

    async cariPesanan() {
      this.errorMessage = "";
      this.historyItems = [];
      this.searched = false;

      // -----------------------------------------------
      // AMBIL NOMOR
      // -----------------------------------------------

      const nomor = String(this.phone || "").trim();

      // -----------------------------------------------
      // VALIDASI
      // -----------------------------------------------

      if (!nomor) {
        this.errorMessage = "Silakan masukkan nomor WhatsApp Anda.";

        return;
      }

      // Minimal 8 digit
      const nomorBersih = nomor.replace(/\D/g, "");

      if (nomorBersih.length < 8) {
        this.errorMessage = "Nomor WhatsApp tidak valid.";

        return;
      }

      // -----------------------------------------------
      // LOADING
      // -----------------------------------------------

      this.loading = true;

      try {
        // =============================================
        // BACA RIWAYAT DARI PENYIMPANAN LOKAL BROWSER
        // =============================================
        //
        // Riwayat pesanan disimpan di perangkat/browser
        // customer sendiri saat checkout berhasil (lihat
        // simpanHistory()). Ini menghindari kebocoran data
        // pesanan orang lain, karena tidak ada server yang
        // bisa diakses hanya bermodal menebak nomor HP.

        const semuaHistory =
          JSON.parse(localStorage.getItem("kopi-history")) || [];

        const hasil = semuaHistory.filter(function (item) {
          const phoneBersih = String(item.phone || "").replace(/\D/g, "");
          return phoneBersih === nomorBersih;
        });

        this.historyItems = hasil;
        this.searched = true;

        if (hasil.length === 0) {
          this.errorMessage =
            "Tidak ditemukan pesanan dengan nomor WhatsApp tersebut di perangkat ini.";
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);

        this.errorMessage =
          "Riwayat pesanan tidak dapat diambil. Silakan coba lagi.";
      } finally {
        this.loading = false;
      }
    },
  };
};

// ======================================================
// TUTUP MODAL HISTORY
// ======================================================

const closeHistory = document.querySelector("#close-history");

if (closeHistory && historyModal) {
  closeHistory.addEventListener("click", function (e) {
    e.preventDefault();

    historyModal.style.display = "none";
  });
}

// ======================================================
// MODAL ITEM DETAIL
// ======================================================
//
// Detail produk sekarang ditangani oleh Alpine.js
// melalui:
// @click.prevent="changeItem(item)"
//
// Jadi tidak perlu lagi:
// document.querySelectorAll(".item-detail-button")
// ======================================================

// ======================================================
// KLIK DI LUAR MODAL
// ======================================================

window.addEventListener("click", function (e) {
  if (e.target === historyModal) {
    historyModal.style.display = "none";
  }
});

// ======================================================
// SIMPAN HISTORY PESANAN
// ======================================================

function simpanHistory(cartItems, total, phone, orderId) {
  const newHistoryEntry = {
    idOrder: orderId || "-",

    tanggal: new Date().toLocaleString("id-ID"),

    pesanan: cartItems
      .map(function (item) {
        return `${item.name} (${item.quantity}x)`;
      })
      .join(", "),

    total: total,

    statusPembayaran: "Belum Bayar",

    statusPesanan: "Pesanan Baru",

    phone: phone,
  };

  const currentHistory = JSON.parse(localStorage.getItem("kopi-history")) || [];

  currentHistory.unshift(newHistoryEntry);

  localStorage.setItem("kopi-history", JSON.stringify(currentHistory));
}

// ======================================================
// KIRIM DATA PESANAN KE SUPABASE
// ======================================================

async function kirimKeSupabase(dataPesanan) {
  // ID dibuat di sisi browser sendiri (bukan diminta balik dari server),
  // karena customer (anon) sengaja hanya diberi izin INSERT demi keamanan
  // (tidak boleh membaca pesanan siapapun, termasuk pesanan sendiri).
  const orderId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "order-" + Date.now();

  const { error } = await supabaseClient.from("orders").insert([
    {
      id: orderId,
      customer_name: dataPesanan.nama,
      customer_email: dataPesanan.email || null,
      customer_phone: dataPesanan.phone,
      items: dataPesanan.items,
      total: dataPesanan.total,
    },
  ]);

  if (error) {
    console.error("Gagal menyimpan pesanan ke Supabase:", error);
    throw error;
  }

  return { id: orderId };
}

// ======================================================
// CHECKOUT
// ======================================================

const checkoutButton = document.querySelector("#checkout");

if (checkoutButton) {
  checkoutButton.addEventListener("click", async function (e) {
    e.preventDefault();

    // -----------------------------------------------
    // AMBIL FORM CHECKOUT
    // -----------------------------------------------

    const checkoutForm = document.querySelector("#checkoutForm");

    if (!checkoutForm) {
      console.error("Form checkout tidak ditemukan.");
      return;
    }

    const namaInput = checkoutForm.querySelector("#name");

    const emailInput = checkoutForm.querySelector("#email");

    const phoneInput = checkoutForm.querySelector("#phone");

    const nama = namaInput?.value.trim() || "";

    const email = emailInput?.value.trim() || "";

    const phone = phoneInput?.value.trim() || "";

    // -----------------------------------------------
    // AMBIL DATA CART
    // -----------------------------------------------

    if (typeof Alpine === "undefined" || !Alpine.store("cart")) {
      Swal.fire({
        icon: "error",
        title: "Cart Error",
        text: "Data keranjang belum siap. Silakan refresh halaman.",
      });

      return;
    }

    const cart = Alpine.store("cart");

    const cartItems = cart.items;
    const total = cart.total;

    // -----------------------------------------------
    // VALIDASI
    // -----------------------------------------------

    if (!cartItems || cartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Keranjang Kosong",
        text: "Silakan pilih produk terlebih dahulu.",
      });

      return;
    }

    if (!nama || !phone) {
      Swal.fire({
        icon: "error",
        title: "Data Belum Lengkap",
        text: "Mohon isi nama dan nomor telepon.",
      });

      return;
    }

    // TUTUP SHOPPING CART SEBELUM QR MUNCUL
    // -----------------------------------------------

    if (shoppingCart) {
      shoppingCart.classList.remove("active");
    }

    // -----------------------------------------------
    // TAMPILKAN QR CODE
    // -----------------------------------------------

    const result = await Swal.fire({
      title: "Selesaikan Pembayaran",

      html: `
       <div style="font-size: 1.5rem; margin-bottom: 10px;">
         * Anda akan diarahkan ke whatsapp untuk mengkonfirmasi pesanan *
        </div>
        
        <div style="font-size: 1rem; margin-bottom: 10px;">
          Total yang harus dibayar:
        </div>

        <div style="
          font-size: 1.3rem;
          font-weight: bold;
          margin-bottom: 15px;
        ">
          ${rupiah(total)}
        </div>
      `,

      imageUrl: "img/qr/qr-code.jpeg",

      imageWidth: 300,

      imageHeight: 370,

      imageAlt: "QR Code Pembayaran",

      showCancelButton: true,

      confirmButtonText: "Konfirmasi Pembayaran",

      cancelButtonText: "Batal",

      confirmButtonColor: "#b6895b",

      cancelButtonColor: "#666",

      allowOutsideClick: false,
    });

    // -----------------------------------------------
    // JIKA USER MEMBATALKAN
    // -----------------------------------------------

    if (!result.isConfirmed) {
      return;
    }

    // -----------------------------------------------
    // SUSUN DAFTAR PESANAN
    // -----------------------------------------------

    const daftarPesanan = cartItems
      .map(function (item) {
        return `${item.name} (${item.quantity}x)`;
      })
      .join(", ");

    // -----------------------------------------------
    // DATA UNTUK SUPABASE
    // -----------------------------------------------

    const itemsUntukDb = cartItems.map(function (item) {
      return {
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      };
    });

    const dataKeSpreadsheet = {
      nama: nama,

      email: email,

      phone: phone,

      pesanan: daftarPesanan,

      items: itemsUntukDb,

      total: total,
    };

    // -----------------------------------------------
    // TAMPILKAN LOADING
    // -----------------------------------------------

    Swal.fire({
      title: "Menyimpan Pesanan...",

      text: "Mohon tunggu sebentar.",

      allowOutsideClick: false,

      allowEscapeKey: false,

      didOpen: function () {
        Swal.showLoading();
      },
    });

    // -----------------------------------------------
    // KIRIM KE GOOGLE SHEETS
    // -----------------------------------------------

    try {
      const hasil = await kirimKeSupabase(dataKeSpreadsheet);

      console.log("Hasil simpan pesanan:", hasil);

      // ---------------------------------------------
      // SIMPAN HISTORY LOCAL
      // ---------------------------------------------

      simpanHistory(cartItems, total, phone, hasil && hasil.id);

      // ---------------------------------------------
      // SUSUN PESAN WHATSAPP
      // ---------------------------------------------

      let pesan = "Halo Admin Kopi Ngalam!\n\n";

      pesan += "Saya *Sudah Membayar* pesanan berikut:\n\n";

      cartItems.forEach(function (item) {
        pesan += `- ${item.name} (${item.quantity} x ${rupiah(item.price)})\n`;
      });

      pesan += `\n*Total: ${rupiah(total)}*`;

      pesan += "\n\n---\n*Data Pelanggan*";

      pesan += `\nNama: ${nama}`;

      pesan += `\nEmail: ${email || "-"}`;

      pesan += `\nNo HP: ${phone}`;

      // ---------------------------------------------
      // ID ORDER
      // ---------------------------------------------

      if (hasil && hasil.id) {
        pesan += `\nID Order: ${hasil.id}`;
      }

      // ---------------------------------------------
      // URL WHATSAPP
      // ---------------------------------------------

      const whatsappUrl =
        "https://wa.me/" +
        WHATSAPP_ADMIN +
        "?text=" +
        encodeURIComponent(pesan);

      // ---------------------------------------------
      // BERSIHKAN CART
      // ---------------------------------------------

      if (
        Alpine.store("cart") &&
        typeof Alpine.store("cart").clearCart === "function"
      ) {
        Alpine.store("cart").clearCart();
      } else {
        Alpine.store("cart").items = [];

        Alpine.store("cart").quantity = 0;

        Alpine.store("cart").total = 0;
      }

      // ---------------------------------------------
      // TUTUP SHOPPING CART
      // ---------------------------------------------

      if (shoppingCart) {
        shoppingCart.classList.remove("active");
      }

      // ---------------------------------------------
      // PESAN SUKSES
      // ---------------------------------------------

      await Swal.fire({
        icon: "success",

        title: "Pesanan Berhasil!",

        text: "Data pesanan sudah dikirim. WhatsApp akan dibuka untuk konfirmasi.",

        confirmButtonText: "Lanjut ke WhatsApp",

        confirmButtonColor: "#b6895b",
      });

      // ---------------------------------------------
      // BUKA WHATSAPP
      // ---------------------------------------------

      window.location.href = whatsappUrl;
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",

        title: "Gagal Menyimpan Pesanan",

        text: "Pesanan belum dapat dikirim ke database. Silakan coba lagi.",

        confirmButtonColor: "#b6895b",
      });
    }
  });
}
