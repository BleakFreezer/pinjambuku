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

// OpenLibrary API
const BOOKS_API_URL = "https://openlibrary.org/search.json";
// Google Books API
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = "AIzaSyA0KR2gj5dujlY8OMlqF833PgrYW8gnjI8";

// Data yang disimpan di localStorage
let borrowedBooks = JSON.parse(localStorage.getItem("borrowedBooks")) || [];

// Infinite scroll state
let currentSearchQuery = "";
let currentOffset = 0;
let isLoadingMore = false;
let totalResults = 0;
const BOOKS_PER_PAGE = 20;

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

// Get query parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
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

// Inisialisasi halaman
document.addEventListener("DOMContentLoaded", () => {
  const searchQuery = getQueryParam("search");
  if (searchQuery) {
    document.getElementById("searchInput").value = searchQuery;
    searchBooks();
  } else {
    showCategories();
  }
});

/**
 * Show categories
 */
function showCategories() {
  document.getElementById("categoriesSection").style.display = "block";
  document.getElementById("searchResults").style.display = "none";
  document.getElementById("borrowedSection").style.display = "none";
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
  document.getElementById("searchInput").value = query;
  searchBooks();
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

  // Reset infinite scroll state
  currentSearchQuery = query;
  currentOffset = 0;
  isLoadingMore = false;
  totalResults = 0;

  // Update URL dengan query parameter
  window.history.pushState(
    { search: query },
    "",
    `?search=${encodeURIComponent(query)}`
  );

  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML =
    '<div class="loading"><div class="spinner"></div>Mencari buku...</div>';
  document.getElementById("searchResults").style.display = "block";
  document.getElementById("categoriesSection").style.display = "none";
  document.getElementById("borrowedSection").style.display = "none";
  window.scrollTo(0, 0);

  try {
    const url = `${BOOKS_API_URL}?q=${encodeURIComponent(
      query
    )}&limit=${BOOKS_PER_PAGE}&offset=0`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // Store total results dan update offset
    totalResults = data.numFound || 0;
    currentOffset = BOOKS_PER_PAGE;

    // Update title dan info
    document.getElementById(
      "resultsTitle"
    ).textContent = `Hasil Pencarian: "${query}"`;
    document.getElementById("resultsInfo").textContent =
      data.docs && data.docs.length > 0
        ? `Ditemukan ${totalResults} buku`
        : "Buku tidak ditemukan";

    resultsContainer.innerHTML = "";
    if (data.docs && data.docs.length > 0) {
      // Enrich books dengan Google Books data secara parallel
      const enrichedBooks = await Promise.all(
        data.docs.map((book) => enrichBookDataWithGoogleBooks(book))
      );

      enrichedBooks.forEach((book) => {
        resultsContainer.appendChild(createBookCard(book));
      });

      // Setup infinite scroll listener jika ada lebih banyak hasil
      if (currentOffset < totalResults) {
        setupInfiniteScroll();
      }
    } else {
      resultsContainer.innerHTML =
        '<p class="empty-message">Buku tidak ditemukan. Coba kata kunci lain.</p>';
    }
  } catch (error) {
    console.error("Error searching books:", error);
    resultsContainer.innerHTML = `<p class="empty-message">Gagal mencari buku: ${error.message}</p>`;
  }
}

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
    console.log("Using Google Books image for:", book.title);
  } else if (book.cover_i) {
    imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
    console.log("Using OpenLibrary image for:", book.title);
  }

  const title = book.title || "Tanpa Judul";
  const authors = (book.author_name || ["Penulis Tidak Diketahui"])
    .slice(0, 2)
    .join(", ");

  // Prioritas: Google Books description > OpenLibrary first_sentence > default
  let description = "Deskripsi tidak tersedia";
  if (book.googleDescription) {
    description = book.googleDescription;
    console.log("Using Google Books description for:", book.title);
  } else if (book.first_sentence && book.first_sentence[0]) {
    description = book.first_sentence[0];
    console.log("Using OpenLibrary description for:", book.title);
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
 * Setup infinite scroll listener
 */
function setupInfiniteScroll() {
  // Remove existing listener kalau ada
  window.removeEventListener("scroll", handleInfiniteScroll);

  // Add listener
  window.addEventListener("scroll", handleInfiniteScroll);
}

/**
 * Handle infinite scroll - detect when user scrolls to bottom
 */
function handleInfiniteScroll() {
  // Jika sedang loading atau sudah load semua, jangan load lagi
  if (isLoadingMore || currentOffset >= totalResults) return;

  // Calculate if user is near bottom
  const scrollPosition = window.innerHeight + window.scrollY;
  const documentHeight = document.documentElement.scrollHeight;
  const threshold = 300; // Load ketika 300px dari bawah

  if (scrollPosition >= documentHeight - threshold) {
    loadMoreBooks();
  }
}

/**
 * Load more books
 */
async function loadMoreBooks() {
  if (isLoadingMore || !currentSearchQuery || currentOffset >= totalResults) {
    return;
  }

  isLoadingMore = true;

  try {
    const url = `${BOOKS_API_URL}?q=${encodeURIComponent(
      currentSearchQuery
    )}&limit=${BOOKS_PER_PAGE}&offset=${currentOffset}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const resultsContainer = document.getElementById("resultsContainer");

    if (data.docs && data.docs.length > 0) {
      // Enrich books dengan Google Books data
      const enrichedBooks = await Promise.all(
        data.docs.map((book) => enrichBookDataWithGoogleBooks(book))
      );

      // Append ke existing container
      enrichedBooks.forEach((book) => {
        resultsContainer.appendChild(createBookCard(book));
      });

      // Update offset
      currentOffset += BOOKS_PER_PAGE;

      // Update info text
      const loaded = Math.min(currentOffset, totalResults);
      document.getElementById(
        "resultsInfo"
      ).textContent = `Menampilkan ${loaded} dari ${totalResults} buku`;
    }
  } catch (error) {
    console.error("Error loading more books:", error);
  } finally {
    isLoadingMore = false;
  }
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
    borrowedBooks.splice(existingIndex, 1);
    alert(`✅ Buku "${title}" berhasil dikembalikan`);
  } else {
    const borrowDate = new Date();
    const returnDate = new Date(
      borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000
    );

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

  localStorage.setItem("borrowedBooks", JSON.stringify(borrowedBooks));
  updateBorrowedBooksDisplay();

  // Reload search results jika ada
  const searchQuery = getQueryParam("search");
  if (searchQuery) {
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
function showBorrowedBooks(e) {
  if (e) e.preventDefault();
  document.getElementById("searchResults").style.display = "none";
  document.getElementById("categoriesSection").style.display = "none";
  document.getElementById("borrowedSection").style.display = "block";
  window.scrollTo(0, 0);
  updateBorrowedBooksDisplay();
}
