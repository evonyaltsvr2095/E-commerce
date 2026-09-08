// KOPI NGALAM
// KONFIGURASI

const WHATSAPP_ADMIN = "6285961438827";

// METODE PEMBAYARAN

const METODE_PEMBAYARAN = [
  {
    id: "BRI",
    label: "BRI",
    tipe: "transfer",
    bank: "Bank BRI",
    nomor: "2066 0100 5002 538",
    atasNama: "FAIRUZ IQBAL AL FAROBI",
  },
  {
    id: "MANDIRI",
    label: "Mandiri",
    tipe: "transfer",
    bank: "Bank Mandiri",
    nomor: "1440 0296 0679 2",
    atasNama: "FAIRUZ IQBAL AL FAROBI",
  },
  {
    id: "DANA",
    label: "DANA",
    tipe: "ewallet",
    bank: "DANA",
    nomor: "0859 6143 8827",
    atasNama: "FAIRUZ IQBAL AL FAROBI",
  },
  {
    id: "GOPAY",
    label: "GoPay",
    tipe: "ewallet",
    bank: "GoPay",
    nomor: "0859 6143 8827",
    atasNama: "FAIRUZ IQBAL AL FAROBI",
  },
  {
    id: "QRIS",
    label: "QRIS",
    tipe: "qris",
    gambar: "img/qr/qr-code.jpeg",
  },
  {
    id: "TUNAI",
    label: "Tunai",
    tipe: "tunai",
    pesan: [
      "BAYAR KE KASIR SESUAI NOMINAL PESANAN ANDA",
      "SETELAH MEMBAYAR PESANAN AKAN KAMI PROSES",
    ],
  },
];

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwWoEOWybdNb3gCnSSTuyF99ZWrdg0P30sbnIcFVZvbIPh-OQO0cGS4_M5C1BaMWYVk/exec";

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

const navbarNav = document.querySelector(".navbar-nav");
const hamburgerMenu = document.querySelector("#hamburger-menu");

if (hamburgerMenu && navbarNav) {
  hamburgerMenu.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    navbarNav.classList.toggle("active");
  });
}

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

const shoppingCart = document.querySelector(".shopping-cart");
const shoppingCartButton = document.querySelector("#shopping-cart-button");

if (shoppingCartButton && shoppingCart) {
  shoppingCartButton.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    shoppingCart.classList.toggle("active");
  });
}

document.addEventListener("click", function (e) {
  const target = e.target;

  if (
    navbarNav &&
    hamburgerMenu &&
    !hamburgerMenu.contains(target) &&
    !navbarNav.contains(target)
  ) {
    navbarNav.classList.remove("active");
  }

  if (
    searchForm &&
    searchButton &&
    !searchButton.contains(target) &&
    !searchForm.contains(target)
  ) {
    searchForm.classList.remove("active");
  }

  if (
    shoppingCart &&
    shoppingCartButton &&
    !shoppingCartButton.contains(target) &&
    !shoppingCart.contains(target)
  ) {
    shoppingCart.classList.remove("active");
  }
});

const historyModal = document.querySelector("#history-modal");
const historyButton = document.querySelector("#history-button");

if (historyButton && historyModal) {
  historyButton.addEventListener("click", function (e) {
    e.preventDefault();

    historyModal.style.display = "flex";
  });
}

window.orderHistory = function () {
  return {
    phone: "",
    email: "",
    historyItems: [],
    loading: false,
    searched: false,
    errorMessage: "",

    async cariPesanan() {
      this.errorMessage = "";
      this.historyItems = [];
      this.searched = false;

      const nomor = String(this.phone || "").trim();
      const emailInput = String(this.email || "")
        .trim()
        .toLowerCase();

        if (!nomor) {
        this.errorMessage = "Silakan masukkan nomor WhatsApp Anda.";

        return;
      }

      const nomorBersih = nomor.replace(/\D/g, "");
      if (nomorBersih.length < 8) {
        this.errorMessage = "Nomor WhatsApp tidak valid.";

        return;
      }

      if (!emailInput) {
        this.errorMessage =
          "Silakan masukkan email yang dipakai saat checkout.";
        return;
      }

      this.loading = true;

      try {
        const { data, error } = await supabaseClient.rpc(
          "get_customer_orders",
          {
            p_phone: nomorBersih,
            p_email: emailInput,
          },
        );
        if (error) {
          throw error;
        }
        const hasil = (data || []).map(function (order) {
          const rawItems = Array.isArray(order.items) ? order.items : [];
          const daftarItem = rawItems
            .map((it) => `${it.name} (${it.quantity}x)`)
            .join(", ");
          return {
            idOrder: order.id,
            tanggal: new Date(order.created_at).toLocaleString("id-ID"),
            items: rawItems.map((it) => ({
              product_id: it.product_id,
              name: it.name,
              quantity: it.quantity,
              myRating: 0,
              myComment: "",
              submitting: false,
              submitted: false,
            })),
            pesanan: daftarItem || "-",
            total: order.total,
            statusPembayaran: order.payment_status,
            statusPesanan: order.order_status,
          };
        });

        this.historyItems = hasil;
        this.searched = true;

        const orderIds = hasil.map((o) => o.idOrder).filter(Boolean);
        if (orderIds.length > 0) {
          const { data: reviewData, error: reviewError } = await supabaseClient
            .from("product_reviews")
            .select("order_id, product_id, rating, comment")
            .in("order_id", orderIds);
          if (!reviewError && reviewData) {
            reviewData.forEach((rv) => {
              const order = hasil.find((o) => o.idOrder === rv.order_id);
              const item = order?.items.find(
                (it) => it.product_id === rv.product_id,
              );
              if (item) {
                item.myRating = rv.rating;
                item.myComment = rv.comment || "";
                item.submitted = true;
              }
            });
          }
        }
        if (hasil.length === 0) {
          this.errorMessage =
            "Tidak ditemukan pesanan dengan nomor WhatsApp dan email tersebut.";
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);

        this.errorMessage =
          "Riwayat pesanan tidak dapat diambil. Silakan coba lagi.";
      } finally {
        this.loading = false;
      }
    },

    pilihBintang(item, angka) {
      item.myRating = angka;
    },

    async kirimRating(order, item) {
      if (!item.myRating) {
        Swal.fire({
          icon: "warning",
          title: "Pilih bintang dulu",
          text: "Klik salah satu bintang sebelum mengirim rating.",
        });
        return;
      }

      item.submitting = true;

      try {
        const { error } = await supabaseClient.rpc("submit_product_review", {
          p_order_id: order.idOrder,
          p_product_id: item.product_id,
          p_phone: String(this.phone || "").replace(/\D/g, ""),
          p_email: String(this.email || "")
            .trim()
            .toLowerCase(),
          p_rating: item.myRating,
          p_comment: item.myComment || null,
        });

        if (error) throw error;

        item.submitted = true;

        Swal.fire({
          icon: "success",
          title: "Terima kasih!",
          text: "Rating Anda berhasil disimpan.",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Gagal mengirim rating:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal mengirim rating",
          text: error.message || "Silakan coba lagi.",
        });
      } finally {
        item.submitting = false;
      }
    },
  };
};

const closeHistory = document.querySelector("#close-history");
if (closeHistory && historyModal) {
  closeHistory.addEventListener("click", function (e) {
    e.preventDefault();

    historyModal.style.display = "none";
  });
}

window.addEventListener("click", function (e) {
  if (e.target === historyModal) {
    historyModal.style.display = "none";
  }
});

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

async function kirimKeSupabase(dataPesanan) {
  const { data: orderId, error } = await supabaseClient.rpc(
    "buat_pesanan_dengan_item",
    {
      p_customer_name: dataPesanan.nama,
      p_customer_email: dataPesanan.email
        ? String(dataPesanan.email).trim().toLowerCase()
        : null,
      p_customer_phone: String(dataPesanan.phone || "").replace(/\D/g, ""),
      p_items: dataPesanan.items,
      p_total: dataPesanan.total,
      p_payment_method: dataPesanan.paymentMethod || null,
    },
  );

  if (error) {
    console.error("Gagal menyimpan pesanan ke Supabase:", error);
    throw error;
  }

  return { id: orderId };
}

const checkoutButton = document.querySelector("#checkout");

if (checkoutButton) {
  checkoutButton.addEventListener("click", async function (e) {
    e.preventDefault();

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
    if (!cartItems || cartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Keranjang Kosong",
        text: "Silakan pilih produk terlebih dahulu.",
      });

      return;
    }

    if (!nama || !phone || !email) {
      Swal.fire({
        icon: "error",
        title: "Data Belum Lengkap",
        text: "Mohon isi nama, email, dan nomor telepon. Email dibutuhkan supaya Anda bisa cek riwayat pesanan nanti.",
      });

      return;
    }

    if (shoppingCart) {
      shoppingCart.classList.remove("active");
    }

    function htmlDetailMetode(m) {
      if (m.tipe === "tunai") {
        return `
          <div style="text-align:left;">
            <div style="font-weight:700; margin-bottom:6px;">Bayar Tunai</div>
            ${m.pesan.map((baris) => `<div>${baris}</div>`).join("")}
          </div>
        `;
      }

      if (m.tipe === "qris") {
        return `
          <div style="text-align:center;">
            <div style="font-weight:700; margin-bottom:8px;">Scan QRIS</div>
            <img src="${m.gambar}" alt="QRIS" style="width:220px; height:auto; border-radius:8px; border:1px solid #eee;">
          </div>
        `;
      }

      return `
        <div style="text-align:left;">
          <div style="font-weight:700; margin-bottom:6px;">${m.bank}</div>
          <div>No. ${m.tipe === "transfer" ? "Rekening" : m.label}: <b>${m.nomor}</b></div>
          <div>Atas Nama: ${m.atasNama}</div>
        </div>
      `;
    }

    let metodeTerpilih = null;

    const tombolMetodeHtml = METODE_PEMBAYARAN.map(
      (m) => `
        <button
          type="button"
          class="metode-bayar-btn"
          data-metode="${m.id}"
        >${m.label}</button>
      `,
    ).join("");

    const result = await Swal.fire({
      title: "Pilih Metode Pembayaran",
      html: `
        <div style="font-size: 1rem; margin-bottom: 6px;">
          Total yang harus dibayar:
        </div>
        <div style="font-size: 1.3rem; font-weight: bold; margin-bottom: 16px;">
          ${rupiah(total)}
        </div>
        <div id="metode-list" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:14px;">
          ${tombolMetodeHtml}
        </div>
        <div
          id="metode-detail"
          style="display:none; min-height:60px; padding:12px; border-radius:8px; background:#f7f4f0; margin-bottom:12px; font-size: 0.9rem;"
        ></div>
        <div style="font-size: 0.8rem; color: #888;">
          * Setelah konfirmasi, Anda akan diarahkan ke WhatsApp *
        </div>
      `,

      showCancelButton: true,
      confirmButtonText: "Konfirmasi Pembayaran",
      cancelButtonText: "Batal",
      confirmButtonColor: "#b6895b",
      cancelButtonColor: "#666",
      allowOutsideClick: false,

      didOpen: () => {
        const detailBox = document.getElementById("metode-detail");

        document.querySelectorAll(".metode-bayar-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document
              .querySelectorAll(".metode-bayar-btn")
              .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            metodeTerpilih = btn.getAttribute("data-metode");

            const m = METODE_PEMBAYARAN.find((x) => x.id === metodeTerpilih);
            detailBox.innerHTML = htmlDetailMetode(m);
            detailBox.style.display = "block";
          });
        });
      },

      preConfirm: () => {
        if (!metodeTerpilih) {
          Swal.showValidationMessage("Silakan pilih metode pembayaran dulu.");
          return false;
        }
        return metodeTerpilih;
      },
    });
    if (!result.isConfirmed) {
      return;
    }

    const daftarPesanan = cartItems
      .map(function (item) {
        return `${item.name} (${item.quantity}x)`;
      })
      .join(", ");

    const itemsUntukDb = cartItems.map(function (item) {
      return {
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || "",
      };
    });

    const dataKeSpreadsheet = {
      nama: nama,
      email: email,
      phone: phone,
      pesanan: daftarPesanan,
      items: itemsUntukDb,
      total: total,
      paymentMethod: result.value,
    };

    Swal.fire({
      title: "Menyimpan Pesanan...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      allowEscapeKey: false,

      didOpen: function () {
        Swal.showLoading();
      },
    });

    try {
      const hasil = await kirimKeSupabase(dataKeSpreadsheet);

      console.log("Hasil simpan pesanan:", hasil);

      simpanHistory(cartItems, total, phone, hasil && hasil.id);

      // SUSUN PESAN WHATSAPP
      let pesan = "Halo Admin Kopi Ngalam!\n\n";

      const metodeDipilih = METODE_PEMBAYARAN.find(
        (m) => m.id === result.value,
      );

      if (metodeDipilih && metodeDipilih.tipe === "tunai") {
        pesan +=
          "Saya *akan membayar TUNAI di kasir* untuk pesanan berikut:\n\n";
      } else if (metodeDipilih && metodeDipilih.tipe === "qris") {
        pesan += "Saya *sudah bayar via QRIS* untuk pesanan berikut:\n\n";
      } else {
        pesan += `Saya *sudah transfer via ${metodeDipilih ? metodeDipilih.label : result.value}* untuk pesanan berikut:\n\n`;
      }

      cartItems.forEach(function (item) {
        pesan += `- ${item.name} (${item.quantity} x ${rupiah(item.price)})`;
        if (item.notes && item.notes.trim()) {
          pesan += `\n  Catatan: ${item.notes.trim()}`;
        }
        pesan += "\n";
      });
      pesan += `\n*Total: ${rupiah(total)}*`;
      pesan += "\n\n---\n*Data Pelanggan*";
      pesan += `\nNama: ${nama}`;
      pesan += `\nEmail: ${email || "-"}`;
      pesan += `\nNo HP: ${phone}`;

      // ID ORDER
      if (hasil && hasil.id) {
        pesan += `\nID Order: ${hasil.id}`;
      }

      // URL WHATSAPP
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

      // PESAN SUKSES

      await Swal.fire({
        icon: "success",

        title: "Pesanan Berhasil!",

        text: "Data pesanan sudah dikirim. WhatsApp akan dibuka untuk konfirmasi.",

        confirmButtonText: "Lanjut ke WhatsApp",

        confirmButtonColor: "#b6895b",
      });

      // BUKA WHATSAPP

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
