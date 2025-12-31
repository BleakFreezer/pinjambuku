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

// OpenLibrary API untuk search
const OPENLIBRARY_API = "https://openlibrary.org/search.json";
// Google Books API dengan API key
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = "AIzaSyA0KR2gj5dujlY8OMlqF833PgrYW8gnjI8";

// Data yang disimpan di localStorage
let borrowedBooks = JSON.parse(localStorage.getItem("borrowedBooks")) || [];
let currentBook = null;
let currentBookId = null;

/**
 * Create image HTML with fallback placeholder for detail/modal
 */
function createDetailImageHTML(imageUrl, title) {
  return `
    <div style="width: 100%; height: 400px; position: relative; overflow: hidden;">
      <img src="${imageUrl}" alt="${title}" class="modal-book-image" 
        onerror="
          const placeholder = document.createElement('div');
          placeholder.className = 'modal-book-image-placeholder';
          placeholder.innerHTML = '<span style=&quot;font-size: 4rem;&quot;>🖼️</span><span>No Image</span>';
          this.parentElement.insertBefore(placeholder, this);
          this.style.display = 'none';
        "
        onload="
          const existing = this.parentElement.querySelector('.modal-book-image-placeholder');
          if (existing) existing.remove();
        "
      >
    </div>
  `;
}

// Get query parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

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

// Inisialisasi halaman
document.addEventListener("DOMContentLoaded", () => {
  let bookId = getQueryParam("id");
  if (bookId) {
    // Normalize book ID to OpenLibrary format
    if (!bookId.startsWith("/works/") && !bookId.startsWith("/books/")) {
      // Handle case where ID is just the key without prefix
      if (bookId.match(/^OL\d+W$/)) {
        bookId = `/works/${bookId}`;
      } else if (bookId.match(/^OL\d+M$/)) {
        bookId = `/books/${bookId}`;
      } else {
        // Assume it's a works ID if it contains 'W'
        if (bookId.includes("W")) {
          bookId = `/works/${bookId}`;
        } else if (bookId.includes("M")) {
          bookId = `/books/${bookId}`;
        } else {
          // Default to works
          bookId = `/works/${bookId}`;
        }
      }
    }
    loadBookDetail(bookId);
  } else {
    window.location.href = "library.html";
  }

  // Handle borrow button
  document.getElementById("borrowBtn").addEventListener("click", borrowBook);
});

/**
 * Load book detail - STRATEGI HYBRID: Google Books + OpenLibrary
 */
async function loadBookDetail(bookId) {
  try {
    currentBookId = bookId;
    console.log("=== 🚀 STARTING BOOK DETAIL LOAD ===");
    console.log("BookId:", bookId);

    // FIRST: Try to find on Google Books using multiple search strategies
    let googleBook = null;

    // Get title dari OpenLibrary dulu
    console.log("📖 Fetching from OpenLibrary untuk title...");
    let openLibBook = null;
    try {
      const openLibResponse = await fetch(
        `https://openlibrary.org${bookId}.json`
      );
      if (openLibResponse.ok) {
        openLibBook = await openLibResponse.json();
        console.log("✅ OpenLibrary data retrieved");
        console.log("   - Title:", openLibBook.title);
        console.log("   - ISBN:", openLibBook.isbn);
      }
    } catch (err) {
      console.error("❌ Error fetching OpenLibrary:", err);
    }

    // Strategy 1: Search Google Books by ISBN (paling akurat)
    if (openLibBook && openLibBook.isbn && openLibBook.isbn.length > 0) {
      const isbn = openLibBook.isbn[0];
      console.log("🔍 STRATEGY 1: Searching Google Books by ISBN:", isbn);
      try {
        const url = `${GOOGLE_BOOKS_API}?q=isbn:${isbn}&key=${GOOGLE_BOOKS_API_KEY}`;
        console.log("   URL:", url);
        const googleResponse = await fetch(url);
        const data = await googleResponse.json();

        console.log("   Response status: OK");
        console.log("   Items found:", data.items ? data.items.length : 0);

        if (data.items && data.items.length > 0) {
          googleBook = data.items[0];
          console.log("✅ FOUND! Google Books ISBN search success!");
          console.log("   Full Response:", googleBook);
          console.log("   - Title:", googleBook.volumeInfo.title);
          console.log("   - Authors:", googleBook.volumeInfo.authors);
          console.log("   - Publisher:", googleBook.volumeInfo.publisher);
          console.log("   - Date:", googleBook.volumeInfo.publishedDate);
          console.log("   - Pages:", googleBook.volumeInfo.pageCount);
          console.log("   - Language:", googleBook.volumeInfo.language);
          console.log("   - Categories:", googleBook.volumeInfo.categories);
          console.log("   - Description:", googleBook.volumeInfo.description);
          console.log("   - Image:", googleBook.volumeInfo.imageLinks);
        } else {
          console.log("❌ No results from Google Books ISBN search");
        }
      } catch (err) {
        console.error("❌ Error in ISBN search:", err);
      }
    }

    // Strategy 2: Search by title + author if ISBN tidak berhasil
    if (!googleBook && openLibBook && openLibBook.title) {
      console.log("🔍 STRATEGY 2: Searching Google Books by title+author");
      try {
        let query = openLibBook.title;
        if (openLibBook.authors && openLibBook.authors.length > 0) {
          const author =
            typeof openLibBook.authors[0] === "object"
              ? openLibBook.authors[0].name
              : openLibBook.authors[0];
          query += ` ${author}`;
        }

        const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(
          query
        )}&maxResults=5&key=${GOOGLE_BOOKS_API_KEY}`;
        console.log("   Query:", query);
        console.log("   URL:", url);

        const googleResponse = await fetch(url);
        const data = await googleResponse.json();

        console.log("   Response status: OK");
        console.log("   Items found:", data.items ? data.items.length : 0);

        if (data.items && data.items.length > 0) {
          googleBook = data.items[0];
          console.log("✅ FOUND! Google Books title search success!");
          console.log("   Full Response:", googleBook);
          console.log("   - Title:", googleBook.volumeInfo.title);
          console.log("   - Publisher:", googleBook.volumeInfo.publisher);
        } else {
          console.log("❌ No results from Google Books title search");
        }
      } catch (err) {
        console.error("❌ Error in title search:", err);
      }
    }

    // DISPLAY: Prioritas: Google Books > OpenLibrary
    if (googleBook && googleBook.volumeInfo) {
      console.log("📊 DISPLAYING: Using Google Books data (LENGKAP)");
      displayGoogleBooksDetail(googleBook);
    } else if (openLibBook) {
      console.log("📊 DISPLAYING: Using OpenLibrary data (FALLBACK)");
      displayOpenLibraryDetail(openLibBook);
    } else {
      throw new Error("Tidak ada data buku yang ditemukan");
    }
  } catch (error) {
    console.error("❌ FATAL Error loading book detail:", error);
    const container = document.querySelector(".bookdetail-container");
    if (container) {
      container.innerHTML = `<p class="empty-message">Error: ${error.message}</p>`;
    }
  }
}

/**
 * Display book detail from Google Books API
 */
function displayGoogleBooksDetail(book) {
  const volumeInfo = book.volumeInfo;

  console.log("=== 📊 DISPLAYING GOOGLE BOOKS DATA ===");
  console.log("Full volumeInfo object:", volumeInfo);

  // Display book info
  let imageUrl = "https://via.placeholder.com/300x450?text=No+Cover";
  if (volumeInfo.imageLinks) {
    imageUrl = (
      volumeInfo.imageLinks.thumbnail ||
      volumeInfo.imageLinks.smallThumbnail ||
      imageUrl
    ).replace("http://", "https://");
  }

  const bookImageEl = document.getElementById("bookImage");
  const bookTitleEl = document.getElementById("bookTitle");
  const bookAuthorEl = document.getElementById("bookAuthor");
  const bookStarsEl = document.getElementById("bookStars");
  const bookRatingEl = document.getElementById("bookRating");
  const bookPublisherEl = document.getElementById("bookPublisher");
  const bookPublishDateEl = document.getElementById("bookPublishDate");
  const bookPagesEl = document.getElementById("bookPages");
  const bookLanguageEl = document.getElementById("bookLanguage");
  const bookCategoriesEl = document.getElementById("bookCategories");
  const bookDescriptionEl = document.getElementById("bookDescription");

  // IMAGE
  console.log("🖼️  Setting image...");
  console.log("   Found:", bookImageEl ? "YES ✅" : "NO ❌");
  if (bookImageEl) {
    bookImageEl.src = imageUrl;
    console.log("   URL set:", imageUrl.substring(0, 60) + "...");
  }

  // TITLE
  console.log("📝 Setting title...");
  console.log("   Found:", bookTitleEl ? "YES ✅" : "NO ❌");
  if (bookTitleEl) {
    bookTitleEl.textContent = volumeInfo.title || "Tanpa Judul";
    console.log("   Text set:", volumeInfo.title);
  }

  // AUTHOR
  console.log("✍️  Setting author...");
  const authors = (volumeInfo.authors || ["Penulis Tidak Diketahui"]).join(
    ", "
  );
  console.log("   Found:", bookAuthorEl ? "YES ✅" : "NO ❌");
  console.log("   Authors array:", volumeInfo.authors);
  if (bookAuthorEl) {
    bookAuthorEl.textContent = `oleh ${authors}`;
    console.log("   Text set:", authors);
  }

  // RATING
  console.log("⭐ Setting rating...");
  const rating = volumeInfo.averageRating || 0;
  const ratingCount = volumeInfo.ratingsCount || 0;
  console.log("   Found stars element:", bookStarsEl ? "YES ✅" : "NO ❌");
  console.log("   Found rating element:", bookRatingEl ? "YES ✅" : "NO ❌");
  console.log("   Rating value:", rating);
  console.log("   Rating count:", ratingCount);
  if (bookStarsEl)
    bookStarsEl.textContent = "⭐".repeat(Math.round(rating || 0));
  if (bookRatingEl)
    bookRatingEl.textContent =
      rating > 0
        ? `${rating.toFixed(1)} dari 5 (${ratingCount} ulasan)`
        : "Belum ada rating";

  // PUBLISHER
  console.log("🏢 Setting publisher...");
  console.log("   Found:", bookPublisherEl ? "YES ✅" : "NO ❌");
  console.log("   Value from API:", volumeInfo.publisher);
  if (bookPublisherEl) {
    bookPublisherEl.textContent = volumeInfo.publisher || "-";
    console.log("   Text set:", bookPublisherEl.textContent);
  }

  // PUBLISH DATE
  console.log("📅 Setting publish date...");
  console.log("   Found:", bookPublishDateEl ? "YES ✅" : "NO ❌");
  console.log("   Value from API:", volumeInfo.publishedDate);
  if (bookPublishDateEl) {
    bookPublishDateEl.textContent = volumeInfo.publishedDate || "-";
    console.log("   Text set:", bookPublishDateEl.textContent);
  }

  // PAGES
  console.log("📄 Setting pages...");
  console.log("   Found:", bookPagesEl ? "YES ✅" : "NO ❌");
  console.log("   Value from API:", volumeInfo.pageCount);
  if (bookPagesEl) {
    bookPagesEl.textContent = volumeInfo.pageCount || "-";
    console.log("   Text set:", bookPagesEl.textContent);
  }

  // LANGUAGE
  console.log("🌐 Setting language...");
  console.log("   Found:", bookLanguageEl ? "YES ✅" : "NO ❌");
  console.log("   Value from API:", volumeInfo.language);
  if (bookLanguageEl) {
    bookLanguageEl.textContent = volumeInfo.language
      ? volumeInfo.language.toUpperCase()
      : "Tidak Diketahui";
    console.log("   Text set:", bookLanguageEl.textContent);
  }

  // CATEGORIES
  console.log("🏷️  Setting categories...");
  const categories = (volumeInfo.categories || []).join(", ") || "-";
  console.log("   Found:", bookCategoriesEl ? "YES ✅" : "NO ❌");
  console.log("   Value from API:", volumeInfo.categories);
  console.log("   Joined string:", categories);
  if (bookCategoriesEl) {
    bookCategoriesEl.textContent = categories;
    console.log("   Text set:", bookCategoriesEl.textContent);
  }

  // DESCRIPTION
  console.log("📖 Setting description...");
  const description =
    volumeInfo.description || "Deskripsi tidak tersedia untuk buku ini.";
  console.log("   Found:", bookDescriptionEl ? "YES ✅" : "NO ❌");
  console.log(
    "   Value from API (first 100 chars):",
    description.substring(0, 100)
  );
  if (bookDescriptionEl) {
    bookDescriptionEl.textContent = description;
    console.log("   Text set: ✅");
  }

  console.log("=== ✅ GOOGLE BOOKS DISPLAY COMPLETE ===");

  // Details
  loadGoogleBooksDetails(book);

  // Reviews
  loadReviews(book);

  // Check if borrowed
  const isBorrowed = borrowedBooks.some((b) => b.id === book.id);
  updateBorrowButton(isBorrowed, book.id);
}

/**
 * Display book detail from OpenLibrary (fallback)
 */
function displayOpenLibraryDetail(book) {
  const imageUrl =
    book.covers && book.covers.length > 0
      ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
      : "https://via.placeholder.com/300x450?text=No+Cover";

  const bookImageEl = document.getElementById("bookImage");
  const bookTitleEl = document.getElementById("bookTitle");
  const bookAuthorEl = document.getElementById("bookAuthor");
  const bookStarsEl = document.getElementById("bookStars");
  const bookRatingEl = document.getElementById("bookRating");
  const bookPublisherEl = document.getElementById("bookPublisher");
  const bookPublishDateEl = document.getElementById("bookPublishDate");
  const bookPagesEl = document.getElementById("bookPages");
  const bookLanguageEl = document.getElementById("bookLanguage");
  const bookCategoriesEl = document.getElementById("bookCategories");
  const bookDescriptionEl = document.getElementById("bookDescription");

  if (bookImageEl) bookImageEl.src = imageUrl;
  if (bookTitleEl) bookTitleEl.textContent = book.title || "Tanpa Judul";

  const authors =
    (book.authors || [])
      .map((a) => {
        if (typeof a === "object") return a.name || "Penulis Tidak Diketahui";
        return a;
      })
      .slice(0, 3)
      .join(", ") || "Penulis Tidak Diketahui";
  if (bookAuthorEl) bookAuthorEl.textContent = `oleh ${authors}`;

  if (bookStarsEl) bookStarsEl.textContent = "";
  if (bookRatingEl) bookRatingEl.textContent = "Rating tidak tersedia";

  console.log("Setting Publisher (OL):", book.publishers);
  if (bookPublisherEl)
    bookPublisherEl.textContent =
      (book.publishers && book.publishers[0]) || "-";

  console.log("Setting Publish Date (OL):", book.publish_date);
  if (bookPublishDateEl)
    bookPublishDateEl.textContent = book.publish_date || "-";

  console.log("Setting Pages (OL):", book.number_of_pages);
  if (bookPagesEl) bookPagesEl.textContent = book.number_of_pages || "-";

  console.log("Setting Language (OL):", book.languages);
  if (bookLanguageEl)
    bookLanguageEl.textContent =
      (book.languages && book.languages[0]) || "Tidak Diketahui";

  const subjects = (book.subjects || []).slice(0, 5).join(", ") || "-";
  console.log("Setting Categories (OL):", subjects);
  if (bookCategoriesEl) bookCategoriesEl.textContent = subjects;

  const description = book.description
    ? typeof book.description === "object"
      ? book.description.value
      : book.description
    : "Deskripsi tidak tersedia untuk buku ini.";
  if (bookDescriptionEl) bookDescriptionEl.textContent = description;

  loadOpenLibraryDetails(book);
  loadReviews();

  const isBorrowed = borrowedBooks.some((b) => b.id === currentBookId);
  updateBorrowButton(isBorrowed, currentBookId);
}

/**
 * Fetch rating from OpenLibrary search API
 */
async function fetchBookRating(title) {
  try {
    const response = await fetch(
      `${OPENLIBRARY_API}?title=${encodeURIComponent(title)}&limit=1`
    );
    const data = await response.json();
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      const rating = book.ratings_average || 0;
      const ratingCount = book.ratings_count || 0;

      document.getElementById("bookStars").textContent = "⭐".repeat(
        Math.round(rating || 0)
      );
      document.getElementById("bookRating").textContent =
        rating > 0
          ? `${rating.toFixed(1)} dari 5 (${ratingCount} ulasan)`
          : "Belum ada rating";
    }
  } catch (error) {
    console.error("Error fetching rating:", error);
    document.getElementById("bookRating").textContent = "Rating tidak tersedia";
  }
}

/**
 * Load Google Books details tab
 */
function loadGoogleBooksDetails(book) {
  const detailsContent = document.getElementById("detailsContent");
  const volumeInfo = book.volumeInfo;

  let html = `
    <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 8px;">
  `;

  if (volumeInfo.industryIdentifiers) {
    volumeInfo.industryIdentifiers.forEach((identifier) => {
      html += `<p><strong>${identifier.type}:</strong> ${identifier.identifier}</p>`;
    });
  }

  if (volumeInfo.printType) {
    html += `<p><strong>Tipe:</strong> ${volumeInfo.printType}</p>`;
  }

  if (volumeInfo.maturityRating) {
    html += `<p><strong>Rating Konten:</strong> ${volumeInfo.maturityRating}</p>`;
  }

  if (book.saleInfo) {
    html += `<p><strong>Status Penjualan:</strong> ${book.saleInfo.saleability}</p>`;
  }

  html += `
    </div>
  `;

  detailsContent.innerHTML = html;
}

/**
 * Load OpenLibrary details tab (fallback)
 */
function loadOpenLibraryDetails(book) {
  const detailsContent = document.getElementById("detailsContent");

  let html = `
    <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 8px;">
  `;

  if (book.first_publication_year) {
    html += `<p><strong>Tahun Publikasi Pertama:</strong> ${book.first_publication_year}</p>`;
  }

  if (book.isbn && book.isbn.length > 0) {
    html += `<p><strong>ISBN:</strong> ${book.isbn[0]}</p>`;
  }

  if (book.key) {
    html += `<p><strong>OpenLibrary ID:</strong> ${book.key}</p>`;
  }

  html += `
    </div>
  `;

  detailsContent.innerHTML = html;
}

/**
 * Load reviews tab
 */
function loadReviews(book) {
  const reviewsContent = document.getElementById("reviewsContent");

  let reviewsHtml = `
    <div style="text-align: center; padding: 2rem;">
  `;

  if (book && book.volumeInfo && book.volumeInfo.previewLink) {
    reviewsHtml += `
      <p style="color: var(--text-dark); margin-bottom: 1rem;">
        <strong>Preview buku:</strong>
      </p>
      <p>
        <a href="${book.volumeInfo.previewLink}" target="_blank" style="color: var(--primary-color); text-decoration: underline;">
          Lihat Preview di Google Books
        </a>
      </p>
    `;
  } else if (book && book.key) {
    reviewsHtml += `
      <p style="color: var(--text-dark); margin-bottom: 1rem;">
        <strong>Ulasan pembaca:</strong>
      </p>
      <p>
        <a href="https://openlibrary.org${book.key}" target="_blank" style="color: var(--primary-color); text-decoration: underline;">
          Lihat di OpenLibrary.org
        </a>
      </p>
    `;
  } else {
    reviewsHtml += `
      <p style="color: var(--text-light); font-size: 1.1rem;">
        Ulasan tidak tersedia untuk buku ini.
      </p>
    `;
  }

  reviewsHtml += `</div>`;

  reviewsContent.innerHTML = reviewsHtml;
}

/**
 * Switch tab
 */
function switchTab(tab) {
  document.querySelectorAll(".bookdetail-tab").forEach((t) => {
    t.classList.remove("active");
  });
  document.querySelectorAll(".bookdetail-tab-content").forEach((c) => {
    c.classList.remove("active");
  });

  event.target.classList.add("active");
  document.getElementById(tab).classList.add("active");
}

/**
 * Open details modal
 */
async function openDetails() {
  const modalBody = document.getElementById("modalBody");
  const isBorrowed = borrowedBooks.some((b) => b.id === currentBookId);
  const title = document.getElementById("bookTitle").textContent;
  const author = document
    .getElementById("bookAuthor")
    .textContent.replace("oleh ", "");
  const imageUrl = document.getElementById("bookImage").src;

  modalBody.innerHTML = `
    ${createDetailImageHTML(imageUrl, title)}
    <div class="modal-book-info">
        <h2>${title}</h2>
        <p><strong>Penulis:</strong> ${author}</p>
        <p><strong>Penerbit:</strong> ${
          document.getElementById("bookPublisher").textContent
        }</p>
        <p><strong>Tanggal Terbit:</strong> ${
          document.getElementById("bookPublishDate").textContent
        }</p>
        <p><strong>Halaman:</strong> ${
          document.getElementById("bookPages").textContent
        }</p>
        <p><strong>Kategori:</strong> ${
          document.getElementById("bookCategories").textContent
        }</p>
        <p><strong>Deskripsi:</strong></p>
        <p>${document.getElementById("bookDescription").textContent}</p>
        <div class="modal-actions">
            <button class="btn btn-detail" onclick="window.open('https://openlibrary.org${currentBookId}', '_blank')">Buka di OpenLibrary</button>
            <button class="btn ${isBorrowed ? "btn-return" : "btn-borrow"}" 
                onclick="borrowBook(); document.getElementById('bookModal').style.display='none';">
                ${isBorrowed ? "Kembalikan" : "Pinjam"}
            </button>
        </div>
    </div>
  `;

  document.getElementById("bookModal").style.display = "block";
}

/**
 * Borrow book
 */
function borrowBook() {
  const title = document.getElementById("bookTitle").textContent;
  const existingIndex = borrowedBooks.findIndex((b) => b.id === currentBookId);

  if (existingIndex > -1) {
    borrowedBooks.splice(existingIndex, 1);
    alert(`✅ Buku "${title}" berhasil dikembalikan`);
  } else {
    const borrowDate = new Date();
    const returnDate = new Date(
      borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000
    );

    borrowedBooks.push({
      id: currentBookId,
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

  localStorage.setItem("borrowedBooks", JSON.stringify(borrowedBooks));
  updateBorrowButton(borrowedBooks.some((b) => b.id === currentBookId));
}

/**
 * Update borrow button
 */
function updateBorrowButton(isBorrowed, bookId = null) {
  const borrowBtn = document.getElementById("borrowBtn");
  if (isBorrowed) {
    borrowBtn.classList.remove("btn-borrow");
    borrowBtn.classList.add("btn-return");
    borrowBtn.textContent = "Kembalikan";
  } else {
    borrowBtn.classList.remove("btn-return");
    borrowBtn.classList.add("btn-borrow");
    borrowBtn.textContent = "Pinjam";
  }

  if (bookId) {
    currentBookId = bookId;
  }
}

/**
 * Show borrowed books (untuk navbar)
 */
function showBorrowedBooks(e) {
  if (e) e.preventDefault();
  window.location.href = "library.html#borrowed";
}

/**
 * Burger Menu Functionality
 */
function initBurgerMenu() {
  const burgerMenu = document.getElementById("burgerMenu");
  const navLinks = document.querySelector(".nav-links");
  const navLinkItems = document.querySelectorAll(".nav-link");

  if (!burgerMenu || !navLinks) return;

  // Toggle menu
  burgerMenu.addEventListener("click", () => {
    burgerMenu.classList.toggle("active");
    navLinks.classList.toggle("active");

    // Prevent body scroll when menu is open
    if (navLinks.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  });

  // Close menu when clicking on a nav link
  navLinkItems.forEach((link) => {
    link.addEventListener("click", () => {
      burgerMenu.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !burgerMenu.contains(e.target) &&
      !navLinks.contains(e.target) &&
      navLinks.classList.contains("active")
    ) {
      burgerMenu.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("active")) {
      burgerMenu.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Reset menu state on window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      burgerMenu.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// Initialize burger menu
initBurgerMenu();
