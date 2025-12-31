# PinjamBuku. Backend Server

Backend REST API untuk sistem perpustakaan digital sekolah **PinjamBuku.**

## 📋 Fitur

- 📚 **Manajemen Buku** - CRUD operations untuk buku
- 👥 **Manajemen Pengguna** - Registrasi, login, dan profil
- 🔄 **Peminjaman Buku** - Borrow & return functionality
- 📊 **Laporan & Statistik** - Analytics dashboard
- 🔐 **Authentication** - JWT-based authentication
- 🎯 **Role-based Access** - Admin dan User roles
- 📱 **RESTful API** - Modern API design
- 💾 **MongoDB** - NoSQL database

---

## 🚀 Quick Start

### 1. Prerequisites

Pastikan sudah install:

- **Node.js** v14+ ([download](https://nodejs.org/))
- **MongoDB** ([download](https://www.mongodb.com/try/download/community) atau gunakan [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **npm** atau **yarn**

### 2. Setup Environment

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan sesuaikan configuration
```

Contoh .env:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pinjambuku
JWT_SECRET=your-super-secret-key-here
NODE_ENV=development
```

### 3. Install Dependencies

```bash
cd BackEnd
npm install
```

### 4. Start Server

**Development (dengan auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server akan berjalan di: **http://localhost:3000**

---

## 📚 API Documentation

Dokumentasi lengkap tersedia di [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Base URL

```
http://localhost:3000/api
```

### Contoh Request

**Health Check:**

```bash
curl http://localhost:3000/api/health
```

**Get All Books:**

```bash
curl http://localhost:3000/api/books
```

**Add New Book:**

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laskar Pelangi",
    "author": "Andrea Hirata",
    "publisher": "Bentang Pustaka",
    "category": "Fiction",
    "year": 2005,
    "stock": 15
  }'
```

---

## 📁 Project Structure

```
BackEnd/
├── server.js                 # Main server file
├── package.json             # Dependencies
├── .env.example            # Environment template
├── API_DOCUMENTATION.md    # API docs
├── README.md              # This file
│
├── models/                # Database schemas
│   ├── User.js
│   ├── Book.js
│   └── Borrowing.js
│
├── routes/                # API routes
│   ├── auth.js
│   ├── books.js
│   ├── users.js
│   ├── borrowings.js
│   └── reports.js
│
├── controllers/           # Business logic
│   ├── bookController.js
│   ├── userController.js
│   └── borrowingController.js
│
├── middleware/            # Custom middleware
│   ├── auth.js
│   └── validation.js
│
├── config/               # Configuration files
│   └── database.js
│
├── utils/               # Utility functions
│   ├── validators.js
│   └── helpers.js
│
└── uploads/             # File uploads
```

---

## 🔌 API Endpoints Summary

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Books

- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book detail
- `POST /api/books` - Add new book (Admin)
- `PUT /api/books/:id` - Update book (Admin)
- `DELETE /api/books/:id` - Delete book (Admin)

### Users

- `GET /api/users` - Get all users (Admin)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users` - Create new user (Admin)

### Borrowings

- `GET /api/borrowings` - Get all borrowings
- `POST /api/borrowings` - Borrow a book
- `PUT /api/borrowings/:id/return` - Return a book
- `GET /api/borrowings/:id` - Get borrowing detail

### Reports

- `GET /api/reports/borrowings` - Borrowing statistics
- `GET /api/reports/users` - User statistics

---

## 🗄️ Database Schema

### Users

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String, // 'user', 'admin'
  createdAt: Date,
  updatedAt: Date
}
```

### Books

```javascript
{
  _id: ObjectId,
  title: String,
  author: String,
  publisher: String,
  category: String,
  isbn: String,
  description: String,
  coverImage: String,
  stock: Number,
  available: Number,
  rating: Number,
  reviews: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Borrowings

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  bookId: ObjectId (ref: Book),
  borrowDate: Date,
  dueDate: Date,
  returnDate: Date,
  status: String, // 'active', 'returned', 'overdue'
  fineAmount: Number,
  returnCondition: String,
  createdAt: Date
}
```

---

## 🔐 Authentication

API menggunakan JWT (JSON Web Tokens) untuk authentication.

### Flow:

1. User login dengan email & password
2. Server mengembalikan JWT token
3. Client menyimpan token di localStorage
4. Setiap request mengirim token di header:

```
Authorization: Bearer {token}
```

---

## 🧪 Testing API

### Menggunakan Postman

1. **Import Collection:**
   - File: `BackEnd/postman_collection.json` (buat sendiri)
2. **Set Environment:**
   ```json
   {
     "base_url": "http://localhost:3000/api",
     "token": "your-jwt-token"
   }
   ```

### Menggunakan cURL

```bash
# Test health
curl http://localhost:3000/api/health

# Get books
curl http://localhost:3000/api/books

# Add book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","author":"Author","stock":5}'
```

### Menggunakan fetch (dari frontend)

```javascript
// Get all books
const response = await fetch("http://localhost:3000/api/books");
const data = await response.json();
console.log(data);

// Add book
const newBook = {
  title: "Test Book",
  author: "Test Author",
  stock: 10,
};

const response = await fetch("http://localhost:3000/api/books", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(newBook),
});

const result = await response.json();
console.log(result);
```

---

## 🔧 Development

### Install Development Dependencies

```bash
npm install --save-dev nodemon jest supertest
```

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run dev
```

---

## 🚨 Common Issues

### ❌ Port Already in Use

```bash
# Linux/Mac: Kill process
lsof -ti:3000 | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### ❌ MongoDB Connection Error

```
# Check if MongoDB is running
# Verify MONGODB_URI in .env file
# Try connecting manually:
mongo "mongodb://localhost:27017/pinjambuku"
```

### ❌ JWT Token Error

```
# Ensure JWT_SECRET is set in .env
# Check token format in Authorization header: "Bearer {token}"
```

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0"
}
```

---

## 🌐 Integration dengan Frontend

### Setup CORS

Backend sudah mengkonfigurasi CORS. Pastikan frontend URL cocok di .env:

```env
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin
```

### Example: Fetch Books dari Frontend

```javascript
// Dari file script.js frontend
const api = new BackendAPI();

async function loadBooks() {
  try {
    const response = await api.get("/books?page=1&limit=10");
    console.log("Books:", response.data);
    displayBooks(response.data);
  } catch (error) {
    console.error("Error loading books:", error);
  }
}

loadBooks();
```

---

## 📈 Performance Tips

1. **Add Pagination:**

   ```
   GET /api/books?page=1&limit=10
   ```

2. **Use Filtering:**

   ```
   GET /api/books?category=fiction&search=laskar
   ```

3. **Add Indexes di MongoDB:**

   ```javascript
   // Di models
   bookSchema.index({ title: "text", author: "text" });
   userSchema.index({ email: 1 });
   ```

4. **Enable Caching:**
   ```bash
   npm install redis
   ```

---

## 🚀 Deployment

### Deploy ke Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create pinjambuku-api

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set MONGODB_URI=your-mongodb-uri

# Deploy
git push heroku main
```

### Deploy ke AWS/DigitalOcean/VPS

```bash
# SSH ke server
ssh user@your-server-ip

# Clone repository
git clone your-repo-url

# Install & run
cd BackEnd
npm install
npm start
```

---

## 📞 Support & Contact

- **GitHub Issues:** [Create Issue](https://github.com/your-repo/issues)
- **Email:** support@pinjambuku.com
- **Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 📄 License

MIT License - feel free to use this project

---

## 🎯 Next Steps

- [ ] Implement user authentication (JWT)
- [ ] Add input validation & error handling
- [ ] Add rate limiting
- [ ] Add logging system
- [ ] Add email notifications
- [ ] Add file upload for book covers
- [ ] Add advanced search with filters
- [ ] Add unit & integration tests
- [ ] Setup CI/CD pipeline
- [ ] Deploy to production

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0  
**Maintained by:** PinjamBuku Team
