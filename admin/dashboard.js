document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inisialisasi Icon Feather
  feather.replace();

  // 2. Proteksi Halaman (Cek Sesi Login Supabase)
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  if (session.user && session.user.email) {
    document.getElementById("adminUsername").innerText =
      session.user.email.split("@")[0];
  }

  // 3. Logika Navigasi Tab (Sidebar)
  const navLinks = document.querySelectorAll(".nav-link[data-tab]");
  const tabContents = document.querySelectorAll(".tab-content");
  const pageTitle = document.getElementById("pageTitle");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute("data-tab");

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      tabContents.forEach((content) => {
        content.style.display =
          content.id === `tab-${targetTab}` ? "block" : "none";
      });

      pageTitle.innerText =
        targetTab === "setting"
          ? "Setting Menu"
          : targetTab === "pesanan"
            ? "Pesanan"
            : targetTab === "laporan"
              ? "Laporan"
              : "Dashboard";

      if (targetTab === "pesanan") {
        loadOrders();
      }

      if (targetTab === "laporan") {
        loadLaporan();
      }
    });
  });

  // 4. Load Data Produk dari Supabase
  async function loadProducts() {
    const tbody = document.getElementById("productTableBody");
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Gagal memuat produk:", error);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">Gagal memuat data menu.</td></tr>`;
      return;
    }

    document.getElementById("totalProductsCount").innerText = products.length;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Belum ada menu yang ditambahkan.</td></tr>`;
      return;
    }

    tbody.innerHTML = products
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 15px;">
          <img src="../img/products/${item.image || "default.jpg"}" alt="${item.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" onerror="this.src='https://via.placeholder.com/45'">
        </td>
        <td style="padding: 12px 15px; font-weight: 600; color: #1a1a1a;">${item.name}</td>
        <td style="padding: 12px 15px; color: #666; font-size: 0.85rem; max-width: 200px;">${item.description || "-"}</td>
        <td style="padding: 12px 15px; font-weight: 500; color: #1a1a1a;">Rp ${Number(item.price).toLocaleString("id-ID")}</td>
        <td style="padding: 12px 15px;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; ${item.is_active ? "background: #e6f4ea; color: #1e7e34;" : "background: #fbeae8; color: #d93025;"}">
            ${item.is_active ? "Tersedia" : "Nonaktif"}
          </span>
        </td>
        <td style="padding: 12px 15px; text-align: center;">
          <button onclick="editProduct(${item.id}, '${item.name}', '${item.description || ""}', ${item.price}, ${item.is_active})" style="background: none; border: none; cursor: pointer; color: #007bff; margin-right: 8px;" title="Edit">
            <i data-feather="edit-2"></i>
          </button>
          <button onclick="deleteProduct(${item.id}, '${item.name}')" style="background: none; border: none; cursor: pointer; color: #dc3545;" title="Hapus">
            <i data-feather="trash-2"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");

    feather.replace();
  }

  // Initial Load
  loadProducts();

  // 4b. Load Data Pesanan dari Supabase
  async function loadOrders() {
    const tbody = document.getElementById("orderTableBody");
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#888;">Memuat data pesanan...</td></tr>`;

    const { data: orders, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal memuat pesanan:", error);
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding:20px;">Gagal memuat data pesanan.</td></tr>`;
      return;
    }

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#888;">Belum ada pesanan masuk.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders
      .map((order) => {
        const waktu = new Date(order.created_at).toLocaleString("id-ID");
        const daftarItem = Array.isArray(order.items)
          ? order.items.map((it) => `${it.name} (${it.quantity}x)`).join(", ")
          : "-";
        const sudahBayar = order.payment_status === "Sudah Bayar";

        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 15px; font-size: 0.85rem; color: #1a1a1a;">${waktu}</td>
          <td style="padding: 12px 15px;">
            <div style="font-weight:600; color: #1a1a1a;">${order.customer_name}</div>
            <div style="color:#666; font-size:0.8rem;">${order.customer_phone}</div>
          </td>
          <td style="padding: 12px 15px; font-size: 0.85rem; max-width: 220px; color: #1a1a1a;">${daftarItem}</td>
          <td style="padding: 12px 15px; font-weight: 500; color: #1a1a1a;">Rp ${Number(order.total).toLocaleString("id-ID")}</td>
          <td style="padding: 12px 15px;">
            <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; ${sudahBayar ? "background:#e6f4ea; color:#1e7e34;" : "background:#fbeae8; color:#d93025;"}">
              ${order.payment_status}
            </span>
          </td>
          <td style="padding: 12px 15px;">
            <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding:4px 6px; border-radius:4px; border:1px solid #ddd; color: #1a1a1a;">
              <option value="Pesanan Baru" ${order.order_status === "Pesanan Baru" ? "selected" : ""}>Pesanan Baru</option>
              <option value="Diproses" ${order.order_status === "Diproses" ? "selected" : ""}>Diproses</option>
              <option value="Selesai" ${order.order_status === "Selesai" ? "selected" : ""}>Selesai</option>
              <option value="Dibatalkan" ${order.order_status === "Dibatalkan" ? "selected" : ""}>Dibatalkan</option>
            </select>
          </td>
          <td style="padding: 12px 15px; text-align: center;">
            <button onclick="togglePaymentStatus('${order.id}', ${sudahBayar})" style="background:none; border:none; cursor:pointer; color:#007bff; margin-right:8px;" title="Tandai ${sudahBayar ? "Belum Bayar" : "Sudah Bayar"}">
              <i data-feather="${sudahBayar ? "x-circle" : "check-circle"}"></i>
            </button>
            <button onclick="deleteOrder('${order.id}')" style="background:none; border:none; cursor:pointer; color:#dc3545;" title="Hapus">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    feather.replace();
  }
  window.loadOrders = loadOrders;

  // Global Function: Update status pesanan
  window.updateOrderStatus = async (id, newStatus) => {
    const { error } = await supabaseClient
      .from("orders")
      .update({ order_status: newStatus })
      .eq("id", id);

    if (error) {
      Swal.fire("Gagal!", error.message, "error");
      loadOrders();
    }
  };

  // Global Function: Tandai sudah/belum bayar
  window.togglePaymentStatus = async (id, isCurrentlyPaid) => {
    const newStatus = isCurrentlyPaid ? "Belum Bayar" : "Sudah Bayar";
    const { error } = await supabaseClient
      .from("orders")
      .update({ payment_status: newStatus })
      .eq("id", id);

    if (error) {
      Swal.fire("Gagal!", error.message, "error");
    }
    loadOrders();
  };

  // 4c. Laporan Penjualan
  async function loadLaporan() {
    const elTotalPendapatan = document.getElementById("lapTotalPendapatan");
    const elTotalPesanan = document.getElementById("lapTotalPesanan");
    const elBelumBayar = document.getElementById("lapBelumBayar");
    const elMenuTerlaris = document.getElementById("lapMenuTerlarisBody");
    const el7Hari = document.getElementById("lap7HariBody");

    const { data: orders, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal memuat laporan:", error);
      elMenuTerlaris.innerHTML = `<tr><td colspan="2" style="text-align:center; color:red; padding:15px;">Gagal memuat data.</td></tr>`;
      el7Hari.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red; padding:15px;">Gagal memuat data.</td></tr>`;
      return;
    }

    // ---------- Ringkasan ----------
    let totalPendapatan = 0;
    let totalBelumBayar = 0;

    orders.forEach((order) => {
      if (order.payment_status === "Sudah Bayar") {
        totalPendapatan += Number(order.total) || 0;
      } else {
        totalBelumBayar += 1;
      }
    });

    elTotalPendapatan.textContent =
      "Rp " + totalPendapatan.toLocaleString("id-ID");
    elTotalPesanan.textContent = orders.length;
    elBelumBayar.textContent = totalBelumBayar;

    // ---------- Menu Terlaris ----------
    const jumlahPerMenu = {};

    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((it) => {
        const nama = it.name || "Tidak diketahui";
        const qty = Number(it.quantity) || 0;
        jumlahPerMenu[nama] = (jumlahPerMenu[nama] || 0) + qty;
      });
    });

    const menuTerlaris = Object.entries(jumlahPerMenu).sort(
      (a, b) => b[1] - a[1],
    );

    if (menuTerlaris.length === 0) {
      elMenuTerlaris.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:15px; color:#888;">Belum ada data.</td></tr>`;
    } else {
      elMenuTerlaris.innerHTML = menuTerlaris
        .slice(0, 5)
        .map(
          ([nama, qty]) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 15px; color: #1a1a1a;">${nama}</td>
            <td style="padding: 10px 15px; color: #1a1a1a;">${qty}x</td>
          </tr>
        `,
        )
        .join("");
    }

    // ---------- Pendapatan 7 Hari Terakhir ----------
    const hariIni = new Date();
    const rekap7Hari = [];

    for (let i = 6; i >= 0; i--) {
      const tgl = new Date(hariIni);
      tgl.setDate(hariIni.getDate() - i);
      const kunci = tgl.toISOString().slice(0, 10);
      rekap7Hari.push({
        kunci,
        label: tgl.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        pendapatan: 0,
        jumlahPesanan: 0,
      });
    }

    orders.forEach((order) => {
      const kunciOrder = new Date(order.created_at).toISOString().slice(0, 10);
      const baris = rekap7Hari.find((r) => r.kunci === kunciOrder);
      if (baris) {
        baris.jumlahPesanan += 1;
        if (order.payment_status === "Sudah Bayar") {
          baris.pendapatan += Number(order.total) || 0;
        }
      }
    });

    el7Hari.innerHTML = rekap7Hari
      .map(
        (r) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.label}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${r.pendapatan.toLocaleString("id-ID")}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.jumlahPesanan}</td>
        </tr>
      `,
      )
      .join("");

    // ---------- Rekap 6 Bulan Terakhir ----------
    const elBulanan = document.getElementById("lapBulananBody");
    const rekapBulanan = [];

    for (let i = 5; i >= 0; i--) {
      const tgl = new Date(hariIni.getFullYear(), hariIni.getMonth() - i, 1);
      const kunci = `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(2, "0")}`;
      rekapBulanan.push({
        kunci,
        label: tgl.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
        pendapatan: 0,
        jumlahPesanan: 0,
      });
    }

    orders.forEach((order) => {
      const tglOrder = new Date(order.created_at);
      const kunciOrder = `${tglOrder.getFullYear()}-${String(tglOrder.getMonth() + 1).padStart(2, "0")}`;
      const baris = rekapBulanan.find((r) => r.kunci === kunciOrder);
      if (baris) {
        baris.jumlahPesanan += 1;
        if (order.payment_status === "Sudah Bayar") {
          baris.pendapatan += Number(order.total) || 0;
        }
      }
    });

    elBulanan.innerHTML = rekapBulanan
      .map(
        (r) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.label}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${r.pendapatan.toLocaleString("id-ID")}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.jumlahPesanan}</td>
        </tr>
      `,
      )
      .join("");
  }
  window.loadLaporan = loadLaporan;

  // Global Function: Hapus pesanan
  window.deleteOrder = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Pesanan?",
      text: "Data pesanan ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      const { error } = await supabaseClient
        .from("orders")
        .delete()
        .eq("id", id);
      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        Swal.fire("Terhapus!", "Pesanan telah dihapus.", "success");
        loadOrders();
      }
    }
  };

  // 5. Tambah Produk Baru (SweetAlert Form)
  document
    .getElementById("btnAddProduct")
    .addEventListener("click", async () => {
      const { value: formValues } = await Swal.fire({
        title: "Tambah Menu Baru",
        html:
          '<input id="swal-name" class="swal2-input" placeholder="Nama Menu (misal: V60)">' +
          '<input id="swal-desc" class="swal2-input" placeholder="Deskripsi Singkat">' +
          '<input id="swal-price" type="number" class="swal2-input" placeholder="Harga (misal: 18000)">' +
          '<input id="swal-image" class="swal2-input" placeholder="Nama file di folder img/products/ (misal: v60.jpg)">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        cancelButtonText: "Batal",
        preConfirm: () => {
          const name = document.getElementById("swal-name").value;
          const description = document.getElementById("swal-desc").value;
          const price = document.getElementById("swal-price").value;
          const image = document.getElementById("swal-image").value;

          if (!name || !price) {
            Swal.showValidationMessage("Nama menu dan harga wajib diisi!");
            return false;
          }
          return { name, description, price: parseFloat(price), image };
        },
      });

      if (formValues) {
        const { error } = await supabaseClient
          .from("products")
          .insert([formValues]);
        if (error) {
          Swal.fire("Gagal!", error.message, "error");
        } else {
          Swal.fire("Berhasil!", "Menu baru berhasil ditambahkan.", "success");
          loadProducts();
        }
      }
    });

  // 6. Global Function: Edit Produk
  window.editProduct = async (id, name, description, price, isActive) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Menu & Harga",
      html:
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Nama Menu:</label>` +
        `<input id="swal-edit-name" class="swal2-input" value="${name}">` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Deskripsi:</label>` +
        `<input id="swal-edit-desc" class="swal2-input" value="${description}">` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Harga (Rp):</label>` +
        `<input id="swal-edit-price" type="number" class="swal2-input" value="${price}">` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Status Ketersediaan:</label>` +
        `<select id="swal-edit-status" class="swal2-input">` +
        `<option value="true" ${isActive ? "selected" : ""}>Tersedia</option>` +
        `<option value="false" ${!isActive ? "selected" : ""}>Nonaktif / Habis</option>` +
        `</select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Perbarui",
      cancelButtonText: "Batal",
      preConfirm: () => {
        return {
          name: document.getElementById("swal-edit-name").value,
          description: document.getElementById("swal-edit-desc").value,
          price: parseFloat(document.getElementById("swal-edit-price").value),
          is_active:
            document.getElementById("swal-edit-status").value === "true",
        };
      },
    });

    if (formValues) {
      const { error } = await supabaseClient
        .from("products")
        .update(formValues)
        .eq("id", id);

      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        Swal.fire("Tersimpan!", "Menu berhasil diperbarui.", "success");
        loadProducts();
      }
    }
  };

  // 7. Global Function: Hapus Produk
  window.deleteProduct = async (id, name) => {
    const result = await Swal.fire({
      title: "Hapus Menu?",
      text: `Apakah Anda yakin ingin menghapus "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", id);
      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        Swal.fire("Terhapus!", "Menu telah dihapus.", "success");
        loadProducts();
      }
    }
  };

  // 8. Logout Handling
  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "../index.html";
    });
});
