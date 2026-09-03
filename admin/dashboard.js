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

  // 3a. Toggle sidebar di layar kecil (tombol hamburger)
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("menuButton");

  if (menuButton && sidebar) {
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("open");
    });

    // Tutup sidebar kalau area luar sidebar disentuh (mobile)
    document.addEventListener("click", (e) => {
      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        e.target !== menuButton
      ) {
        sidebar.classList.remove("open");
      }
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute("data-tab");

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Tutup sidebar otomatis setelah pilih menu (mobile)
      if (sidebar) sidebar.classList.remove("open");

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
        resetBadgePesanan();
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

  // 3b. Notifikasi Pesanan Baru (Real-time)
  const pesananBadge = document.getElementById("pesananBadge");
  let jumlahPesananBaru = 0;

  function bunyikanNotifikasi() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1175].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.16 + 0.35,
        );
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.16);
        osc.stop(ctx.currentTime + i * 0.16 + 0.35);
      });
    } catch (e) {
      console.warn("Tidak bisa memutar suara notifikasi:", e);
    }
  }

  function tampilkanBadgePesanan() {
    if (!pesananBadge) return;
    jumlahPesananBaru += 1;
    pesananBadge.innerText = jumlahPesananBaru;
    pesananBadge.style.display = "inline-block";
  }

  function resetBadgePesanan() {
    jumlahPesananBaru = 0;
    if (pesananBadge) pesananBadge.style.display = "none";
  }

  supabaseClient
    .channel("admin-orders-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => {
        bunyikanNotifikasi();

        const tabPesananAktif =
          document.getElementById("tab-pesanan")?.style.display === "block";

        if (tabPesananAktif) {
          resetBadgePesanan();
          loadOrders();
        } else {
          tampilkanBadgePesanan();
        }

        if (window.Swal) {
          const namaPembeli = payload.new?.customer_name || "Pelanggan";
          const totalPesanan = payload.new?.total
            ? "Rp " + Number(payload.new.total).toLocaleString("id-ID")
            : "";
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "Pesanan baru masuk!",
            text: `${namaPembeli} \u2014 ${totalPesanan}`,
            showConfirmButton: false,
            timer: 4500,
            timerProgressBar: true,
          });
        }
      },
    )
    .subscribe();

  // 4. Load Data Produk dari Supabase
  // Daftar kategori menu yang dipakai di form Tambah/Edit & filter
  const DAFTAR_KATEGORI = ["Espresso Base", "Manual Brew", "Other", "Snack"];

  async function loadProducts() {
    const tbody = document.getElementById("productTableBody");
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Gagal memuat produk:", error);
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding: 20px;">Gagal memuat data menu.</td></tr>`;
      return;
    }

    document.getElementById("totalProductsCount").innerText = products.length;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #888;">Belum ada menu yang ditambahkan.</td></tr>`;
      return;
    }

    tbody.innerHTML = products
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 15px;">
          <img src="../img/products/${item.image || "default.jpg"}" alt="${item.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" onerror="this.src='https://via.placeholder.com/45'">
        </td>
        <td style="padding: 12px 15px; font-weight: 600; color: #1a1a1a;">${item.name}${
          item.variant_label
            ? ` <span style="font-weight:500; font-size:0.75rem; padding:2px 6px; border-radius:4px; background:#eef2ff; color:#3b4ed6;">${item.variant_label}</span>`
            : ""
        }</td>
        <td style="padding: 12px 15px;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; background:#f1eee9; color:#6b5a44;">${item.category || "Other"}</span>
        </td>
        <td style="padding: 12px 15px; color: #666; font-size: 0.85rem; max-width: 200px;">${item.description || "-"}</td>
        <td style="padding: 12px 15px; font-weight: 500; color: #1a1a1a;">Rp ${Number(item.price).toLocaleString("id-ID")}</td>
        <td style="padding: 12px 15px;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; ${item.is_active ? "background: #e6f4ea; color: #1e7e34;" : "background: #fbeae8; color: #d93025;"}">
            ${item.is_active ? "Tersedia" : "Nonaktif"}
          </span>
        </td>
        <td style="padding: 12px 15px; text-align: center;">
          <button onclick="editProduct(${item.id}, '${item.name}', '${item.description || ""}', ${item.price}, ${item.is_active}, ${item.variant_group ? `'${item.variant_group}'` : "null"}, ${item.variant_label ? `'${item.variant_label}'` : "null"}, '${item.category || "Other"}')" style="background: none; border: none; cursor: pointer; color: #007bff; margin-right: 8px;" title="Edit">
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
            ${order.payment_method ? `<div style="font-size:0.75rem; color:#666; margin-top:3px;">via ${order.payment_method}</div>` : ""}
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
    const newPaymentStatus = isCurrentlyPaid ? "Belum Bayar" : "Sudah Bayar";

    const { error } = await supabaseClient
      .from("orders")
      .update({ payment_status: newPaymentStatus })
      .eq("id", id);

    if (error) {
      Swal.fire("Gagal!", error.message, "error");
      loadOrders();
      return;
    }

    // Begitu pembayaran dikonfirmasi (Belum Bayar -> Sudah Bayar),
    // status pesanan otomatis ikut maju dari "Pesanan Baru" ke
    // "Diproses" -- tapi HANYA kalau statusnya masih "Pesanan Baru"
    // (tidak menimpa "Selesai" atau "Dibatalkan").
    if (newPaymentStatus === "Sudah Bayar") {
      const { data: orderSaatIni } = await supabaseClient
        .from("orders")
        .select("order_status")
        .eq("id", id)
        .single();

      if (orderSaatIni?.order_status === "Pesanan Baru") {
        await supabaseClient
          .from("orders")
          .update({ order_status: "Diproses" })
          .eq("id", id);
      }
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

    // ---------- Data untuk HPP & Pengeluaran (dipakai di Bulanan & Untung/Rugi) ----------
    // Skema baru: recipes (product_id) -> recipe_items (ingredient_id, quantity_used)
    // Biaya per satuan resep = cost_per_unit (harga per satuan besar) / conversion_factor
    const { data: resepData, error: resepError } = await supabaseClient
      .from("recipe_items")
      .select(
        "quantity_used, recipes(product_id), ingredients(cost_per_unit, conversion_factor)",
      );

    const hppPerProduk = {};
    if (!resepError && resepData) {
      resepData.forEach((r) => {
        const productId = r.recipes?.product_id;
        if (!productId) return;
        const biayaPerSatuanResep =
          Number(r.ingredients?.cost_per_unit || 0) /
          Number(r.ingredients?.conversion_factor || 1);
        const biaya = Number(r.quantity_used) * biayaPerSatuanResep;
        hppPerProduk[productId] = (hppPerProduk[productId] || 0) + biaya;
      });
    } else if (resepError) {
      console.error("Gagal memuat resep untuk HPP:", resepError);
    }

    function hitungHppPesanan(order) {
      if (!Array.isArray(order.items)) return 0;
      return order.items.reduce((sum, it) => {
        const hppSatuan = hppPerProduk[it.product_id] || 0;
        return sum + hppSatuan * (Number(it.quantity) || 0);
      }, 0);
    }

    const { data: expenseData, error: expenseError } = await supabaseClient
      .from("expenses")
      .select("amount, expense_date");

    if (expenseError) {
      console.error("Gagal memuat pengeluaran:", expenseError);
    }

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
        hpp: 0,
        pengeluaran: 0,
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
          baris.hpp += hitungHppPesanan(order);
        }
      }
    });

    if (!expenseError && expenseData) {
      expenseData.forEach((exp) => {
        if (!exp.expense_date) return;
        const tglExp = new Date(exp.expense_date);
        const kunciExp = `${tglExp.getFullYear()}-${String(tglExp.getMonth() + 1).padStart(2, "0")}`;
        const baris = rekapBulanan.find((r) => r.kunci === kunciExp);
        if (baris) {
          baris.pengeluaran += Number(exp.amount) || 0;
        }
      });
    }

    elBulanan.innerHTML = rekapBulanan
      .map((r) => {
        const labaKotor = r.pendapatan - r.hpp;
        const labaBersih = labaKotor - r.pengeluaran;
        const margin = r.pendapatan > 0 ? (labaBersih / r.pendapatan) * 100 : 0;
        const warnaLaba = labaBersih >= 0 ? "#1e7e34" : "#d93025";
        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.label}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${r.pendapatan.toLocaleString("id-ID")}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.jumlahPesanan}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${r.hpp.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${labaKotor.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${r.pengeluaran.toLocaleString("id-ID")}</td>
          <td style="padding: 10px 15px; color: ${warnaLaba}; font-weight: 600;">Rp ${labaBersih.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</td>
          <td style="padding: 10px 15px; color: ${warnaLaba};">${margin.toFixed(1)}%</td>
        </tr>
      `;
      })
      .join("");

    // ---------- Untung / Rugi ----------
    const elUrPendapatan = document.getElementById("urPendapatan");
    const elUrHpp = document.getElementById("urHpp");
    const elUrPengeluaran = document.getElementById("urPengeluaran");
    const elUrLabaRugi = document.getElementById("urLabaRugi");

    // Hitung total HPP dari semua pesanan yang SUDAH BAYAR
    // (pakai hppPerProduk yang sudah diambil di atas)
    let totalHppTerpakai = 0;
    orders.forEach((order) => {
      if (order.payment_status !== "Sudah Bayar") return;
      totalHppTerpakai += hitungHppPesanan(order);
    });

    // Total pengeluaran operasional lain (pakai expenseData yang sudah diambil di atas)
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
          '<input id="swal-name" class="swal2-input" placeholder="Nama Menu (misal: Kopi Tubruk)">' +
          '<input id="swal-desc" class="swal2-input" placeholder="Deskripsi Singkat">' +
          '<input id="swal-price" type="number" class="swal2-input" placeholder="Harga (misal: 18000)">' +
          '<input id="swal-image" class="swal2-input" placeholder="Nama file di folder img/products/ (misal: v60.jpg)">' +
          `<select id="swal-category" class="swal2-input">${DAFTAR_KATEGORI.map((k) => `<option value="${k}">${k}</option>`).join("")}</select>` +
          '<hr style="margin:14px 0 8px;">' +
          '<p style="text-align:left; font-size:0.78rem; color:#888; margin:0 0 8px;">Opsional: isi 2 kolom di bawah kalau menu ini punya varian (misal Hot/Ice). Menu dengan Grup Varian yang SAMA akan tampil jadi satu kartu dengan tombol pilihan di site customer.</p>' +
          '<input id="swal-variant-group" class="swal2-input" placeholder="Grup Varian (misal: kopi-tubruk) - kosongkan jika tanpa varian">' +
          '<input id="swal-variant-label" class="swal2-input" placeholder="Label Varian (misal: Hot / Ice)">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        cancelButtonText: "Batal",
        preConfirm: () => {
          const name = document.getElementById("swal-name").value;
          const description = document.getElementById("swal-desc").value;
          const price = document.getElementById("swal-price").value;
          const image = document.getElementById("swal-image").value;
          const category = document.getElementById("swal-category").value;
          const variantGroup = document
            .getElementById("swal-variant-group")
            .value.trim();
          const variantLabel = document
            .getElementById("swal-variant-label")
            .value.trim();

          if (!name || !price) {
            Swal.showValidationMessage("Nama menu dan harga wajib diisi!");
            return false;
          }
          if (
            (variantGroup && !variantLabel) ||
            (!variantGroup && variantLabel)
          ) {
            Swal.showValidationMessage(
              "Grup Varian dan Label Varian harus diisi berdua, atau dikosongkan berdua.",
            );
            return false;
          }
          return {
            name,
            description,
            price: parseFloat(price),
            image,
            category,
            variant_group: variantGroup || null,
            variant_label: variantLabel || null,
          };
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
  window.editProduct = async (
    id,
    name,
    description,
    price,
    isActive,
    variantGroup,
    variantLabel,
    category,
  ) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Menu & Harga",
      html:
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Nama Menu:</label>` +
        `<input id="swal-edit-name" class="swal2-input" value="${name}">` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Kategori:</label>` +
        `<select id="swal-edit-category" class="swal2-input">${DAFTAR_KATEGORI.map((k) => `<option value="${k}" ${category === k ? "selected" : ""}>${k}</option>`).join("")}</select>` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Deskripsi:</label>` +
        `<input id="swal-edit-desc" class="swal2-input" value="${description}">` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Harga (Rp):</label>` +
        `<input id="swal-edit-price" type="number" class="swal2-input" value="${price}">` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Status Ketersediaan:</label>` +
        `<select id="swal-edit-status" class="swal2-input">` +
        `<option value="true" ${isActive ? "selected" : ""}>Tersedia</option>` +
        `<option value="false" ${!isActive ? "selected" : ""}>Nonaktif / Habis</option>` +
        `</select>` +
        `<hr style="margin:14px 0 8px;">` +
        `<p style="text-align:left; font-size:0.78rem; color:#888; margin:0 0 8px;">Opsional: isi kalau menu ini punya varian (misal Hot/Ice). Menu dengan Grup Varian yang SAMA tampil jadi satu kartu di site customer.</p>` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:6px;">Grup Varian:</label>` +
        `<input id="swal-edit-variant-group" class="swal2-input" placeholder="misal: kopi-tubruk" value="${variantGroup || ""}">` +
        `<label style="display:block; text-align:left; font-size:0.8rem; margin-top:10px;">Label Varian:</label>` +
        `<input id="swal-edit-variant-label" class="swal2-input" placeholder="misal: Hot / Ice" value="${variantLabel || ""}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Perbarui",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const variantGroupVal = document
          .getElementById("swal-edit-variant-group")
          .value.trim();
        const variantLabelVal = document
          .getElementById("swal-edit-variant-label")
          .value.trim();

        if (
          (variantGroupVal && !variantLabelVal) ||
          (!variantGroupVal && variantLabelVal)
        ) {
          Swal.showValidationMessage(
            "Grup Varian dan Label Varian harus diisi berdua, atau dikosongkan berdua.",
          );
          return false;
        }

        return {
          name: document.getElementById("swal-edit-name").value,
          description: document.getElementById("swal-edit-desc").value,
          price: parseFloat(document.getElementById("swal-edit-price").value),
          is_active:
            document.getElementById("swal-edit-status").value === "true",
          category: document.getElementById("swal-edit-category").value,
          variant_group: variantGroupVal || null,
          variant_label: variantLabelVal || null,
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
  // 9. BAHAN BAKU (ingredients) + PEMBELIAN (ingredient_purchases)
  // =========================================================

  let daftarBahanCache = [];

  async function loadIngredients() {
    const tbody = document.getElementById("ingredientTableBody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">Memuat data...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Gagal memuat bahan baku:", error);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Gagal memuat data.</td></tr>`;
      return;
    }

    daftarBahanCache = data || [];

    if (daftarBahanCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">Belum ada bahan baku. Klik "+ Tambah Bahan".</td></tr>`;
    } else {
      tbody.innerHTML = daftarBahanCache
        .map((b) => {
          const stokRendah =
            Number(b.stock_quantity) <= Number(b.low_stock_threshold || 0);
          return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 15px; color: #1a1a1a; font-weight: 600;">${b.name}</td>
            <td style="padding: 12px 15px; color: ${stokRendah ? "#d93025; font-weight:700;" : "#1a1a1a;"}">
              ${Number(b.stock_quantity).toLocaleString("id-ID")} ${b.unit}
              ${stokRendah ? ' <span title="Stok menipis">⚠️</span>' : ""}
            </td>
            <td style="padding: 12px 15px; color: #1a1a1a;">Rp ${Number(b.cost_per_unit).toLocaleString("id-ID")}/${b.unit}</td>
            <td style="padding: 12px 15px; color: #1a1a1a;">${b.recipe_unit}</td>
            <td style="padding: 12px 15px; color: #1a1a1a;">1 ${b.unit} = ${Number(b.conversion_factor).toLocaleString("id-ID")} ${b.recipe_unit}</td>
            <td style="padding: 12px 15px; text-align: center; white-space: nowrap;">
              <button onclick="bukaFormBeli(${b.id})" style="background:none; border:none; cursor:pointer; color:#1e7e34;" title="Beli / Tambah Stok">
                <i data-feather="plus-circle"></i>
              </button>
              <button onclick="editIngredient(${b.id})" style="background:none; border:none; cursor:pointer; color:#007bff;" title="Edit">
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
    }

    feather.replace();
    loadPurchaseHistory();
  }
  window.loadIngredients = loadIngredients;

  async function loadPurchaseHistory() {
    const tbody = document.getElementById("purchaseTableBody");
    if (!tbody) return;

    const { data, error } = await supabaseClient
      .from("ingredient_purchases")
      .select(
        "id, purchase_date, quantity, total_price, unit_price, ingredients(name, unit)",
      )
      .order("purchase_date", { ascending: false })
      .limit(20);

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Gagal memuat riwayat.</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Belum ada pembelian tercatat.</td></tr>`;
      return;
    }

    tbody.innerHTML = data
      .map((p) => {
        const tgl = new Date(p.purchase_date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 15px; color: #1a1a1a;">${tgl}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">${p.ingredients?.name || "-"}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">${p.quantity} ${p.ingredients?.unit || ""}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${Number(p.total_price).toLocaleString("id-ID")}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${Number(p.unit_price).toLocaleString("id-ID")}/${p.ingredients?.unit || ""}</td>
        </tr>
      `;
      })
      .join("");
  }

  async function bukaFormBahan(existing) {
    const { value: formValues } = await Swal.fire({
      title: existing ? "Edit Bahan Baku" : "Tambah Bahan Baku",
      html:
        `<input id="swal-nama" class="swal2-input" placeholder="Nama bahan (misal: Bubuk Kopi)" value="${existing ? existing.name : ""}">` +
        `<input id="swal-satuan" class="swal2-input" placeholder="Satuan besar/stok (misal: kg, L, pcs)" value="${existing ? existing.unit : ""}">` +
        `<input id="swal-satuan-resep" class="swal2-input" placeholder="Satuan resep (misal: gram, ml, pcs)" value="${existing ? existing.recipe_unit : ""}">` +
        `<input id="swal-konversi" type="number" step="0.0001" class="swal2-input" placeholder="1 satuan besar = berapa satuan resep? (misal 1000)" value="${existing ? existing.conversion_factor : "1000"}">` +
        `<input id="swal-stok" type="number" step="0.01" class="swal2-input" placeholder="Stok saat ini (satuan besar)" value="${existing ? existing.stock_quantity : ""}">` +
        `<input id="swal-harga" type="number" step="0.01" class="swal2-input" placeholder="Harga per satuan besar (Rp)" value="${existing ? existing.cost_per_unit : ""}">` +
        `<input id="swal-batas" type="number" step="0.01" class="swal2-input" placeholder="Batas stok menipis, satuan besar (opsional)" value="${existing ? existing.low_stock_threshold : ""}">` +
        `<p style="font-size:0.8rem; color:#888; text-align:left; margin-top:4px;">Contoh umum: kg → gram (1000), L → ml (1000), pcs → pcs (1).</p>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: existing ? "Simpan" : "Tambah",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const name = document.getElementById("swal-nama").value.trim();
        const unit = document.getElementById("swal-satuan").value.trim();
        const recipeUnit = document
          .getElementById("swal-satuan-resep")
          .value.trim();
        const factor = document.getElementById("swal-konversi").value;
        const stock = document.getElementById("swal-stok").value;
        const cost = document.getElementById("swal-harga").value;
        const threshold = document.getElementById("swal-batas").value;

        if (
          !name ||
          !unit ||
          !recipeUnit ||
          !factor ||
          stock === "" ||
          cost === ""
        ) {
          Swal.showValidationMessage(
            "Nama, satuan besar, satuan resep, konversi, stok, dan harga wajib diisi.",
          );
          return false;
        }

        return {
          name,
          unit,
          recipe_unit: recipeUnit,
          conversion_factor: parseFloat(factor),
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

  // Form: catat pembelian bahan (otomatis nambah stok + update harga terbaru)
  window.bukaFormBeli = async (ingredientId) => {
    const bahan = daftarBahanCache.find((b) => b.id === ingredientId);
    if (!bahan) return;

    const { value: formValues } = await Swal.fire({
      title: `Beli: ${bahan.name}`,
      html:
        `<p style="text-align:left; font-size:0.85rem; color:#666;">Stok saat ini: ${bahan.stock_quantity} ${bahan.unit}</p>` +
        `<input id="swal-tanggal" type="date" class="swal2-input" value="${new Date().toISOString().slice(0, 10)}">` +
        `<input id="swal-qty" type="number" step="0.01" class="swal2-input" placeholder="Jumlah dibeli (${bahan.unit})">` +
        `<input id="swal-total" type="number" step="0.01" class="swal2-input" placeholder="Total harga dibayar (Rp)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan Pembelian",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const date = document.getElementById("swal-tanggal").value;
        const qty = document.getElementById("swal-qty").value;
        const total = document.getElementById("swal-total").value;

        if (
          !date ||
          !qty ||
          parseFloat(qty) <= 0 ||
          !total ||
          parseFloat(total) <= 0
        ) {
          Swal.showValidationMessage(
            "Tanggal, jumlah, dan total harga wajib diisi dengan benar.",
          );
          return false;
        }

        return {
          purchase_date: date,
          quantity: parseFloat(qty),
          total_price: parseFloat(total),
          unit_price: parseFloat(total) / parseFloat(qty),
        };
      },
    });

    if (!formValues) return;

    const { error } = await supabaseClient.from("ingredient_purchases").insert([
      {
        ingredient_id: ingredientId,
        ...formValues,
      },
    ]);

    if (error) {
      Swal.fire("Gagal!", error.message, "error");
    } else {
      Swal.fire(
        "Berhasil!",
        `Stok ${bahan.name} bertambah ${formValues.quantity} ${bahan.unit}.`,
        "success",
      );
      loadIngredients();
    }
  };

  // =========================================================
  // 10. RESEP MENU (recipes & recipe_items)
  // =========================================================

  let daftarBahanUntukResep = [];
  let recipeIdAktif = null; // recipe_id untuk produk yang sedang dipilih

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

    const { data: bahan } = await supabaseClient
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });
    daftarBahanUntukResep = bahan || [];

    const bahanSelect = document.getElementById("resepBahanSelect");
    bahanSelect.innerHTML =
      `<option value="">-- Pilih bahan --</option>` +
      daftarBahanUntukResep
        .map(
          (b) =>
            `<option value="${b.id}">${b.name} (${b.recipe_unit})</option>`,
        )
        .join("");

    document.getElementById("resepContainer").style.display = "none";
    recipeIdAktif = null;
  }
  window.loadResepSelector = loadResepSelector;

  // Pastikan produk sudah punya baris di tabel recipes, kembalikan recipe_id-nya
  async function pastikanRecipeAda(productId) {
    const { data: existing } = await supabaseClient
      .from("recipes")
      .select("id")
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabaseClient
      .from("recipes")
      .insert([{ product_id: productId }])
      .select("id")
      .single();

    if (error) {
      console.error("Gagal membuat resep:", error);
      return null;
    }

    return created.id;
  }

  async function loadResepUntukProduk(productId) {
    const container = document.getElementById("resepContainer");
    const tbody = document.getElementById("resepTableBody");
    const totalEl = document.getElementById("resepTotalHpp");
    const jumlahLabel = document.getElementById("resepJumlahLabel");

    if (!productId) {
      container.style.display = "none";
      recipeIdAktif = null;
      return;
    }

    container.style.display = "block";
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">Memuat...</td></tr>`;

    recipeIdAktif = await pastikanRecipeAda(productId);

    if (!recipeIdAktif) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:15px;">Gagal menyiapkan resep untuk menu ini.</td></tr>`;
      return;
    }

    const { data, error } = await supabaseClient
      .from("recipe_items")
      .select(
        "id, quantity_used, ingredients(id, name, unit, recipe_unit, conversion_factor, cost_per_unit)",
      )
      .eq("recipe_id", recipeIdAktif);

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
        const ing = r.ingredients;
        // biaya per satuan resep = harga per satuan besar / faktor konversi
        const biayaPerSatuanResep =
          Number(ing.cost_per_unit) / Number(ing.conversion_factor || 1);
        const biaya = Number(r.quantity_used) * biayaPerSatuanResep;
        totalHpp += biaya;
        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 15px; color: #1a1a1a;">${ing.name}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">${r.quantity_used} ${ing.recipe_unit}</td>
          <td style="padding: 10px 15px; color: #1a1a1a;">Rp ${biaya.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</td>
          <td style="padding: 10px 15px; text-align: center;">
            <button onclick="hapusBahanResep(${r.id})" style="background:none; border:none; cursor:pointer; color:#dc3545;" title="Hapus">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    totalEl.textContent =
      "Rp " + totalHpp.toLocaleString("id-ID", { maximumFractionDigits: 0 });
    feather.replace();
  }

  document
    .getElementById("resepProductSelect")
    .addEventListener("change", (e) => {
      loadResepUntukProduk(e.target.value);
    });

  document
    .getElementById("resepBahanSelect")
    .addEventListener("change", (e) => {
      const bahan = daftarBahanUntukResep.find(
        (b) => String(b.id) === e.target.value,
      );
      const label = document.getElementById("resepJumlahLabel");
      label.textContent = bahan
        ? `Jumlah (${bahan.recipe_unit})`
        : "Jumlah (satuan resep)";
    });

  document
    .getElementById("resepTambahBtn")
    .addEventListener("click", async () => {
      const productId = document.getElementById("resepProductSelect").value;
      const ingredientId = document.getElementById("resepBahanSelect").value;
      const jumlah = document.getElementById("resepJumlahInput").value;

      if (!productId || !recipeIdAktif) {
        Swal.fire("Oops", "Pilih menu terlebih dahulu.", "warning");
        return;
      }
      if (!ingredientId || !jumlah || parseFloat(jumlah) <= 0) {
        Swal.fire("Oops", "Pilih bahan dan isi jumlah yang benar.", "warning");
        return;
      }

      const { error } = await supabaseClient.from("recipe_items").upsert(
        {
          recipe_id: recipeIdAktif,
          ingredient_id: parseInt(ingredientId, 10),
          quantity_used: parseFloat(jumlah),
        },
        { onConflict: "recipe_id,ingredient_id" },
      );

      if (error) {
        Swal.fire("Gagal!", error.message, "error");
      } else {
        document.getElementById("resepBahanSelect").value = "";
        document.getElementById("resepJumlahInput").value = "";
        document.getElementById("resepJumlahLabel").textContent =
          "Jumlah (satuan resep)";
        loadResepUntukProduk(productId);
      }
    });

  window.hapusBahanResep = async (id) => {
    const productId = document.getElementById("resepProductSelect").value;
    const { error } = await supabaseClient
      .from("recipe_items")
      .delete()
      .eq("id", id);

    if (error) {
      Swal.fire("Gagal!", error.message, "error");
    } else {
      loadResepUntukProduk(productId);
    }
  };

  // =========================================================
  // 11. PENGELUARAN OPERASIONAL (expenses + expense_categories)
  // =========================================================

  let daftarPengeluaranCache = [];
  let daftarKategoriCache = [];

  async function loadExpenseCategories() {
    const { data, error } = await supabaseClient
      .from("expense_categories")
      .select("*")
      .order("name", { ascending: true });

    if (!error) {
      daftarKategoriCache = data || [];
    }
    return daftarKategoriCache;
  }

  async function loadExpenses() {
    const tbody = document.getElementById("expenseTableBody");
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Memuat data...</td></tr>`;

    await loadExpenseCategories();

    const { data, error } = await supabaseClient
      .from("expenses")
      .select("id, description, amount, expense_date, expense_categories(name)")
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
          <td style="padding: 12px 15px; color: #1a1a1a;">${e.expense_categories?.name || "-"}</td>
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
      await loadExpenseCategories();

      if (daftarKategoriCache.length === 0) {
        Swal.fire(
          "Belum ada kategori",
          "Tambah kategori pengeluaran dulu lewat tombol 'Kelola Kategori'.",
          "info",
        );
        return;
      }

      const optionsHtml = daftarKategoriCache
        .map((k) => `<option value="${k.id}">${k.name}</option>`)
        .join("");

      const { value: formValues } = await Swal.fire({
        title: "Tambah Pengeluaran",
        html:
          `<select id="swal-kategori" class="swal2-input">${optionsHtml}</select>` +
          `<input id="swal-ket" class="swal2-input" placeholder="Keterangan (opsional)">` +
          `<input id="swal-jumlah" type="number" step="0.01" class="swal2-input" placeholder="Jumlah (Rp)">` +
          `<input id="swal-tanggal" type="date" class="swal2-input" value="${new Date().toISOString().slice(0, 10)}">`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Tambah",
        cancelButtonText: "Batal",
        preConfirm: () => {
          const categoryId = document.getElementById("swal-kategori").value;
          const description = document.getElementById("swal-ket").value.trim();
          const amount = document.getElementById("swal-jumlah").value;
          const date = document.getElementById("swal-tanggal").value;

          if (!categoryId || !amount || !date) {
            Swal.showValidationMessage(
              "Kategori, jumlah, dan tanggal wajib diisi.",
            );
            return false;
          }

          return {
            category_id: parseInt(categoryId, 10),
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

  // Kelola kategori pengeluaran (tambah/hapus)
  document
    .getElementById("kelolaKategoriBtn")
    .addEventListener("click", async () => {
      await loadExpenseCategories();

      async function renderDaftarKategori() {
        const listHtml = daftarKategoriCache
          .map(
            (k) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
              <span>${k.name}</span>
              <button data-hapus-kategori="${k.id}" style="background:none; border:none; color:#dc3545; cursor:pointer;">Hapus</button>
            </div>
          `,
          )
          .join("");

        const { value: namaBaru } = await Swal.fire({
          title: "Kelola Kategori Pengeluaran",
          html:
            `<div style="text-align:left; max-height:200px; overflow-y:auto; margin-bottom:15px;">${listHtml || '<p style="color:#888;">Belum ada kategori.</p>'}</div>` +
            `<input id="swal-kategori-baru" class="swal2-input" placeholder="Nama kategori baru">`,
          showCancelButton: true,
          confirmButtonText: "Tambah Kategori",
          cancelButtonText: "Tutup",
          didOpen: () => {
            document
              .querySelectorAll("[data-hapus-kategori]")
              .forEach((btn) => {
                btn.addEventListener("click", async () => {
                  const id = btn.getAttribute("data-hapus-kategori");
                  const { error } = await supabaseClient
                    .from("expense_categories")
                    .delete()
                    .eq("id", id);
                  if (error) {
                    Swal.showValidationMessage(
                      "Gagal hapus (mungkin masih dipakai di pengeluaran lain): " +
                        error.message,
                    );
                  } else {
                    await loadExpenseCategories();
                    Swal.close();
                    renderDaftarKategori();
                  }
                });
              });
          },
          preConfirm: () => {
            const nama = document
              .getElementById("swal-kategori-baru")
              .value.trim();
            if (!nama) {
              Swal.showValidationMessage("Isi nama kategori baru.");
              return false;
            }
            return nama;
          },
        });

        if (namaBaru) {
          const { error } = await supabaseClient
            .from("expense_categories")
            .insert([{ name: namaBaru }]);

          if (error) {
            Swal.fire("Gagal!", error.message, "error");
          } else {
            await loadExpenseCategories();
            renderDaftarKategori();
          }
        }
      }

      renderDaftarKategori();
    });

  // 8. Logout Handling
  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "../index.html";
    });
});
