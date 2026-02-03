const exportService = require('./src/utils/exportService');
const fs = require('fs');

const testBook = {
  id: "30cae0fd-86c7-4e8b-998f-32ac9f759163",
  schoolId: "53069497-638b-4ef7-a2ee-c645fc9297f8",
  title: "test",
  author: "testing",
  isbn: "testing",
  category: "Technology",
  totalCopies: 1,
  availableCopies: 1,
  publisher: "test",
  publishedYear: 2026,
  description: "testing the api"
};

async function testExports() {
  console.log('Testing CSV Export...');
  const csv = exportService.exportBooksToCSV([testBook]);
  console.log('CSV Content:');
  console.log(csv);
  fs.writeFileSync('test-csv-output.csv', csv);
  console.log('✅ CSV saved to test-csv-output.csv\n');

  console.log('Testing PDF Export...');
  try {
    const pdfBuffer = await exportService.exportBooksToPDF([testBook]);
    console.log('PDF Buffer length:', pdfBuffer.length);
    fs.writeFileSync('test-pdf-output.pdf', pdfBuffer);
    console.log('✅ PDF saved to test-pdf-output.pdf\n');
  } catch (error) {
    console.error('❌ PDF Error:', error);
  }

  console.log('Testing Excel Export...');
  try {
    const workbook = await exportService.exportBooksToExcel([testBook]);
    const excelBuffer = await workbook.xlsx.writeBuffer();
    console.log('Excel Buffer length:', excelBuffer.length);
    fs.writeFileSync('test-excel-output.xlsx', excelBuffer);
    console.log('✅ Excel saved to test-excel-output.xlsx\n');
  } catch (error) {
    console.error('❌ Excel Error:', error);
  }
}

testExports().then(() => {
  console.log('All tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
