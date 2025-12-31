// =============== NAVIGATION & PAGE ROUTING ===============
document.addEventListener("DOMContentLoaded", () => {
  initializeSidebar();
  initializeModals();
  loadDashboardData();
});

// Sidebar navigation
function initializeSidebar() {
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const sections = document.querySelectorAll(".page-section");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);

      // Hide all sections
      sections.forEach((section) => {
        section.style.display = "none";
      });

      // Show target section
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.style.display = "block";
      }

      // Update active link
      sidebarLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

// =============== MODAL MANAGEMENT ===============
function openAddBookModal() {
  document.getElementById("bookModal").classList.add("active");
}

function openAddUserModal() {
  document.getElementById("userModal").classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

function initializeModals() {
  // Close modal ketika klik di area luar
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });

  // Form submissions
  document.getElementById("bookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addBook();
  });

  document.getElementById("userForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addUser();
  });
}

// =============== BOOKS MANAGEMENT ===============
let books = JSON.parse(localStorage.getItem("adminBooks")) || [];

function addBook() {
  const form = document.getElementById("bookForm");
  const formData = new FormData(form);

  const newBook = {
    id: Date.now(),
    title: formData.get("title") || "Book Title",
    author: formData.get("author") || "Author",
    publisher: formData.get("publisher") || "Publisher",
    category: formData.get("category") || "Category",
    year: formData.get("year") || new Date().getFullYear(),
    stock: parseInt(formData.get("stock")) || 0,
    createdAt: new Date().toISOString(),
  };

  books.push(newBook);
  localStorage.setItem("adminBooks", JSON.stringify(books));

  form.reset();
  closeModal("bookModal");
  showNotification("Buku berhasil ditambahkan!", "success");
  loadBooks();
}

function loadBooks() {
  // Load books data
  console.log("Books loaded:", books);
}

// =============== USERS MANAGEMENT ===============
let users = JSON.parse(localStorage.getItem("adminUsers")) || [];

function addUser() {
  const form = document.getElementById("userForm");
  const inputs = form.querySelectorAll("input, select");

  const newUser = {
    id: Date.now(),
    name: inputs[0].value,
    email: inputs[1].value,
    password: inputs[2].value, // In production, hash this!
    role: inputs[3].value,
    createdAt: new Date().toLocaleDateString("id-ID"),
  };

  users.push(newUser);
  localStorage.setItem("adminUsers", JSON.stringify(users));

  form.reset();
  closeModal("userModal");
  showNotification("Pengguna berhasil ditambahkan!", "success");
  loadUsers();
}

function loadUsers() {
  // Load users data
  console.log("Users loaded:", users);
}

// =============== DASHBOARD DATA ===============
function loadDashboardData() {
  updateStats();
  loadRecentBorrowings();
}

function updateStats() {
  // Update statistics
  const stats = {
    totalBooks: 1234,
    totalUsers: 567,
    activeBorrowings: 89,
    overdue: 12,
  };

  return stats;
}

function loadRecentBorrowings() {
  // Load recent borrowing data
  const borrowings = JSON.parse(localStorage.getItem("borrowedBooks")) || [];
  console.log("Recent borrowings:", borrowings);
}

// =============== NOTIFICATIONS ===============
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === "success" ? "#10b981" : "#6366f1"};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// =============== LOGOUT ===============
document.querySelector(".logout-btn")?.addEventListener("click", () => {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    localStorage.removeItem("adminLogin");
    window.location.href = "../index.html";
  }
});

// =============== API INTEGRATION ===============

/**
 * Backend API Service
 * Untuk integrasi dengan backend server sebenarnya
 */
class BackendAPI {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.token = localStorage.getItem("authToken");
  }

  /**
   * GET request
   */
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error("GET request failed:", error);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error("POST request failed:", error);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error("PUT request failed:", error);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error("DELETE request failed:", error);
      throw error;
    }
  }
}

// Instantiate API service
const api = new BackendAPI();

// =============== ANIMATION STYLES ===============
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(400px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }
`;
document.head.appendChild(style);
