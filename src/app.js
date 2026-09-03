document.addEventListener("alpine:init", () => {
  Alpine.data("products", () => ({
    items: [],
    displayedItems: [],
    loading: true,
    loadError: false,
    activeCategory: "Semua",
    searchQuery: "",
    kategoriList: ["Semua", "Espresso Base", "Manual Brew", "Other", "Snack"],

    async init() {
      await this.loadProducts();
      this.$nextTick(() => {
        feather.replace();
      });
    },

    setCategory(kategori) {
      this.activeCategory = kategori;
      this.applyFilters();
    },

    // Gabungan filter kategori + pencarian nama menu.
    // Dipanggil tiap kali kategori diganti ATAU kotak search diketik.
    applyFilters() {
      const kataKunci = this.searchQuery.trim().toLowerCase();

      this.displayedItems = this.items.filter((item) => {
        const cocokKategori =
          this.activeCategory === "Semua" ||
          item.category === this.activeCategory;

        if (!cocokKategori) return false;
        if (!kataKunci) return true;

        // Cocokkan ke nama menu utama, DAN ke nama tiap varian
        // (mis. cari "ice" akan menemukan "Kopi Tubruk (Ice)")
        const cocokNamaUtama = item.name.toLowerCase().includes(kataKunci);
        const cocokVarian =
          Array.isArray(item.variants) &&
          item.variants.some((v) => v.name.toLowerCase().includes(kataKunci));

        return cocokNamaUtama || cocokVarian;
      });

      this.$nextTick(() => {
        feather.replace();
        setTimeout(() => feather.replace(), 100);
      });
    },

    async loadProducts() {
      this.loading = true;
      this.loadError = false;

      const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (error) {
        console.error("Gagal memuat produk:", error);
        this.loadError = true;
        this.loading = false;
        return;
      }

      // Ambil ringkasan rating (rata-rata bintang + jumlah ulasan) per menu
      const { data: ratingData } = await supabaseClient
        .from("product_rating_summary")
        .select("product_id, avg_rating, review_count");

      const ratingMap = {};
      (ratingData || []).forEach((r) => {
        ratingMap[r.product_id] = {
          avgRating: Number(r.avg_rating) || 0,
          reviewCount: Number(r.review_count) || 0,
        };
      });

      // Samakan nama kolom dari database (image, description)
      // dengan nama field yang dipakai template (img, desc)
      const mapped = data.map((item) => ({
        id: item.id,
        name: item.name,
        img: item.image,
        price: item.price,
        desc: item.description,
        category: item.category || "Other",
        variantGroup: item.variant_group || null,
        variantLabel: item.variant_label || null,
        avgRating: ratingMap[item.id]?.avgRating || 0,
        reviewCount: ratingMap[item.id]?.reviewCount || 0,
      }));

      // Kelompokkan menu yang punya variant_group yang sama
      // (mis. "Kopi Tubruk" Hot & Ice) jadi satu kartu dengan
      // beberapa pilihan varian. Menu tanpa variant_group tetap
      // tampil seperti biasa (satu kartu, satu pilihan).
      const groups = [];
      const groupIndexByKey = {};

      mapped.forEach((item) => {
        if (!item.variantGroup) {
          groups.push({
            id: item.id,
            name: item.name,
            img: item.img,
            desc: item.desc,
            price: item.price,
            category: item.category,
            avgRating: item.avgRating,
            reviewCount: item.reviewCount,
            variants: null, // tanpa varian
            // properti ini dipakai saat langsung add-to-cart (tanpa pilih varian)
          });
          return;
        }

        if (groupIndexByKey[item.variantGroup] === undefined) {
          groupIndexByKey[item.variantGroup] = groups.length;
          groups.push({
            id: item.id, // default: varian pertama
            name: item.name,
            img: item.img,
            desc: item.desc,
            price: item.price,
            category: item.category,
            avgRating: item.avgRating,
            reviewCount: item.reviewCount,
            variants: [],
          });
        }

        const g = groups[groupIndexByKey[item.variantGroup]];
        g.variants.push({
          id: item.id,
          label: item.variantLabel,
          price: item.price,
          name: `${item.name} (${item.variantLabel})`,
          img: item.img,
          desc: item.desc,
          avgRating: item.avgRating,
          reviewCount: item.reviewCount,
        });
      });

      this.items = groups;
      this.applyFilters();

      this.loading = false;
      this.$nextTick(() => {
        feather.replace();
        setTimeout(() => feather.replace(), 100);
      });
    },

    // Menu dengan varian: yang aktif dipilih di kartu / modal
    selectVariant(item, variant) {
      item.selectedVariantId = variant.id;
    },

    // Ambil data produk sesuai varian yang sedang dipilih (atau produk itu sendiri kalau tanpa varian)
    activeVariant(item) {
      if (!item.variants) return item;
      const chosen =
        item.variants.find((v) => v.id === item.selectedVariantId) ||
        item.variants[0];
      return { ...chosen };
    },

    showDetail(item) {
      this.currentItem = item;
      const modal = document.querySelector("#item-detail-modal");
      modal.style.display = "flex";
      // Panggil lagi agar ikon di dalam modal juga muncul
      this.$nextTick(() => {
        feather.replace();
        setTimeout(() => feather.replace(), 100);
      });
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
        this.items.push({
          ...newItem,
          quantity: 1,
          total: newItem.price,
          notes: "",
        });
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

    setNote(id, text) {
      const cartItem = this.items.find((item) => item.id === id);
      if (cartItem) cartItem.notes = text;
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
