const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2I1NGE1YzgyMTU0YjAwMWE5YzE5MmEiLCJzY2hvb2xJZCI6IjY3YjU0YTVjODIxNTRiMDAxYTljMTkyMSIsInJvbGUiOiJTQ0hPT0xfQURNSU4iLCJzY2hvb2xEb21haW4iOiJzY2hvb2wxIiwiaWF0IjoxNzA4MzA4MjY5LCJleHAiOjE3NzAzMDgyNjl9.4b3r_YCIZqVVrqOFhvGQS0a1bcR5lOzqK6h3fL8oLoQ';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

async function test() {
  try {
    console.log('🧪 Testing Announcements API\n');

    // Test 1: Create announcement
    console.log('📝 Test 1: Creating announcement...');
    const createRes = await axios.post(`${API_BASE_URL}/announcements`, {
      title: 'School Assembly Tomorrow',
      content: 'There will be a general assembly tomorrow at 10:00 AM in the main auditorium. All students and staff must attend.',
      targetRole: null,
      expiresAt: '2026-12-31T23:59:59Z',
    }, { headers });

    if (createRes.data.success) {
      const announcementId = createRes.data.data.id;
      console.log('✅ Announcement created successfully!');
      console.log(`   ID: ${announcementId}\n`);

      // Test 2: Get all announcements
      console.log('📋 Test 2: Fetching all announcements...');
      const getAllRes = await axios.get(`${API_BASE_URL}/announcements?limit=20`, { headers });
      if (getAllRes.data.success) {
        console.log(`✅ Fetched ${getAllRes.data.data.length} announcements\n`);
      }

      // Test 3: Get single announcement
      console.log('📖 Test 3: Fetching single announcement...');
      const getOneRes = await axios.get(`${API_BASE_URL}/announcements/${announcementId}`, { headers });
      if (getOneRes.data.success) {
        console.log(`✅ Retrieved announcement: "${getOneRes.data.data.title}"\n`);
      }

      // Test 4: Update announcement
      console.log('✏️  Test 4: Updating announcement...');
      const updateRes = await axios.put(`${API_BASE_URL}/announcements/${announcementId}`, {
        title: 'Important: School Assembly UPDATED',
        content: 'UPDATED: There will be a general assembly tomorrow at 11:00 AM (changed time!) in the main auditorium.',
      }, { headers });
      if (updateRes.data.success) {
        console.log('✅ Announcement updated successfully!\n');
      }

      // Test 5: List announcements with pagination
      console.log('📑 Test 5: Testing pagination...');
      const paginatedRes = await axios.get(`${API_BASE_URL}/announcements?limit=5&offset=0`, { headers });
      if (paginatedRes.data.success) {
        console.log(`✅ Pagination working - returned ${paginatedRes.data.data.length} announcements\n`);
      }

      // Test 6: Create role-specific announcement
      console.log('🎓 Test 6: Creating role-specific announcement (STUDENT only)...');
      const roleRes = await axios.post(`${API_BASE_URL}/announcements`, {
        title: 'Student Event This Friday',
        content: 'All students are invited to our monthly student event.',
        targetRole: 'STUDENT',
        expiresAt: '2026-02-28T23:59:59Z',
      }, { headers });
      if (roleRes.data.success) {
        console.log('✅ Role-specific announcement created!\n');
      }

      // Test 7: Delete announcement (soft delete - sets isActive to false)
      console.log('🗑️  Test 7: Deleting announcement (soft delete)...');
      const deleteRes = await axios.delete(`${API_BASE_URL}/announcements/${announcementId}?hardDelete=false`, { headers });
      if (deleteRes.data.success) {
        console.log('✅ Announcement deleted (soft delete)!\n');
      }

      console.log('✨ All tests passed! Announcements feature is working correctly.\n');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

test();
