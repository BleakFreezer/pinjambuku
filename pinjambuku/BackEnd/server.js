/**
 * PinjamBuku Backend Server
 * Main server entry point
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// =============== MIDDLEWARE ===============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============== ENVIRONMENT VARIABLES ===============
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pinjambuku";
const NODE_ENV = process.env.NODE_ENV || "development";

// =============== DATABASE CONNECTION ===============
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// =============== MODELS ===============

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,
});

const User = mongoose.model("User", userSchema);

// Book Schema
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
  },
  publisher: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    default: "",
  },
  year: {
    type: Number,
  },
  isbn: {
    type: String,
    unique: true,
  },
  description: String,
  coverImage: String,
  stock: {
    type: Number,
    default: 0,
  },
  available: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      rating: Number,
      comment: String,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Book = mongoose.model("Book", bookSchema);

// Borrowing Schema
const borrowingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  borrowDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  returnDate: Date,
  status: {
    type: String,
    enum: ["active", "returned", "overdue"],
    default: "active",
  },
  fineAmount: {
    type: Number,
    default: 0,
  },
  returnCondition: {
    type: String,
    enum: ["good", "fair", "damaged"],
    default: "good",
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Borrowing = mongoose.model("Borrowing", borrowingSchema);

// =============== ROUTES ===============

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    environment: NODE_ENV,
    timestamp: new Date(),
  });
});

// Books Routes
app.get("/api/books", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const books = await Book.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      data: books,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: newBook,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Users Routes
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Borrowing Routes
app.get("/api/borrowings", async (req, res) => {
  try {
    const { status, userId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;

    const borrowings = await Borrowing.find(query)
      .populate("userId", "name email")
      .populate("bookId", "title author")
      .sort({ borrowDate: -1 });

    res.json({
      success: true,
      data: borrowings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/borrowings", async (req, res) => {
  try {
    const { userId, bookId, durationDays = 14 } = req.body;

    // Check if book is available
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) {
      return res.status(400).json({
        success: false,
        error: "Book is not available",
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + durationDays);

    const borrowing = new Borrowing({
      userId,
      bookId,
      dueDate,
    });

    await borrowing.save();

    // Update book availability
    book.available -= 1;
    await book.save();

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: borrowing,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Return Book
app.put("/api/borrowings/:id/return", async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id);
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        error: "Borrowing record not found",
      });
    }

    borrowing.returnDate = new Date();
    borrowing.status = "returned";
    borrowing.returnCondition = req.body.returnCondition || "good";

    await borrowing.save();

    // Update book availability
    const book = await Book.findById(borrowing.bookId);
    if (book) {
      book.available += 1;
      await book.save();
    }

    res.json({
      success: true,
      message: "Book returned successfully",
      data: borrowing,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Reports
app.get("/api/reports/borrowings", async (req, res) => {
  try {
    const stats = {
      totalBorrowings: await Borrowing.countDocuments(),
      activeBorrowings: await Borrowing.countDocuments({ status: "active" }),
      returnedItems: await Borrowing.countDocuments({ status: "returned" }),
      overdueItems: await Borrowing.countDocuments({ status: "overdue" }),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/reports/users", async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      adminUsers: await User.countDocuments({ role: "admin" }),
      regularUsers: await User.countDocuments({ role: "user" }),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: NODE_ENV === "development" ? err.message : undefined,
  });
});

// =============== START SERVER ===============
app.listen(PORT, () => {
  console.log("");
  console.log("🚀 PinjamBuku Backend Server");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`📊 Database: ${MONGODB_URI}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
});

module.exports = app;
