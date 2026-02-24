# Library Management System - API Documentation

## Overview

The Library Management System provides comprehensive book and loan management with import/export capabilities in multiple formats (PDF, Excel, CSV).

## Features

✅ **Book Management**
- Create, read, update, and delete books
- Search by title, author, or ISBN
- Filter by category
- Track available vs total copies

✅ **Loan Management**
- Issue books to students
- Return books with optional fines
- Renew loans
- Track loan history and overdue items

✅ **Statistics & Reporting**
- Real-time library statistics
- Category-wise book distribution
- Active and overdue loans tracking

✅ **Import/Export**
- Export books and loans to PDF, Excel, or CSV
- Bulk import books from CSV or Excel
- Download import templates
- **Advanced validation & duplicate detection**
- Comprehensive error reporting with row numbers

✅ **Data Validation**
- ISBN format validation (ISBN-10/ISBN-13)
- Required fields enforcement
- Data type and range validation
- Character limit validation
- Duplicate detection by ISBN and Title+Author

## API Endpoints

### Books

#### Get All Books
```
GET /api/v1/library/books
```

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)
- `search` (string, optional) - Search by title, author, or ISBN
- `category` (string, optional) - Filter by category
- `sortBy` (string, optional) - Sort field (default: createdAt)
- `sortOrder` (string, optional) - Sort order: asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "message": "Books retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "isbn": "978-3-16-148410-0",
        "title": "Sample Book",
        "author": "John Doe",
        "publisher": "Publisher Name",
        "publishedYear": 2023,
        "category": "Fiction",
        "totalCopies": 5,
        "availableCopies": 3,
        "description": "Book description",
        "coverImage": "https://example.com/cover.jpg",
        "schoolId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### Get Book by ID
```
GET /api/v1/library/books/:id
```

#### Create Book
```
POST /api/v1/library/books
```

**Request Body:**
```json
{
  "isbn": "978-3-16-148410-0",
  "title": "Sample Book",
  "author": "John Doe",
  "publisher": "Publisher Name",
  "publishedYear": 2023,
  "category": "Fiction",
  "totalCopies": 5,
  "description": "Book description",
  "coverImage": "https://example.com/cover.jpg"
}
```

#### Update Book
```
PUT /api/v1/library/books/:id
```

#### Delete Book
```
DELETE /api/v1/library/books/:id
```

Note: Cannot delete books with active loans.

---

### Loans

#### Get All Loans
```
GET /api/v1/library/loans
```

**Query Parameters:**
- `page` (number, optional) - Page number
- `limit` (number, optional) - Items per page
- `status` (string, optional) - Filter by status: ACTIVE, RETURNED, OVERDUE
- `studentId` (string, optional) - Filter by student
- `bookId` (string, optional) - Filter by book

**Response:**
```json
{
  "success": true,
  "message": "Loans retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "bookId": "uuid",
        "studentId": "uuid",
        "loanDate": "2024-01-01T00:00:00.000Z",
        "dueDate": "2024-01-15T00:00:00.000Z",
        "returnDate": null,
        "status": "ACTIVE",
        "fine": 0,
        "remarks": "First loan",
        "book": {
          "id": "uuid",
          "title": "Sample Book",
          "author": "John Doe",
          "isbn": "978-3-16-148410-0",
          "coverImage": "https://example.com/cover.jpg"
        },
        "student": {
          "id": "uuid",
          "user": {
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@example.com"
          }
        }
      }
    ],
    "pagination": {...}
  }
}
```

#### Create Loan (Issue Book)
```
POST /api/v1/library/loans
```

**Request Body:**
```json
{
  "bookId": "uuid",
  "studentId": "uuid",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "remarks": "First loan"
}
```

#### Return Book
```
POST /api/v1/library/loans/:id/return
```

**Request Body:**
```json
{
  "fine": 5.00
}
```

#### Renew Loan
```
POST /api/v1/library/loans/:id/renew
```

**Request Body:**
```json
{
  "dueDate": "2024-01-30T00:00:00.000Z"
}
```

---

### Statistics

#### Get Library Statistics
```
GET /api/v1/library/statistics
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalBooks": 150,
    "totalCopies": 500,
    "availableCopies": 350,
    "activeLoans": 150,
    "overdueLoans": 15,
    "totalLoans": 1200,
    "categories": [
      {
        "category": "Fiction",
        "count": 50
      },
      {
        "category": "Science",
        "count": 30
      }
    ]
  }
}
```

---

### Export

#### Export Books
```
GET /api/v1/library/export/books?format=excel
```

**Query Parameters:**
- `format` (string, required) - Export format: `excel`, `pdf`, or `csv`

**Response:**
- Content-Type: Appropriate MIME type
- Content-Disposition: attachment with filename
- Body: File binary data

#### Export Loans
```
GET /api/v1/library/export/loans?format=pdf
```

**Query Parameters:**
- `format` (string, required) - Export format: `excel`, `pdf`, or `csv`

---

### Import

#### Import Books (Bulk Upload)
```
POST /api/v1/library/import/books
```

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (CSV or Excel file, max 5MB)

**CSV Format:**
```csv
ISBN,Title,Author,Publisher,Published Year,Category,Total Copies,Description
978-3-16-148410-0,Sample Book,John Doe,Publisher,2023,Fiction,5,Description here
```

**Excel Format:**
Same columns as CSV in the first worksheet.

**Column Requirements:**
- **ISBN** (Optional): Valid ISBN-10 or ISBN-13 format
- **Title** (Required): Maximum 255 characters
- **Author** (Required): Maximum 255 characters  
- **Publisher** (Optional): Maximum 255 characters
- **Published Year** (Optional): Integer between 1000 and current year + 1
- **Category** (Optional): Maximum 100 characters
- **Total Copies** (Optional): Positive integer, minimum 1, defaults to 1
- **Description** (Optional): Maximum 2000 characters

**Validation & Duplicate Detection:**
- Required fields validation (Title, Author)
- ISBN format validation (if provided)
- Published year range validation
- Total copies must be positive integer
- **Duplicate Detection:**
  - By ISBN (if same ISBN exists)
  - By Title + Author combination (case-insensitive)
  - Duplicates are skipped and reported

**Response:**
```json
{
  "success": true,
  "message": "Import completed",
  "data": {
    "successCount": 95,
    "errorCount": 3,
    "skippedCount": 2,
    "success": [
      {
        "row": 2,
        "id": "uuid",
        "title": "Sample Book",
        "isbn": "978-3-16-148410-0",
        "author": "John Doe"
      }
    ],
    "errors": [
      {
        "row": 5,
        "title": "Invalid Book",
        "isbn": "N/A",
        "error": "Title is required and cannot be empty"
      },
      {
        "row": 8,
        "title": "Bad Year Book",
        "isbn": "978-1234567890",
        "error": "Invalid published year. Must be between 1000 and 2027"
      }
    ],
    "skipped": [
      {
        "row": 10,
        "title": "Duplicate Book",
        "isbn": "978-3-16-148410-0",
        "reason": "Duplicate ISBN: 978-3-16-148410-0"
      },
      {
        "row": 15,
        "title": "Another Duplicate",
        "isbn": "N/A",
        "reason": "Duplicate book: \"Sample Book\" by John Doe"
      }
    ]
  }
}
```

**Import Summary:**
- `successCount`: Number of books successfully imported
- `errorCount`: Number of books with validation errors
- `skippedCount`: Number of duplicate books skipped
- `success`: Array of successfully imported books with row numbers
- `errors`: Array of validation errors with row numbers and error messages
- `skipped`: Array of skipped duplicates with row numbers and reasons

#### Download Import Template
```
GET /api/v1/library/template?format=excel
```

**Query Parameters:**
- `format` (string, required) - Template format: `excel` or `csv`

**Response:**
- Downloads template file with sample data

---

## Frontend Integration

### Using the Library Service

```typescript
import { libraryService } from '@/services/libraryService';

// Get books with search and pagination
const response = await libraryService.getBooks(1, 20, 'Harry Potter', 'Fiction');

// Create a new book
const book = await libraryService.createBook({
  isbn: '978-3-16-148410-0',
  title: 'Sample Book',
  author: 'John Doe',
  category: 'Fiction',
  totalCopies: 5
});

// Issue a book
const loan = await libraryService.createLoan({
  bookId: 'book-uuid',
  studentId: 'student-uuid',
  dueDate: '2024-01-15T00:00:00.000Z'
});

// Export books to Excel
await libraryService.exportBooks('excel');

// Import books from file
const file = event.target.files[0];
const result = await libraryService.importBooks(file);

// Download template
await libraryService.downloadTemplate('excel');
```

---

## Export/Import UI Components

### Export Buttons Component

```tsx
'use client';

import { useState } from 'react';
import { libraryService } from '@/services/libraryService';

export function ExportButtons({ type }: { type: 'books' | 'loans' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      setLoading(true);
      if (type === 'books') {
        await libraryService.exportBooks(format);
      } else {
        await libraryService.exportLoans(format);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('excel')}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Export to Excel
      </button>
      <button
        onClick={() => handleExport('pdf')}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Export to PDF
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Export to CSV
      </button>
    </div>
  );
}
```

### Import Component

```tsx
'use client';

import { useState } from 'react';
import { libraryService } from '@/services/libraryService';

export function ImportBooks() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const response = await libraryService.importBooks(file);
      setResult(response.data.data);
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(error.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      await libraryService.downloadTemplate(format);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => handleDownloadTemplate('excel')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Download Excel Template
        </button>
        <button
          onClick={() => handleDownloadTemplate('csv')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Download CSV Template
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Upload CSV or Excel File
        </label>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {loading && <p className="text-blue-600">Importing...</p>}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800">Import Complete!</h3>
          <p className="text-green-700">
            Successfully imported: {result.successCount} books
          </p>
          {result.errorCount > 0 && (
            <p className="text-red-600">
              Failed: {result.errorCount} books
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Database Schema

```prisma
model Book {
  id              String   @id @default(uuid())
  schoolId        String
  title           String
  author          String
  isbn            String?
  category        String?
  totalCopies     Int      @default(1)
  availableCopies Int      @default(1)
  publisher       String?
  publishedYear   Int?
  description     String?
  coverImage      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  school School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  loans  Loan[]
}

model Loan {
  id         String     @id @default(uuid())
  schoolId   String
  bookId     String
  studentId  String
  loanDate   DateTime   @default(now())
  dueDate    DateTime
  returnDate DateTime?
  status     LoanStatus @default(ACTIVE)
  fine       Float?     @default(0)
  remarks    String?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  school  School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  book    Book    @relation(fields: [bookId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
}

enum LoanStatus {
  ACTIVE
  RETURNED
  OVERDUE
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Error Codes:**
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 404: Not Found
- 500: Internal Server Error

---

## Security

- All endpoints require authentication via JWT token
- Multi-tenancy enforced at database level
- File uploads limited to 5MB
- Only CSV and Excel files accepted for import
- Rate limiting applied to prevent abuse

---

## Performance Considerations

- Pagination recommended for large datasets
- Export operations may take longer for large datasets
- Import validates data before insertion
- Failed imports provide detailed error reports
- Book availability updated atomically in transactions

---

## Import Validation Rules

### Required Fields
- **Title**: Must be provided and cannot be empty
- **Author**: Must be provided and cannot be empty

### Optional Fields with Validation

#### ISBN
- **Format**: Must be valid ISBN-10 or ISBN-13
- **Examples**: 
  - Valid: `978-3-16-148410-0`, `0-13-468599-2`
  - Invalid: `123-456`, `ABC-DEF-GHI`
- **Note**: Hyphens and spaces are allowed and will be processed correctly

#### Published Year
- **Type**: Integer
- **Range**: 1000 to (Current Year + 1)
- **Example**: For 2026, valid range is 1000-2027

#### Total Copies
- **Type**: Integer
- **Minimum**: 1
- **Default**: 1 if not provided
- **Note**: Must be a positive whole number

#### Character Limits
| Field | Maximum Length |
|-------|----------------|
| Title | 255 characters |
| Author | 255 characters |
| Publisher | 255 characters |
| Category | 100 characters |
| Description | 2000 characters |

### Duplicate Detection

Books are considered duplicates if they match on:

1. **ISBN Match**: Same ISBN (if both books have ISBN)
   - Example: Both have ISBN `978-3-16-148410-0`

2. **Title + Author Match**: Same title AND author (case-insensitive)
   - Example: "To Kill a Mockingbird" by "Harper Lee"
   - Matches: "to kill a mockingbird" by "HARPER LEE"

**Duplicate Behavior:**
- Duplicates found in existing database → Skipped
- Duplicates found within import file → Skipped  
- All duplicates are reported in the `skipped` array with reasons

### Import Error Examples

```json
// Validation Error - Missing Required Field
{
  "row": 5,
  "title": "N/A",
  "isbn": "978-1234567890",
  "error": "Title is required and cannot be empty"
}

// Validation Error - Invalid ISBN
{
  "row": 8,
  "title": "Sample Book",
  "isbn": "123-456",
  "error": "Invalid ISBN format. Must be ISBN-10 or ISBN-13"
}

// Validation Error - Invalid Year
{
  "row": 12,
  "title": "Future Book",
  "isbn": "978-1234567890",
  "error": "Invalid published year. Must be between 1000 and 2027"
}

// Validation Error - Invalid Copies
{
  "row": 15,
  "title": "No Copies Book",
  "isbn": "978-1234567890",
  "error": "Total copies must be a positive integer (minimum 1)"
}

// Duplicate - ISBN Match
{
  "row": 20,
  "title": "Duplicate Book",
  "isbn": "978-3-16-148410-0",
  "reason": "Duplicate ISBN: 978-3-16-148410-0"
}

// Duplicate - Title+Author Match
{
  "row": 25,
  "title": "Sample Book",
  "isbn": "N/A",
  "reason": "Duplicate book: \"Sample Book\" by John Doe"
}
```

### Best Practices for Import

1. **Download Template First**: Always start with the official template
2. **Validate Data**: Check your data before import:
   - Ensure Title and Author are filled for all rows  
   - Verify ISBN format if provided
   - Check year values are reasonable
   - Ensure Total Copies is at least 1
3. **Check for Duplicates**: Review existing library before importing
4. **Review Results**: Always check the import response for errors and skipped items
5. **Incremental Imports**: For large datasets, consider importing in batches

### Import Response Interpretation

```json
{
  "successCount": 95,   // Books successfully added
  "errorCount": 3,      // Books with validation errors (not imported)
  "skippedCount": 2     // Duplicate books (not imported)
}
```

- **Total Rows Processed**: successCount + errorCount + skippedCount
- **Review Errors**: Fix validation issues in your file and re-import
- **Review Skipped**: Duplicates are intentionally skipped to prevent duplicate entries
