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

// Google Books API
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = "AIzaSyA0KR2gj5dujlY8OMlqF833PgrYW8gnjI8";

// Load borrowed books from localStorage
let borrowedBooks = JSON.parse(localStorage.getItem("borrowedBooks")) || [];

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

// Modal close handler
document.querySelector(".close-btn").addEventListener("click", () => {
  document.getElementById("bookModal").style.display = "none";
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("bookModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadBorrowedBooks();
  updateStats();
});

/**
 * Load and display borrowed books
 */
async function loadBorrowedBooks() {
  if (borrowedBooks.length === 0) {
    showEmptyState();
    return;
  }

  // Show loading state
  const allContainer = document.getElementById("allBooksContainer");
  const overdueContainer = document.getElementById("overdueBooksContainer");
  const upcomingContainer = document.getElementById("upcomingBooksContainer");

  allContainer.innerHTML =
    '<div class="loading"><div class="spinner"></div>Memuat buku...</div>';
  overdueContainer.innerHTML = "";
  upcomingContainer.innerHTML = "";

  // Get full book data from OpenLibrary for all borrowed books
  const booksWithData = await Promise.all(
    borrowedBooks.map((book) => getFullBookData(book))
  );

  // Enrich with Google Books data
  const enrichedBooks = await Promise.all(
    booksWithData.map((book) => enrichBookDataWithGoogleBooks(book))
  );

  // Categorize books
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const allBooks = enrichedBooks.filter((b) => b);
  const overdueBooks = allBooks.filter((book) => {
    const returnDate = new Date(book.returnDate);
    return returnDate < today;
  });
  const upcomingBooks = allBooks.filter((book) => {
    const returnDate = new Date(book.returnDate);
    return returnDate >= today && returnDate <= nextWeek;
  });

  // Display all books
  displayBooks("allBooksContainer", "allEmpty", allBooks);

  // Display overdue books
  displayBooks("overdueBooksContainer", "overdueEmpty", overdueBooks);

  // Display upcoming returns
  displayBooks("upcomingBooksContainer", "upcomingEmpty", upcomingBooks);
}

/**
 * Get full book data from OpenLibrary
 */
async function getFullBookData(borrowedBook) {
  try {
    const response = await fetch(
      `https://openlibrary.org${borrowedBook.id}.json`
    );
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        id: borrowedBook.id,
        title: borrowedBook.title,
        borrowDate: borrowedBook.borrowDate,
        returnDate: borrowedBook.returnDate,
      };
    }
  } catch (error) {
    console.error("Error fetching book data:", error);
  }

  // Fallback: return basic info
  return borrowedBook;
}

/**
 * Enrich book data dengan Google Books API
 */
async function enrichBookDataWithGoogleBooks(book) {
  try {
    let googleBook = null;

    // Strategy 1: Search by ISBN
    if (book.isbn && book.isbn.length > 0) {
      const response = await fetch(
        `${GOOGLE_BOOKS_API}?q=isbn:${book.isbn[0]}&key=${GOOGLE_BOOKS_API_KEY}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        googleBook = data.items[0].volumeInfo;
      }
    }

    // Strategy 2: Search by title + author
    if (!googleBook && book.title) {
      let query = book.title;
      if (book.authors && book.authors.length > 0) {
        const author =
          typeof book.authors[0] === "object"
            ? book.authors[0].name
            : book.authors[0];
        query += ` ${author}`;
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
    return book;
  }
}

/**
 * Display books in container
 */
function displayBooks(containerId, emptyId, books) {
  const container = document.getElementById(containerId);
  const emptyElement = document.getElementById(emptyId);

  if (books.length === 0) {
    container.innerHTML = "";
    emptyElement.style.display = "block";
    return;
  }

  emptyElement.style.display = "none";
  container.innerHTML = "";

  books.forEach((book) => {
    const card = createBorrowedBookCard(book);
    container.appendChild(card);
  });
}

/**
 * Create borrowed book card with return date info
 */
function createBorrowedBookCard(book) {
  const bookId = book.id || book.key || book.title;
  const isBorrowed = true; // Ini adalah borrowed page jadi pasti dipinjam

  const card = document.createElement("div");
  card.className = "book-card borrowed";
  card.style.cursor = "pointer";
  card.onclick = (e) => {
    if (e.target.closest(".book-actions")) return;
    window.location.href = `bookdetail.html?id=${encodeURIComponent(bookId)}`;
  };

  // Get image
  let imageUrl = "https://via.placeholder.com/160x240?text=No+Cover";
  if (book.googleImage) {
    imageUrl = book.googleImage;
  } else if (book.covers && book.covers.length > 0) {
    imageUrl = `https://covers.openlibrary.org/b/id/${book.covers[0]}-M.jpg`;
  } else if (book.cover_i) {
    imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
  }

  // Get title and authors
  const title = book.title || "Tanpa Judul";
  const authors = Array.isArray(book.authors)
    ? book.authors
        .map((a) => (typeof a === "object" ? a.name : a))
        .slice(0, 2)
        .join(", ")
    : "Penulis Tidak Diketahui";

  // Get description
  let description = "Deskripsi tidak tersedia";
  if (book.googleDescription) {
    description = book.googleDescription;
  } else if (book.first_sentence && book.first_sentence[0]) {
    description = book.first_sentence[0];
  }

  // Get rating
  const rating = book.ratings_average || 0;
  const ratingCount = book.ratings_count || 0;

  // Check if overdue
  const today = new Date();
  const returnDate = new Date(book.returnDate);
  const isOverdue = returnDate < today;

  if (isOverdue) {
    card.classList.add("overdue");
  }

  card.innerHTML = `
    ${createImageHTML(imageUrl, title)}
    <div class="book-info">
      <div class="book-title">
        ${title}
        ${isOverdue ? '<span class="overdue-badge">TELAT</span>' : ""}
      </div>
      <div class="book-author">oleh ${authors}</div>
      <div class="book-description">${description.substring(0, 100)}...</div>
      <div class="book-rating">
        <span class="stars">${"⭐".repeat(Math.round(rating || 0))}</span>
        <span>${
          rating > 0
            ? `${rating.toFixed(1)} (${ratingCount})`
            : "Belum ada rating"
        }</span>
      </div>
      <div class="book-return-date ${isOverdue ? "urgent" : ""}">
        ${isOverdue ? "⚠️ " : "📅 "}
        <strong>${
          isOverdue ? "Telat kembalikan" : "Kembalikan tanggal"
        }:</strong> ${book.returnDate}
      </div>
      <div class="book-actions">
        <button class="btn btn-detail" onclick="event.stopPropagation(); showBookPreview(this)">Detail</button>
        <button class="btn btn-return" onclick="event.stopPropagation(); returnBook('${bookId}', '${title.replace(
    /'/g,
    "\\'"
  )}')">Kembalikan</button>
      </div>
    </div>
  `;

  // Store book data untuk modal
  card.bookData = {
    id: bookId,
    title: title,
    authors: authors,
    imageUrl: imageUrl,
    description: description,
    rating: rating,
    ratingCount: ratingCount,
    borrowDate: book.borrowDate,
    returnDate: book.returnDate,
    isOverdue: isOverdue,
    isBorrowed: true,
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
      <p><strong>Tanggal Pinjam:</strong> ${book.borrowDate}</p>
      <p><strong>Batas Kembalikan:</strong> <span style="color: ${
        book.isOverdue ? "#dc3545" : "#28a745"
      }; font-weight: bold;">${book.returnDate}</span></p>
      <div class="modal-rating">
        <span class="stars">${"⭐".repeat(Math.round(book.rating || 0))}</span>
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
        <button class="btn btn-return" onclick="returnBook('${
          book.id
        }', '${book.title.replace(
    /'/g,
    "\\'"
  )}'); document.getElementById('bookModal').style.display='none';">Kembalikan Buku</button>
      </div>
    </div>
  `;

  document.getElementById("bookModal").style.display = "block";
}

/**
 * Return borrowed book
 */
function returnBook(bookId, title) {
  if (!confirm(`Yakin ingin mengembalikan buku "${title}"?`)) {
    return;
  }

  const existingIndex = borrowedBooks.findIndex((b) => b.id === bookId);
  if (existingIndex > -1) {
    borrowedBooks.splice(existingIndex, 1);
    localStorage.setItem("borrowedBooks", JSON.stringify(borrowedBooks));
    alert(`✅ Buku "${title}" berhasil dikembalikan`);
    location.reload(); // Reload page to update
  }
}

/**
 * Switch tab
 */
function switchBorrowedTab(tab) {
  // Hide all tabs
  document.querySelectorAll(".borrowed-content").forEach((el) => {
    el.classList.remove("active");
  });

  // Remove active from all buttons
  document.querySelectorAll(".borrowed-tab").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  const tabId =
    tab === "all" ? "allTab" : tab === "overdue" ? "overdueTab" : "upcomingTab";
  document.getElementById(tabId).classList.add("active");

  // Add active to clicked button
  event.target.classList.add("active");
}

/**
 * Update statistics
 */
function updateStats() {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const totalBorrowed = borrowedBooks.length;
  const overdueCount = borrowedBooks.filter((book) => {
    const returnDate = new Date(book.returnDate);
    return returnDate < today;
  }).length;
  const returningSoon = borrowedBooks.filter((book) => {
    const returnDate = new Date(book.returnDate);
    return returnDate >= today && returnDate <= nextWeek;
  }).length;

  document.getElementById("totalBorrowed").textContent = totalBorrowed;
  document.getElementById("overdueCount").textContent = overdueCount;
  document.getElementById("returningSoon").textContent = returningSoon;
}

/**
 * Show empty state
 */
function showEmptyState() {
  document.getElementById("allBooksContainer").innerHTML = "";
  document.getElementById("allEmpty").style.display = "block";
  document.getElementById("overdueEmpty").style.display = "block";
  document.getElementById("upcomingEmpty").style.display = "block";

  // Hide containers
  document.getElementById("overdueBooksContainer").innerHTML = "";
  document.getElementById("upcomingBooksContainer").innerHTML = "";
}
