const express = require("express");
const router = express.Router();
const libraryController = require("../controllers/libraryController");
const { authenticate } = require("../middleware/auth");
const upload = require("../config/upload");

// All routes require authentication
router.use(authenticate);

// ==================== BOOKS ====================

// Get all books
router.get("/books", libraryController.getBooks);

// Get book by ID
router.get("/books/:id", libraryController.getBookById);

// Create new book
router.post("/books", libraryController.createBook);

// Update book
router.put("/books/:id", libraryController.updateBook);

// Delete book
router.delete("/books/:id", libraryController.deleteBook);

// ==================== LOANS ====================

// Get all loans
router.get("/loans", libraryController.getLoans);

// Create new loan
router.post("/loans", libraryController.createLoan);

// Return loan
router.post("/loans/:id/return", libraryController.returnLoan);

// Renew loan
router.post("/loans/:id/renew", libraryController.renewLoan);

// ==================== STATISTICS ====================

// Get library statistics
router.get("/statistics", libraryController.getStatistics);

// ==================== IMPORT/EXPORT ====================

// Export books
router.get("/export/books", libraryController.exportBooks);

// Export loans
router.get("/export/loans", libraryController.exportLoans);

// Import books (CSV or Excel)
router.post(
  "/import/books",
  upload.single("file"),
  libraryController.importBooks,
);

// Download import template
router.get("/template", libraryController.downloadTemplate);

module.exports = router;
