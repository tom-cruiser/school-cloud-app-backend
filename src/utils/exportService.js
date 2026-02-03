const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { parse } = require('csv-parse/sync');

class ExportService {
  // ==================== EXCEL EXPORT ====================
  
  async exportBooksToExcel(books) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Books');

    // Define columns
    worksheet.columns = [
      { header: 'ISBN', key: 'isbn', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 25 },
      { header: 'Publisher', key: 'publisher', width: 20 },
      { header: 'Published Year', key: 'publishedYear', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Total Copies', key: 'totalCopies', width: 15 },
      { header: 'Available Copies', key: 'availableCopies', width: 15 },
      { header: 'Description', key: 'description', width: 40 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data
    books.forEach(book => {
      worksheet.addRow({
        isbn: book.isbn || '',
        title: book.title,
        author: book.author,
        publisher: book.publisher || '',
        publishedYear: book.publishedYear || '',
        category: book.category || '',
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        description: book.description || ''
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'I1'
    };

    return workbook;
  }

  async exportLoansToExcel(loans) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Loans');

    // Define columns
    worksheet.columns = [
      { header: 'Book Title', key: 'bookTitle', width: 30 },
      { header: 'ISBN', key: 'isbn', width: 15 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Student Email', key: 'studentEmail', width: 25 },
      { header: 'Loan Date', key: 'loanDate', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Return Date', key: 'returnDate', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Fine', key: 'fine', width: 10 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data
    loans.forEach(loan => {
      const studentName = loan.student?.user 
        ? `${loan.student.user.firstName} ${loan.student.user.lastName}`
        : 'N/A';
      
      worksheet.addRow({
        bookTitle: loan.book?.title || 'N/A',
        isbn: loan.book?.isbn || '',
        studentName,
        studentEmail: loan.student?.user?.email || '',
        loanDate: this.formatDate(loan.loanDate),
        dueDate: this.formatDate(loan.dueDate),
        returnDate: loan.returnDate ? this.formatDate(loan.returnDate) : '',
        status: loan.status,
        fine: loan.fine || 0,
        remarks: loan.remarks || ''
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'J1'
    };

    return workbook;
  }

  // ==================== PDF EXPORT ====================

  async exportBooksToPDF(books) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 40,
          size: 'A4',
          bufferPages: true
        });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Library Books Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.fontSize(10).text(`Total Books: ${books.length}`, { align: 'center' });
        doc.moveDown(1.5);

        // Books details - Card layout
        books.forEach((book, index) => {
          // Check if we need a new page (reserve 180px for each book card)
          if (doc.y > 650) {
            doc.addPage();
          }

          const startY = doc.y;
          const leftMargin = 50;
          const rightMargin = 560;
          const lineHeight = 14;

          // Book number and title
          doc.fontSize(12).font('Helvetica-Bold');
          doc.fillColor('#1a56db');
          doc.text(`${index + 1}. ${book.title}`, leftMargin, startY, { 
            width: rightMargin - leftMargin,
            continued: false
          });
          doc.moveDown(0.3);

          // Draw a line under title
          doc.strokeColor('#e5e7eb').lineWidth(1);
          doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
          doc.moveDown(0.5);

          // Book details in two columns
          doc.fontSize(9).font('Helvetica').fillColor('#000000');
          
          const detailsStartY = doc.y;
          const col1X = leftMargin;
          const col2X = 310;
          let currentY = detailsStartY;

          // Column 1
          doc.font('Helvetica-Bold').text('ISBN:', col1X, currentY, { continued: true });
          doc.font('Helvetica').text(' ' + (book.isbn || 'N/A'), { width: 220 });
          currentY += lineHeight;

          doc.font('Helvetica-Bold').text('Author:', col1X, currentY, { continued: true });
          doc.font('Helvetica').text(' ' + (book.author || 'N/A'), { width: 220 });
          currentY += lineHeight;

          doc.font('Helvetica-Bold').text('Publisher:', col1X, currentY, { continued: true });
          doc.font('Helvetica').text(' ' + (book.publisher || 'N/A'), { width: 220 });
          currentY += lineHeight;

          doc.font('Helvetica-Bold').text('Category:', col1X, currentY, { continued: true });
          doc.font('Helvetica').text(' ' + (book.category || 'N/A'), { width: 220 });
          
          // Column 2
          currentY = detailsStartY;

          doc.font('Helvetica-Bold').text('Published Year:', col2X, currentY, { continued: true });
          doc.font('Helvetica').text(' ' + (book.publishedYear || 'N/A'), { width: 220 });
          currentY += lineHeight;

          doc.font('Helvetica-Bold').text('Total Copies:', col2X, currentY, { continued: true });
          doc.font('Helvetica').text(' ' + (book.totalCopies || 0), { width: 220 });
          currentY += lineHeight;

          doc.font('Helvetica-Bold').text('Available Copies:', col2X, currentY, { continued: true });
          doc.font('Helvetica').text(' ' + (book.availableCopies || 0), { width: 220 });
          currentY += lineHeight;

          doc.font('Helvetica-Bold').text('Status:', col2X, currentY, { continued: true });
          const status = book.availableCopies > 0 ? 'Available' : 'Out of Stock';
          doc.fillColor(book.availableCopies > 0 ? '#10b981' : '#ef4444');
          doc.font('Helvetica-Bold').text(' ' + status, { width: 220 });
          doc.fillColor('#000000');

          // Move to after both columns
          doc.y = detailsStartY + (lineHeight * 4);

          // Description (if available)
          if (book.description) {
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold').text('Description:', leftMargin, doc.y);
            doc.font('Helvetica').fontSize(8).text(book.description, leftMargin, doc.y, {
              width: rightMargin - leftMargin,
              align: 'justify'
            });
          }

          doc.moveDown(0.8);

          // Separator line between books
          if (index < books.length - 1) {
            doc.strokeColor('#d1d5db').lineWidth(0.5);
            doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
            doc.moveDown(0.8);
          }
        });

        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).font('Helvetica');
          doc.text(
            `Page ${i + 1} of ${pages.count}`,
            0,
            doc.page.height - 30,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async exportLoansToPDF(loans) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Library Loans Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Table headers
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 180;
        const col3 = 300;
        const col4 = 380;
        const col5 = 460;
        const col6 = 520;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Book', col1, tableTop);
        doc.text('Student', col2, tableTop);
        doc.text('Loan Date', col3, tableTop);
        doc.text('Due Date', col4, tableTop);
        doc.text('Status', col5, tableTop);
        doc.text('Fine', col6, tableTop);

        doc.moveTo(col1, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown();

        // Table rows
        doc.font('Helvetica').fontSize(8);
        
        loans.forEach((loan) => {
          const y = doc.y;

          // Check if we need a new page
          if (y > 700) {
            doc.addPage();
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Book', col1, 50);
            doc.text('Student', col2, 50);
            doc.text('Loan Date', col3, 50);
            doc.text('Due Date', col4, 50);
            doc.text('Status', col5, 50);
            doc.text('Fine', col6, 50);
            doc.moveTo(col1, doc.y + 5).lineTo(550, doc.y + 5).stroke();
            doc.moveDown();
            doc.font('Helvetica').fontSize(8);
          }

          const studentName = loan.student?.user 
            ? `${loan.student.user.firstName} ${loan.student.user.lastName}`
            : 'N/A';

          doc.text(loan.book?.title || 'N/A', col1, y, { width: 120, ellipsis: true });
          doc.text(studentName, col2, y, { width: 110, ellipsis: true });
          doc.text(this.formatDate(loan.loanDate), col3, y);
          doc.text(this.formatDate(loan.dueDate), col4, y);
          doc.text(loan.status, col5, y);
          doc.text(`$${loan.fine || 0}`, col6, y);

          doc.moveDown(0.5);
        });

        // Footer
        doc.fontSize(8).text(
          `Total Loans: ${loans.length}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== CSV EXPORT ====================

  exportBooksToCSV(books) {
    const headers = ['ISBN', 'Title', 'Author', 'Publisher', 'Published Year', 'Category', 'Total Copies', 'Available Copies', 'Description'];
    
    const rows = books.map(book => [
      book.isbn || '',
      book.title,
      book.author,
      book.publisher || '',
      book.publishedYear || '',
      book.category || '',
      book.totalCopies,
      book.availableCopies,
      book.description || ''
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  exportLoansToCSV(loans) {
    const headers = ['Book Title', 'ISBN', 'Student Name', 'Student Email', 'Loan Date', 'Due Date', 'Return Date', 'Status', 'Fine', 'Remarks'];
    
    const rows = loans.map(loan => {
      const studentName = loan.student?.user 
        ? `${loan.student.user.firstName} ${loan.student.user.lastName}`
        : 'N/A';

      return [
        loan.book?.title || 'N/A',
        loan.book?.isbn || '',
        studentName,
        loan.student?.user?.email || '',
        this.formatDate(loan.loanDate),
        this.formatDate(loan.dueDate),
        loan.returnDate ? this.formatDate(loan.returnDate) : '',
        loan.status,
        loan.fine || 0,
        loan.remarks || ''
      ];
    });

    return this.arrayToCSV([headers, ...rows]);
  }

  // ==================== CSV IMPORT ====================

  parseCSVForBooks(csvContent) {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      return records.map(record => ({
        isbn: record.ISBN || record.isbn || '',
        title: record.Title || record.title,
        author: record.Author || record.author,
        publisher: record.Publisher || record.publisher || null,
        publishedYear: record['Published Year'] || record.publishedYear 
          ? parseInt(record['Published Year'] || record.publishedYear) 
          : null,
        category: record.Category || record.category || null,
        totalCopies: parseInt(record['Total Copies'] || record.totalCopies || 1),
        description: record.Description || record.description || null
      }));
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  arrayToCSV(data) {
    return data.map(row => 
      row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  }

  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

module.exports = new ExportService();
