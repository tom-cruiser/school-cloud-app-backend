# Library Import Template Guide

## Overview
This guide explains how to prepare Excel or CSV files for bulk importing books into the school library system.

## Quick Start

1. **Download the template** from the system:
   - Navigate to Library > Import Books
   - Click "Download Template" and choose Excel or CSV format

2. **Fill in your data** following the column structure below

3. **Upload the file** to import your books

## File Format Requirements

### Supported Formats
- **CSV** (.csv) - Comma-separated values
- **Excel** (.xlsx, .xls) - Microsoft Excel workbook

### Maximum File Size
- 5 MB per upload

## Column Structure

| # | Column Name | Required | Data Type | Max Length | Notes |
|---|-------------|----------|-----------|------------|-------|
| 1 | **ISBN** | Optional | String | - | ISBN-10 or ISBN-13 format |
| 2 | **Title** | **Required** | String | 255 | Book title |
| 3 | **Author** | **Required** | String | 255 | Author name |
| 4 | **Publisher** | Optional | String | 255 | Publisher name |
| 5 | **Published Year** | Optional | Integer | - | 1000 to 2027 |
| 6 | **Category** | Optional | String | 100 | Fiction, Science, etc. |
| 7 | **Total Copies** | Optional | Integer | - | Minimum 1 (default: 1) |
| 8 | **Description** | Optional | String | 2000 | Book description |

## Validation Rules

### Required Fields
✅ **Title** - Cannot be empty  
✅ **Author** - Cannot be empty

### Optional Fields with Validation

#### ISBN
- Format: Valid ISBN-10 or ISBN-13
- Hyphens and spaces are allowed: `978-3-16-148410-0` ✅
- Invalid formats will be rejected: `123-456` ❌
- Can be left empty if ISBN is unknown

#### Published Year
- Must be between 1000 and current year + 1 (currently 1000-2027)
- Examples: `1984` ✅, `2023` ✅, `3000` ❌

#### Total Copies
- Must be a positive integer (minimum 1)
- Examples: `1` ✅, `10` ✅, `0` ❌, `-5` ❌

## Duplicate Detection

The system automatically detects and skips duplicates based on:

### 1. ISBN Match
If a book with the same ISBN already exists, it will be skipped.
```
Existing: ISBN 978-3-16-148410-0
Import:   ISBN 978-3-16-148410-0  → SKIPPED ⚠️
```

### 2. Title + Author Match (Case-Insensitive)
If a book with the same title AND author exists, it will be skipped.
```
Existing: "To Kill a Mockingbird" by "Harper Lee"
Import:   "to kill a mockingbird" by "HARPER LEE"  → SKIPPED ⚠️
```

### Duplicates are NOT errors
- They are reported in the `skipped` array
- Original books remain unchanged
- No data loss occurs

## Example CSV Data

```csv
ISBN,Title,Author,Publisher,Published Year,Category,Total Copies,Description
978-3-16-148410-0,Sample Book,John Doe,Sample Publisher,2023,Fiction,5,A great book
978-0-545-01022-1,Harry Potter,J.K. Rowling,Bloomsbury,1997,Fantasy,10,First in series
,No ISBN Book,Jane Smith,Test Pub,2020,Science,3,ISBN is optional
```

## Common Import Errors

### ❌ Missing Required Field
```
Error: "Title is required and cannot be empty"
Fix: Ensure every row has a Title
```

### ❌ Invalid ISBN Format
```
Error: "Invalid ISBN format. Must be ISBN-10 or ISBN-13"
Fix: Use proper ISBN format (978-X-XX-XXXXXX-X) or leave empty
```

### ❌ Invalid Year
```
Error: "Invalid published year. Must be between 1000 and 2027"
Fix: Use a valid 4-digit year within range
```

### ❌ Invalid Copies
```
Error: "Total copies must be a positive integer (minimum 1)"
Fix: Use whole numbers >= 1 (e.g., 1, 5, 10)
```

## Import Response

After uploading, you'll receive a detailed report:

```json
{
  "successCount": 95,     // Books successfully imported
  "errorCount": 3,        // Books with validation errors
  "skippedCount": 2,      // Duplicate books skipped
  "success": [...],       // List of imported books with row numbers
  "errors": [...],        // List of errors with row numbers and reasons
  "skipped": [...]        // List of skipped duplicates with reasons
}
```

### Understanding the Response

**Success** ✅
- Books were added to the library
- Each entry shows the row number and book ID

**Errors** ❌
- Books failed validation and were NOT imported
- Review the error messages and fix your data
- Re-upload after corrections

**Skipped** ⚠️
- Duplicate books that already exist
- These are intentionally skipped (not errors)
- No action needed unless wrong books were detected

## Best Practices

### ✅ DO:
1. Download and use the official template
2. Keep headers in the first row (required)
3. Start data from row 2
4. Fill in Title and Author for every book
5. Use valid ISBN formats when available
6. Check for existing books before importing
7. Review the import report after upload
8. Import in smaller batches (100-500 books) for better error tracking

### ❌ DON'T:
1. Remove or rename column headers
2. Leave Title or Author columns empty
3. Use invalid characters in required fields
4. Exceed character limits
5. Upload files larger than 5MB
6. Use non-CSV/Excel formats

## Step-by-Step Import Process

### Step 1: Prepare Your Data
```
1. Gather your book information
2. Download the template from the system
3. Fill in your data row by row
4. Verify required fields are complete
```

### Step 2: Validate Before Upload
```
✓ All rows have Title and Author
✓ ISBN formats are valid (if provided)
✓ Published years are reasonable
✓ Total copies are positive numbers
✓ No special characters in critical fields
```

### Step 3: Upload
```
1. Navigate to Library > Import Books
2. Click "Choose File"
3. Select your CSV or Excel file
4. Click "Upload" or "Import"
```

### Step 4: Review Results
```
1. Check the import summary
2. Review any errors and fix them
3. Check skipped duplicates
4. Re-import corrected rows if needed
```

## Sample Data

See `library-import-example.csv` for a complete example with 20 sample books demonstrating:
- Valid ISBN formats
- Books without ISBN (valid)
- Various categories
- Different publishers
- Mix of classic and modern books

## Support

For additional help:
- Check the API documentation: `LIBRARY_API_DOCUMENTATION.md`
- Contact system administrator
- Review error messages in import responses

## Technical Details

### File Processing
1. File uploaded via multipart/form-data
2. CSV parsed with automatic header detection
3. Excel files read from first worksheet
4. Each row validated independently
5. Duplicates checked against existing library
6. Results returned with detailed breakdown

### Security
- File size limited to 5MB
- Only .csv and .xlsx/.xls files accepted
- Authentication required
- Multi-tenancy enforced (your books go to your school only)

### Performance
- Large imports (1000+ books) may take 30-60 seconds
- Progress is atomic - partial imports are supported
- All successfully imported books are committed
- Failed/skipped books don't affect successful imports
