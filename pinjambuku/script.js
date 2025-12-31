// ============================================
// BURGER MENU - Mobile Navigation
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const burgerMenu = document.getElementById("burgerMenu");
  const navLinks = document.querySelector(".nav-links");

  if (burgerMenu) {
    // Toggle burger menu
    burgerMenu.addEventListener("click", function () {
      burgerMenu.classList.toggle("active");
      navLinks.classList.toggle("active");
    });

    // Close menu when clicking on a link
    const navLinksElements = navLinks.querySelectorAll(".nav-link");
    navLinksElements.forEach((link) => {
      link.addEventListener("click", function () {
        burgerMenu.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
      const isClickInsideNav = navLinks.contains(event.target);
      const isClickInsideBurger = burgerMenu.contains(event.target);

      if (!isClickInsideNav && !isClickInsideBurger) {
        burgerMenu.classList.remove("active");
        navLinks.classList.remove("active");
      }
    });
  }
});

// OpenLibrary API - Gratis, tidak perlu API key!
const BOOKS_API_URL = "https://openlibrary.org/search.json";
// Google Books API untuk enrichment
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = "AIzaSyA0KR2gj5dujlY8OMlqF833PgrYW8gnjI8";

// Data yang disimpan di localStorage
let borrowedBooks = JSON.parse(localStorage.getItem("borrowedBooks")) || [];

/**
 * Hero Slider Class
 */
class HeroSlider {
  constructor(options = {}) {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll(".hero-slide");
    this.dots = document.querySelectorAll(".hero-dots .dot");
    this.prevBtn = document.querySelector(".hero-arrow.prev");
    this.nextBtn = document.querySelector(".hero-arrow.next");

    this.totalSlides = this.slides.length - 1; // -1 karena slide terakhir adalah clone
    this.autoplayInterval = null;
    this.autoplayDelay = options.autoplayDelay || 6000;
    this.transitionDuration = options.transitionDuration || 800;
    this.autoplay = options.autoplay !== false;
    this.isTransitioning = false;

    if (this.totalSlides > 0) {
      this.init();
    }
  }

  init() {
    // Event listeners untuk buttons
    this.prevBtn?.addEventListener("click", () => this.prevSlide());
    this.nextBtn?.addEventListener("click", () => this.nextSlide());

    // Event listeners untuk dots
    this.dots.forEach((dot, index) => {
      dot.addEventListener("click", () => this.goToSlide(index));
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.prevSlide();
      if (e.key === "ArrowRight") this.nextSlide();
    });

    // Start autoplay
    if (this.autoplay) {
      this.startAutoplay();
    }

    // Pause autoplay on hover
    const heroSection = document.querySelector(".hero");
    heroSection?.addEventListener("mouseenter", () => {
      this.stopAutoplay();
    });

    heroSection?.addEventListener("mouseleave", () => {
      if (this.autoplay) {
        this.startAutoplay();
      }
    });
  }

  goToSlide(index) {
    if (this.isTransitioning) return;
    if (
      index === this.currentSlide ||
      index < 0 ||
      index >= this.slides.length
    ) {
      return;
    }

    this.isTransitioning = true;

    // Position slides dengan transform translateX based on index
    this.slides.forEach((slide, i) => {
      slide.classList.remove("active", "prev");

      if (i === index) {
        // Slide saat ini - tampil di tengah
        slide.classList.add("active");
      } else if (i < index) {
        // Slide sebelumnya - posisi di luar kiri
        slide.classList.add("prev");
      }
      // Slide setelahnya - default posisi di luar kanan (no class needed)
    });

    // Update dots - wrapping untuk seamless loop
    const dotIndex = index % this.totalSlides;
    this.dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === dotIndex);
    });

    // Set current slide
    this.currentSlide = index;

    // Jika sedang di clone slide (index = slides.length - 1), seamless jump ke slide 0
    if (index === this.slides.length - 1) {
      setTimeout(() => {
        // Disable transitions sementara untuk instant jump
        this.slides.forEach((slide) => {
          slide.style.transition = "none";
        });

        // Reposition semua slides untuk slide 0 sebagai active
        this.slides.forEach((slide, i) => {
          slide.classList.remove("active", "prev");
          if (i === 0) {
            slide.classList.add("active");
          } else if (i < 0) {
            slide.classList.add("prev");
          }
        });

        this.currentSlide = 0;

        // Trigger reflow untuk memastikan posisi baru diterapkan sebelum transition diaktifkan
        void this.slides[0].offsetHeight;

        // Re-enable transitions
        this.slides.forEach((slide) => {
          slide.style.transition = "";
        });

        this.isTransitioning = false;
      }, this.transitionDuration);
    } else {
      // Reset transition flag untuk slide normal
      setTimeout(() => {
        this.isTransitioning = false;
      }, this.transitionDuration);
    }

    // Reset autoplay
    this.resetAutoplay();
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex =
      (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.goToSlide(prevIndex);
  }

  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoplayDelay);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  resetAutoplay() {
    this.stopAutoplay();
    if (this.autoplay) {
      this.startAutoplay();
    }
  }

  destroy() {
    this.stopAutoplay();
    this.prevBtn?.removeEventListener("click", () => this.prevSlide());
    this.nextBtn?.removeEventListener("click", () => this.nextSlide());
  }
}

/**
 * Generate meteor rain effects di hero section (sama seperti portfolio)
 */
function createMeteors() {
  const container = document.querySelector(".meteors-container");
  if (!container) return;

  // Clear existing meteors
  container.innerHTML = "";

  const meteorCount = 50;

  for (let i = 0; i < meteorCount; i++) {
    const meteor = document.createElement("div");
    meteor.classList.add("meteor");

    const randomLeft = Math.random() * 100;
    const randomDelay = Math.random() * 2;
    const randomDuration = 2 + Math.random() * 1;

    meteor.style.left = randomLeft + "%";
    meteor.style.animationDelay = randomDelay + "s";
    meteor.style.animationDuration = randomDuration + "s";

    container.appendChild(meteor);
  }
}

/**
 * Start continuous meteor animation loop
 */
function startMeteorLoop() {
  const container = document.querySelector(".meteors-container");
  if (!container) return;

  // Clear any existing meteors
  container.innerHTML = "";

  // Add 50 meteors immediately
  createMeteors();

  // Keep adding new meteors every 500ms untuk continuous effect tanpa jeda
  setInterval(() => {
    if (document.querySelector(".meteors-container")) {
      const meteorCount = 15;
      for (let i = 0; i < meteorCount; i++) {
        const meteor = document.createElement("div");
        meteor.classList.add("meteor");

        const randomLeft = Math.random() * 100;
        const randomDelay = 0; // Langsung jalan, jangan delay
        const randomDuration = 2 + Math.random() * 1;

        meteor.style.left = randomLeft + "%";
        meteor.style.animationDelay = randomDelay + "s";
        meteor.style.animationDuration = randomDuration + "s";

        document.querySelector(".meteors-container").appendChild(meteor);

        // Hapus meteor setelah selesai jatuh untuk avoid memory leak
        meteor.addEventListener(
          "animationend",
          () => {
            meteor.remove();
          },
          { once: true }
        );
      }
    }
  }, 500);
}

/**
 * Create image HTML with fallback placeholder
 */
function createImageHTML(imageUrl, title) {
  return `
    <div class="book-image-container">
      <img src="${imageUrl}" alt="${title}" class="book-image" 
        onerror="
          const placeholder = document.createElement('div');
          placeholder.className = 'book-image-placeholder';
          placeholder.innerHTML = '<span style=&quot;font-size: 2rem;&quot;>🖼️</span><span>No Image</span>';
          this.parentElement.insertBefore(placeholder, this);
          this.style.display = 'none';
        "
        onload="
          const existing = this.parentElement.querySelector('.book-image-placeholder');
          if (existing) existing.remove();
        "
      >
    </div>
  `;
}

// Event Listeners
document.getElementById("searchBtn").addEventListener("click", searchBooks);
document.getElementById("searchInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBooks();
});

// Category buttons
document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".category-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    searchByCategory(btn.dataset.category);
  });
});

// Modal close
document.querySelector(".close-btn").addEventListener("click", () => {
  document.getElementById("bookModal").style.display = "none";
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("bookModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Logo click - go back to home
document.querySelector(".logo").addEventListener("click", () => {
  window.location.href = "#home";
  document.getElementById("searchResults").style.display = "none";
  loadFeaturedBooks();
});

// Inisialisasi halaman
document.addEventListener("DOMContentLoaded", () => {
  startMeteorLoop();
  const heroSlider = new HeroSlider({
    autoplay: true,
    autoplayDelay: 6000,
    transitionDuration: 800,
  });
  loadFeaturedBooks();
  updateBorrowedBooksDisplay();
});

/**
 * Enrich book data dengan Google Books API
 */
async function enrichBookDataWithGoogleBooks(book) {
  try {
    // Coba cari di Google Books menggunakan ISBN atau title
    let googleBook = null;

    // Strategy 1: Search by ISBN jika ada
    if (book.isbn && book.isbn.length > 0) {
      const response = await fetch(
        `${GOOGLE_BOOKS_API}?q=isbn:${book.isbn[0]}&key=${GOOGLE_BOOKS_API_KEY}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        googleBook = data.items[0].volumeInfo;
      }
    }

    // Strategy 2: Search by title + author jika ISBN tidak berhasil
    if (!googleBook && book.title) {
      let query = book.title;
      if (book.author_name && book.author_name.length > 0) {
        query += ` ${book.author_name[0]}`;
      }
      const response = await fetch(
        `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(
          query
        )}&maxResults=1&key=${GOOGLE_BOOKS_API_KEY}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        googleBook = data.items[0].volumeInfo;
      }
    }

    // Return enriched data
    if (googleBook) {
      return {
        ...book,
        googleBooks: googleBook,
        googleImage: googleBook.imageLinks
          ? (
              googleBook.imageLinks.thumbnail ||
              googleBook.imageLinks.smallThumbnail
            ).replace("http://", "https://")
          : null,
        googleDescription: googleBook.description || null,
      };
    }

    return book;
  } catch (error) {
    console.error("Error enriching book data:", error);
    return book; // Return original book jika error
  }
}

/**
 * Load featured books untuk homepage
 */
async function loadFeaturedBooks() {
  const container = document.getElementById("featuredContainer");
  container.innerHTML =
    '<div class="loading"><div class="spinner"></div>Memuat buku...</div>';

  try {
    const queries = ["education", "fiction", "science"];
    let allBooks = [];

    for (const query of queries) {
      const url = `${BOOKS_API_URL}?title=${query}&limit=6`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.docs) {
          allBooks = allBooks.concat(data.docs);
        }
      } catch (err) {
        console.error(`Error fetching ${query}:`, err);
      }
    }

    allBooks = shuffleArray(allBooks).slice(0, 12);

    // Enrich semua books dengan Google Books data secara parallel
    const enrichedBooks = await Promise.all(
      allBooks.map((book) => enrichBookDataWithGoogleBooks(book))
    );

    container.innerHTML = "";
    enrichedBooks.forEach((book) => {
      container.appendChild(createBookCard(book));
    });
  } catch (error) {
    console.error("Error loading featured books:", error);
    container.innerHTML =
      '<p class="empty-message">Gagal memuat buku. Silakan coba lagi.</p>';
  }
}

/**
 * Search books by kategori
 */
async function searchByCategory(category) {
  const categoryMap = {
    education: "education",
    fiction: "fiction",
    science: "science",
    history: "history",
    "self-help": "self help",
    business: "business",
  };

  const query = categoryMap[category] || category;
  // Redirect ke halaman library dengan query parameter
  window.location.href = `library.html?search=${encodeURIComponent(query)}`;
}

/**
 * Search books berdasarkan input user
 */
async function searchBooks() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) {
    alert("Masukkan judul, penulis, atau kategori buku");
    return;
  }

  // Redirect ke halaman library dengan query parameter
  window.location.href = `library.html?search=${encodeURIComponent(query)}`;
}

/**
 * Create book card element
 */
function createBookCard(book) {
  const bookId = book.key || book.title;
  const isBorrowed = borrowedBooks.some((b) => b.id === bookId);

  const card = document.createElement("div");
  card.className = "book-card";
  // Make entire card clickable to go to detail page
  card.style.cursor = "pointer";
  card.onclick = (e) => {
    // Jangan navigate jika click di button
    if (e.target.closest(".book-actions")) return;
    window.location.href = `bookdetail.html?id=${encodeURIComponent(bookId)}`;
  };

  // Prioritas: Google Books image > OpenLibrary image > placeholder
  let imageUrl = "https://via.placeholder.com/160x240?text=No+Cover";
  if (book.googleImage) {
    imageUrl = book.googleImage;
  } else if (book.cover_i) {
    imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
  }

  const title = book.title || "Tanpa Judul";
  const authors = (book.author_name || ["Penulis Tidak Diketahui"])
    .slice(0, 2)
    .join(", ");

  // Prioritas: Google Books description > OpenLibrary first_sentence > default
  let description = "Deskripsi tidak tersedia";
  if (book.googleDescription) {
    description = book.googleDescription;
  } else if (book.first_sentence && book.first_sentence[0]) {
    description = book.first_sentence[0];
  }

  const rating = book.ratings_average || 0;
  const ratingCount = book.ratings_count || 0;

  card.innerHTML = `
        ${createImageHTML(imageUrl, title)}
        <div class="book-info">
            <div class="book-title">${title}</div>
            <div class="book-author">oleh ${authors}</div>
            <div class="book-description">${description.substring(
              0,
              100
            )}...</div>
            <div class="book-rating">
                <span class="stars">${"⭐".repeat(
                  Math.round(rating || 0)
                )}</span>
                <span>${
                  rating > 0
                    ? `${rating.toFixed(1)} (${ratingCount})`
                    : "Belum ada rating"
                }</span>
            </div>
            <div class="book-actions">
                <button class="btn btn-detail" onclick="event.stopPropagation(); showBookPreview(this)">Detail</button>
                <button class="btn ${isBorrowed ? "btn-return" : "btn-borrow"}" 
                    onclick="event.stopPropagation(); toggleBorrow('${bookId}', '${title.replace(
    /'/g,
    "\\'"
  )}')">
                    ${isBorrowed ? "Kembalikan" : "Pinjam"}
                </button>
            </div>
        </div>
    `;

  // Store book data di element untuk diakses di modal
  card.bookData = {
    id: bookId,
    title: title,
    authors: authors,
    imageUrl: imageUrl,
    description: description,
    rating: rating,
    ratingCount: ratingCount,
    isBorrowed: isBorrowed,
  };

  return card;
}

/**
 * Show book preview in modal
 */
function showBookPreview(buttonElement) {
  const card = buttonElement.closest(".book-card");
  const book = card.bookData;

  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = `
    <img src="${book.imageUrl}" alt="${book.title}" class="modal-book-image">
    <div class="modal-book-info">
        <h2>${book.title}</h2>
        <p><strong>Penulis:</strong> ${book.authors}</p>
        <div class="modal-rating">
            <span class="stars">${"⭐".repeat(
              Math.round(book.rating || 0)
            )}</span>
            <span>${
              book.rating > 0
                ? `${book.rating.toFixed(1)} (${book.ratingCount})`
                : "Belum ada rating"
            }</span>
        </div>
        <p><strong>Sinopsis:</strong></p>
        <p style="text-align: justify; line-height: 1.6; max-height: 200px; overflow-y: auto;">${
          book.description
        }</p>
        <div class="modal-actions">
            <button class="btn btn-detail" onclick="window.location.href='bookdetail.html?id=${encodeURIComponent(
              book.id
            )}'">Lihat Detail Lengkap</button>
            <button class="btn ${
              book.isBorrowed ? "btn-return" : "btn-borrow"
            }" 
                onclick="toggleBorrow('${book.id}', '${book.title.replace(
    /'/g,
    "\\'"
  )}'); document.getElementById('bookModal').style.display='none';">
                ${book.isBorrowed ? "Kembalikan" : "Pinjam"}
            </button>
        </div>
    </div>
  `;

  document.getElementById("bookModal").style.display = "block";
}

/**
 * Show book detail in modal (DEPRECATED - use showBookPreview instead)
 */
async function showBookDetail(bookId, title) {
  // Redirect ke halaman detail buku
  window.location.href = `bookdetail.html?id=${encodeURIComponent(bookId)}`;
}

/**
 * Toggle borrow/return book
 */
function toggleBorrow(bookId, title) {
  const existingIndex = borrowedBooks.findIndex((b) => b.id === bookId);

  if (existingIndex > -1) {
    // Kembalikan buku
    borrowedBooks.splice(existingIndex, 1);
    alert(`✅ Buku "${title}" berhasil dikembalikan`);
  } else {
    // Pinjam buku
    const borrowDate = new Date();
    const returnDate = new Date(
      borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000
    ); // 14 hari

    borrowedBooks.push({
      id: bookId,
      title: title,
      borrowDate: borrowDate.toLocaleDateString("id-ID"),
      returnDate: returnDate.toLocaleDateString("id-ID"),
    });
    alert(
      `✅ Buku "${title}" berhasil dipinjam. Batas pengembalian: ${returnDate.toLocaleDateString(
        "id-ID"
      )}`
    );
  }

  // Simpan ke localStorage
  localStorage.setItem("borrowedBooks", JSON.stringify(borrowedBooks));

  // Update display
  updateBorrowedBooksDisplay();

  // Reload featured books atau search results
  if (document.getElementById("searchResults").style.display === "none") {
    loadFeaturedBooks();
  } else {
    searchBooks();
  }
}

/**
 * Update borrowed books display
 */
function updateBorrowedBooksDisplay() {
  const container = document.getElementById("borrowedContainer");
  const noBorrowedMsg = document.getElementById("noBorrowedMsg");

  if (borrowedBooks.length === 0) {
    container.innerHTML = "";
    noBorrowedMsg.style.display = "block";
    return;
  }

  noBorrowedMsg.style.display = "none";
  container.innerHTML = "";

  // Tampilkan buku yang dipinjam langsung dari data lokal
  borrowedBooks.forEach((borrowedBook) => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <div style="padding: 20px; background: #f0f9ff; border-radius: 12px; text-align: center;">
        <h3>${borrowedBook.title}</h3>
        <p><strong>Tanggal Pinjam:</strong> ${borrowedBook.borrowDate}</p>
        <p><strong>Tanggal Kembali:</strong> ${borrowedBook.returnDate}</p>
        <button class="btn btn-return" onclick="toggleBorrow('${
          borrowedBook.id
        }', '${borrowedBook.title.replace(
      /'/g,
      "\\'"
    )}'); updateBorrowedBooksDisplay();">
          Kembalikan Buku
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Navigate to borrowed books section
 */
function showBorrowedBooks() {
  document.getElementById("searchResults").style.display = "none";
  document.getElementById("borrowed").style.display = "block";
  window.scrollTo(0, 0);
  updateBorrowedBooksDisplay();
}

/**
 * Shuffle array helper
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Tambahkan click handler untuk "Buku Saya" di navbar
document.addEventListener("DOMContentLoaded", () => {
  const borrowedLink = document.querySelector('a[href="#borrowed"]');
  if (borrowedLink) {
    borrowedLink.addEventListener("click", (e) => {
      e.preventDefault();
      showBorrowedBooks();
    });
  }

  // Initialize theme from localStorage
  initializeTheme();

  // Setup theme toggle button
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
});

/**
 * Initialize theme based on localStorage or system preference
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const html = document.documentElement;

  // Default ke system preference
  if (savedTheme) {
    if (savedTheme === "dark") {
      html.classList.add("dark-mode");
      updateThemeIcon(true);
    }
  } else {
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      html.classList.add("dark-mode");
      updateThemeIcon(true);
    }
  }
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
  const html = document.documentElement;

  // Add transition class
  html.classList.add("theme-transitioning");

  const isDarkMode = html.classList.toggle("dark-mode");

  // Save preference to localStorage
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");

  // Remove transition class after animation completes
  setTimeout(() => {
    html.classList.remove("theme-transitioning");
  }, 400);

  // Update icon
  updateThemeIcon(isDarkMode);
}

/**
 * Update theme icon based on mode
 */
function updateThemeIcon(isDarkMode) {
  // Icon transition handled by CSS now
  // Just need to toggle the dark-mode class which is already done
}
