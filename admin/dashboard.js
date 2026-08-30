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
              : targetTab === "bahan"
                ? "Bahan Baku"
                : targetTab === "resep"
                  ? "Resep Menu"
                  : targetTab === "pengeluaran"
                    ? "Pengeluaran"
                    : "Dashboard";

      if (targetTab === "pesanan") {
        loadOrders();
      }

      if (targetTab === "laporan") {
        loadLaporan();
      }

      if (targetTab === "bahan") {
        loadIngredients();
      }

      if (targetTab === "resep") {
        loadResepSelector();
      }

      if (targetTab === "pengeluaran") {
        loadExpenses();
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

    // ---------- Untung / Rugi ----------
    const elUrPendapatan = document.getElementById("urPendapatan");
    const elUrHpp = document.getElementById("urHpp");
    const elUrPengeluaran = document.getElementById("urPengeluaran");
    const elUrLabaRugi = document.getElementById("urLabaRugi");

    // Ambil resep semua menu (untuk hitung HPP per menu)
    const { data: resepData, error: resepError } = await supabaseClient
      .from("product_ingredients")
      .select("product_id, quantity_used, ingredients(cost_per_unit)");

    const hppPerProduk = {};
    if (!resepError && resepData) {
      resepData.forEach((r) => {
        const biaya =
          Number(r.quantity_used) * Number(r.ingredients?.cost_per_unit || 0);
        hppPerProduk[r.product_id] = (hppPerProduk[r.product_id] || 0) + biaya;
      });
    }

    // Hitung total HPP dari semua pesanan yang SUDAH BAYAR
    let totalHppTerpakai = 0;
    orders.forEach((order) => {
      if (order.payment_status !== "Sudah Bayar") return;
      if (!Array.isArray(order.items)) return;
      order.items.forEach((it) => {
        const hppSatuan = hppPerProduk[it.product_id] || 0;
        totalHppTerpakai += hppSatuan * (Number(it.quantity) || 0);
      });
    });

    // Ambil total pengeluaran operasional lain
    const { data: expenseData, error: expenseError } = await supabaseClient
      .from("expenses")
      .select("amount");

    const totalPengeluaranLain =
      !expenseError && expenseData
        ? expenseData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
        : 0;

    const labaRugi = totalPendapatan - totalHppTerpakai - totalPengeluaranLain;

    elUrPendapatan.textContent =
      "Rp " + totalPendapatan.toLocaleString("id-ID");
    elUrHpp.textContent = "Rp " + totalHppTerpakai.toLocaleString("id-ID");
    elUrPengeluaran.textContent =
      "Rp " + totalPengeluaranLain.toLocaleString("id-ID");
    elUrLabaRugi.textContent = "Rp " + labaRugi.toLocaleString("id-ID");
    elUrLabaRugi.style.color = labaRugi >= 0 ? "#1e7e34" : "#d93025";
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

  // =========================================================
  // 9. BAHAN BAKU (ingredients)
  // =========================================================

  let daftarBahanCache = [];

  async function loadIngredients() {
    const tbody = document.getElementById("ingredientTableBody");
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Memuat data...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Gagal memuat bahan baku:", error);
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Gagal memuat data.</td></tr>`;
      return;
    }

    daftarBahanCache = data || [];

    if (daftarBahanCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Belum ada bahan baku. Klik "+ Tambah Bahan".</td></tr>`;
      return;
    }

    tbody.innerHTML = daftarBahanCache
      .map((b) => {
        const stokRendah =
          Number(b.stock_quantity) <= Number(b.low_stock_threshold || 0);
        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 15px; color: #1a1a1a; font-weight: 600;">${b.name}</td>
          <td style="padding: 12px 15px; color: #1a1a1a;">${b.unit}</td>
          <td style="padding: 12px 15px; color: ${stokRendah ? "#d93025; font-weight:700;" : "#1a1a1a;"}">
            ${Number(b.stock_quantity).toLocaleString("id-ID")} ${b.unit}
            ${stokRendah ? ' <span title="Stok menipis">⚠️</span>' : ""}
          </td>
          <td style="padding: 12px 15px; color: #1a1a1a;">Rp ${Number(b.cost_per_unit).toLocaleString("id-ID")}/${b.unit}</td>
          <td style="padding: 12px 15px; text-align: center;">
            <button onclick="editIngredient(${b.id})" style="background:none; border:none; cursor:pointer; color:#007bff; margin-right:8px;" title="Edit">
              <i data-feather="edit-2"></i>
            </button>
            <button onclick="deleteIngredient(${b.id}, '${String(b.name).replace(/'/g, "\\'")}')" style="background:none; border:none; cursor:pointer; color:#dc3545;" title="Hapus">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    feather.replace();
  }
  window.loadIngredients = loadIngredients;

  async function bukaFormBahan(existing) {
    const { value: formValues } = await Swal.fire({
      title: existing ? "Edit Bahan Baku" : "Tambah Bahan Baku",
      html:
        `<input id="swal-nama" class="swal2-input" placeholder="Nama bahan (misal: Bubuk Kopi)" value="${existing ? existing.name : ""}">` +
        `<input id="swal-satuan" class="swal2-input" placeholder="Satuan (misal: gram, ml, pcs)" value="${existing ? existing.unit : ""}">` +
        `<input id="swal-stok" type="number" step="0.01" class="swal2-input" placeholder="Stok saat ini" value="${existing ? existing.stock_quantity : ""}">` +
        `<input id="swal-harga" type="number" step="0.01" class="swal2-input" placeholder="Harga per satuan (Rp)" value="${existing ? existing.cost_per_unit : ""}">` +
        `<input id="swal-batas" type="number" step="0.01" class="swal2-input" placeholder="Batas stok menipis (opsional)" value="${existing ? existing.low_stock_threshold : ""}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: existing ? "Simpan" : "Tambah",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const name = document.getElementById("swal-nama").value.trim();
        const unit = document.getElementById("swal-satuan").value.trim();
        const stock = document.getElementById("swal-stok").value;
        const cost = document.getElementById("swal-harga").value;
        const threshold = document.getElementById("swal-batas").value;

        if (!name || !unit || stock === "" || cost === "") {
          Swal.showValidationMessage(
            "Nama, satuan, stok, dan harga wajib diisi.",
          );
          return false;
        }

        return {
          name,
          unit,
          stock_quantity: parseFloat(stock),
          cost_per_unit: parseFloat(cost),
          low_stock_threshold: threshold ? parseFloat(threshold) : 0,
        };
      },
    });

    if (!formValues) return;

    let error;
    if (existing) {
      ({ error } = await supabaseClient
        .from("ingredients")
        .update(formValues)
        .eq("id", existing.id));
    } else {
      ({ error } = await supabaseClient
        .from("ingredients")
        .insert([formValues]));
    }

    if (error) {
      Swal.fire("Gagal!", error.message, "error");
    } else {
      Swal.fire("Berhasil!", "Bahan baku tersimpan.", "success");
      loadIngredients();
    }
  }

  document
    .getElementById("tambahBahanBtn")
    .addEventListener("click", () => bukaFormBahan(null));

  window.editIngredient = (id) => {
    const existing = daftarBahanCache.find((b) => b.id === id);
    if (existing) bukaFormBahan(existing);
  };

  window.deleteIngredient = async (id, name) => {
    const result = await Swal.fire({
      title: `Hapus "${name}"?`,
      text: "Bahan ini akan dihapus permanen, termasuk dari resep yang memakainya.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      const { error } = await supabaseClient
        .from("ingredients")
        .delete()
        .eq("id", id);
      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        Swal.fire("Terhapus!", "Bahan baku telah dihapus.", "success");
        loadIngredients();
      }
    }
  };

  // =========================================================
  // 10. RESEP MENU (product_ingredients)
  // =========================================================

  let daftarBahanUntukResep = [];

  async function loadResepSelector() {
    const select = document.getElementById("resepProductSelect");

    const { data: products, error } = await supabaseClient
      .from("products")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      select.innerHTML = `<option value="">Gagal memuat menu</option>`;
      return;
    }

    select.innerHTML =
      `<option value="">-- Pilih menu --</option>` +
      products
        .map((p) => `<option value="${p.id}">${p.name}</option>`)
        .join("");

    // Muat juga daftar bahan untuk dropdown "Tambah Bahan"
    const { data: bahan } = await supabaseClient
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });
    daftarBahanUntukResep = bahan || [];

    const bahanSelect = document.getElementById("resepBahanSelect");
    bahanSelect.innerHTML =
      `<option value="">-- Pilih bahan --</option>` +
      daftarBahanUntukResep
        .map((b) => `<option value="${b.id}">${b.name} (${b.unit})</option>`)
        .join("");

    document.getElementById("resepContainer").style.display = "none";
  }
  window.loadResepSelector = loadResepSelector;

  async function loadResepUntukProduk(productId) {
    const container = document.getElementById("resepContainer");
    const tbody = document.getElementById("resepTableBody");
    const totalEl = document.getElementById("resepTotalHpp");

    if (!productId) {
      container.style.display = "none";
      return;
    }

    container.style.display = "block";
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">Memuat...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("product_ingredients")
      .select("id, quantity_used, ingredients(id, name, unit, cost_per_unit)")
      .eq("product_id", productId);

    if (error) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:15px;">Gagal memuat resep.</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">Belum ada bahan di resep menu ini.</td></tr>`;
      totalEl.textContent = "Rp 0";
      return;
    }

    let totalHpp = 0;

    tbody.innerHTML = data
      .map((r) => {
        const biaya =
          Number(r.quantity_used) * Number(r.ingredients.cost_per_unit);
        totalHpp += biaya;
        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.ingredients.name}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.quantity_used} ${r.ingredients.unit}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${biaya.toLocaleString("id-ID")}</td>
          <td style="padding: 10px 15px; text-align: center;">
            <button onclick="hapusBahanResep(${r.id})" style="background:none; border:none; cursor:pointer; color:#dc3545;" title="Hapus">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    totalEl.textContent = "Rp " + totalHpp.toLocaleString("id-ID");
    feather.replace();
  }

  document
    .getElementById("resepProductSelect")
    .addEventListener("change", (e) => {
      loadResepUntukProduk(e.target.value);
    });

  document
    .getElementById("resepTambahBtn")
    .addEventListener("click", async () => {
      const productId = document.getElementById("resepProductSelect").value;
      const ingredientId = document.getElementById("resepBahanSelect").value;
      const jumlah = document.getElementById("resepJumlahInput").value;

      if (!productId) {
        Swal.fire("Oops", "Pilih menu terlebih dahulu.", "warning");
        return;
      }
      if (!ingredientId || !jumlah || parseFloat(jumlah) <= 0) {
        Swal.fire("Oops", "Pilih bahan dan isi jumlah yang benar.", "warning");
        return;
      }

      const { error } = await supabaseClient.from("product_ingredients").upsert(
        {
          product_id: parseInt(productId, 10),
          ingredient_id: parseInt(ingredientId, 10),
          quantity_used: parseFloat(jumlah),
        },
        { onConflict: "product_id,ingredient_id" },
      );

      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        document.getElementById("resepBahanSelect").value = "";
        document.getElementById("resepJumlahInput").value = "";
        loadResepUntukProduk(productId);
      }
    });

  window.hapusBahanResep = async (id) => {
    const productId = document.getElementById("resepProductSelect").value;
    const { error } = await supabaseClient
      .from("product_ingredients")
      .delete()
      .eq("id", id);

    if (error) {
      Swal.fire("Gagal!", error.message, "error");
    } else {
      loadResepUntukProduk(productId);
    }
  };

  // =========================================================
  // 11. PENGELUARAN OPERASIONAL (expenses)
  // =========================================================

  let daftarPengeluaranCache = [];

  async function loadExpenses() {
    const tbody = document.getElementById("expenseTableBody");
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Memuat data...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Gagal memuat pengeluaran:", error);
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Gagal memuat data.</td></tr>`;
      return;
    }

    daftarPengeluaranCache = data || [];

    if (daftarPengeluaranCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Belum ada pengeluaran tercatat.</td></tr>`;
      return;
    }

    tbody.innerHTML = daftarPengeluaranCache
      .map((e) => {
        const tgl = new Date(e.expense_date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 15px; color: #1a1a1a;">${tgl}</td>
          <td style="padding: 12px 15px; color: #1a1a1a;">${e.category}</td>
          <td style="padding: 12px 15px; color: #1a1a1a;">${e.description || "-"}</td>
          <td style="padding: 12px 15px; color: #1a1a1a; font-weight: 600;">Rp ${Number(e.amount).toLocaleString("id-ID")}</td>
          <td style="padding: 12px 15px; text-align: center;">
            <button onclick="deleteExpense(${e.id})" style="background:none; border:none; cursor:pointer; color:#dc3545;" title="Hapus">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    feather.replace();
  }
  window.loadExpenses = loadExpenses;

  document
    .getElementById("tambahPengeluaranBtn")
    .addEventListener("click", async () => {
      const { value: formValues } = await Swal.fire({
        title: "Tambah Pengeluaran",
        html:
          `<input id="swal-kategori" class="swal2-input" placeholder="Kategori (misal: Sewa, Gaji, Listrik)">` +
          `<input id="swal-ket" class="swal2-input" placeholder="Keterangan (opsional)">` +
          `<input id="swal-jumlah" type="number" step="0.01" class="swal2-input" placeholder="Jumlah (Rp)">` +
          `<input id="swal-tanggal" type="date" class="swal2-input" value="${new Date().toISOString().slice(0, 10)}">`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Tambah",
        cancelButtonText: "Batal",
        preConfirm: () => {
          const category = document
            .getElementById("swal-kategori")
            .value.trim();
          const description = document.getElementById("swal-ket").value.trim();
          const amount = document.getElementById("swal-jumlah").value;
          const date = document.getElementById("swal-tanggal").value;

          if (!category || !amount || !date) {
            Swal.showValidationMessage(
              "Kategori, jumlah, dan tanggal wajib diisi.",
            );
            return false;
          }

          return {
            category,
            description: description || null,
            amount: parseFloat(amount),
            expense_date: date,
          };
        },
      });

      if (!formValues) return;

      const { error } = await supabaseClient
        .from("expenses")
        .insert([formValues]);

      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        Swal.fire("Berhasil!", "Pengeluaran tersimpan.", "success");
        loadExpenses();
      }
    });

  window.deleteExpense = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Pengeluaran?",
      text: "Data ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      const { error } = await supabaseClient
        .from("expenses")
        .delete()
        .eq("id", id);
      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        Swal.fire("Terhapus!", "Pengeluaran telah dihapus.", "success");
        loadExpenses();
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
