const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Test book data
const testBooks = [
  {
    isbn: '978-0-123456-78-9',
    title: 'Introduction to JavaScript',
    author: 'John Doe',
    publisher: 'Tech Publishers',
    publishedYear: 2023,
    category: 'Technology',
    totalCopies: 5,
    availableCopies: 3,
    description: 'A comprehensive guide to JavaScript programming for beginners and intermediate developers.'
  },
  {
    isbn: '978-0-987654-32-1',
    title: 'Advanced Python Programming',
    author: 'Jane Smith',
    publisher: 'Code House',
    publishedYear: 2024,
    category: 'Technology',
    totalCopies: 10,
    availableCopies: 7,
    description: 'Learn advanced Python concepts including decorators, generators, and async programming.'
  }
];

async function generateTestPDF() {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        bufferPages: true
      });
      
      const outputPath = path.join(__dirname, 'test-output.pdf');
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Library Books Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.fontSize(10).text(`Total Books: ${testBooks.length}`, { align: 'center' });
      doc.moveDown(1.5);

      // Books details
      testBooks.forEach((book, index) => {
        if (doc.y > 650) {
          doc.addPage();
        }

        const startY = doc.y;
        const leftMargin = 50;
        const rightMargin = 560;
        const lineHeight = 14;

        // Book title
        doc.fontSize(12).font('Helvetica-Bold');
        doc.fillColor('#1a56db');
        doc.text(`${index + 1}. ${book.title}`, leftMargin, startY, { 
          width: rightMargin - leftMargin,
          continued: false
        });
        doc.moveDown(0.3);

        // Line under title
        doc.strokeColor('#e5e7eb').lineWidth(1);
        doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
        doc.moveDown(0.5);

        // Book details
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

        doc.y = detailsStartY + (lineHeight * 4);

        // Description
        if (book.description) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Description:', leftMargin, doc.y);
          doc.font('Helvetica').fontSize(8).text(book.description, leftMargin, doc.y, {
            width: rightMargin - leftMargin,
            align: 'justify'
          });
        }

        doc.moveDown(0.8);

        // Separator
        if (index < testBooks.length - 1) {
          doc.strokeColor('#d1d5db').lineWidth(0.5);
          doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
          doc.moveDown(0.8);
        }
      });

      // Page numbers
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

      stream.on('finish', () => {
        console.log('✅ PDF generated successfully!');
        console.log(`📄 File saved to: ${outputPath}`);
        console.log(`📊 File size: ${fs.statSync(outputPath).size} bytes`);
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        console.error('❌ Error writing PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      reject(error);
    }
  });
}

// Run the test
console.log('🔄 Generating test PDF...');
generateTestPDF()
  .then((filePath) => {
    console.log('✅ Test completed successfully!');
    console.log(`You can open the PDF at: ${filePath}`);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
