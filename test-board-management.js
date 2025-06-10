const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_DATA = {
  address: {
    street: "123 Test Street",
    postal_code: "12345",
    city_id: 1 // Make sure this city exists in your database
  },
  board: {
    name: "Test Board Optimized",
    abbreviation: "TBO"
  },
  instructionMediums: [
    { name: "English" },
    { name: "Hindi" }
  ],
  standards: [
    { name: "Class 1" },
    { name: "Class 2" },
    { name: "Class 3" }
  ],
  subjects: [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English Literature" }
  ]
};

// You'll need to replace this with a valid JWT token
const AUTH_TOKEN = 'your-jwt-token-here';

async function testBoardManagement() {
  try {
    console.log('🚀 Testing Board Management Endpoint...\n');

    // Test 1: Create Board
    console.log('📝 Test 1: Creating board with all related entities...');
    const startTime = Date.now();
    
    const createResponse = await axios.post(
      `${API_BASE_URL}/board-management`,
      TEST_DATA,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const createTime = Date.now() - startTime;
    console.log(`✅ Board created successfully in ${createTime}ms`);
    console.log(`📊 Created board ID: ${createResponse.data.board.id}`);
    console.log(`📊 Created ${createResponse.data.instruction_mediums.length} instruction mediums`);
    console.log(`📊 Created ${createResponse.data.standards.length} standards`);
    console.log(`📊 Created ${createResponse.data.subjects.length} subjects\n`);

    const boardId = createResponse.data.board.id;

    // Test 2: Get All Boards
    console.log('📋 Test 2: Fetching all boards...');
    const getAllStartTime = Date.now();
    
    const getAllResponse = await axios.get(
      `${API_BASE_URL}/board-management`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const getAllTime = Date.now() - getAllStartTime;
    console.log(`✅ Fetched ${getAllResponse.data.length} boards in ${getAllTime}ms\n`);

    // Test 3: Get Single Board
    console.log('🔍 Test 3: Fetching single board...');
    const getOneStartTime = Date.now();
    
    const getOneResponse = await axios.get(
      `${API_BASE_URL}/board-management/${boardId}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const getOneTime = Date.now() - getOneStartTime;
    console.log(`✅ Fetched board details in ${getOneTime}ms`);
    console.log(`📊 Board: ${getOneResponse.data.board.name}`);
    console.log(`📊 Address: ${getOneResponse.data.address.street}\n`);

    // Test 4: Update Board
    console.log('✏️ Test 4: Updating board...');
    const updateStartTime = Date.now();
    
    const updateData = {
      board: {
        name: "Updated Test Board Optimized",
        abbreviation: "UTBO"
      },
      address: {
        street: "456 Updated Street"
      }
    };

    const updateResponse = await axios.put(
      `${API_BASE_URL}/board-management/${boardId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const updateTime = Date.now() - updateStartTime;
    console.log(`✅ Board updated successfully in ${updateTime}ms`);
    console.log(`📊 Updated name: ${updateResponse.data.board.name}\n`);

    // Test 5: Delete Board
    console.log('🗑️ Test 5: Deleting board...');
    const deleteStartTime = Date.now();
    
    const deleteResponse = await axios.delete(
      `${API_BASE_URL}/board-management/${boardId}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const deleteTime = Date.now() - deleteStartTime;
    console.log(`✅ Board deleted successfully in ${deleteTime}ms`);
    console.log(`📊 ${deleteResponse.data.message}\n`);

    // Summary
    console.log('🎉 All tests completed successfully!');
    console.log('📈 Performance Summary:');
    console.log(`   - Create: ${createTime}ms`);
    console.log(`   - Get All: ${getAllTime}ms`);
    console.log(`   - Get One: ${getOneTime}ms`);
    console.log(`   - Update: ${updateTime}ms`);
    console.log(`   - Delete: ${deleteTime}ms`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure to update the AUTH_TOKEN with a valid JWT token');
      console.log('   You can get one by logging in through the frontend or API');
    }
    
    if (error.response?.status === 400) {
      console.log('\n💡 Tip: Make sure the city_id in TEST_DATA exists in your database');
      console.log('   Check your cities table and update the city_id accordingly');
    }
  }
}

// Instructions for running the test
console.log('🔧 Board Management API Test Script');
console.log('=====================================');
console.log('Before running this test:');
console.log('1. Make sure your backend server is running on http://localhost:3000');
console.log('2. Update the AUTH_TOKEN variable with a valid JWT token');
console.log('3. Update the city_id in TEST_DATA to match an existing city in your database');
console.log('4. Run: node test-board-management.js\n');

// Uncomment the line below to run the test
// testBoardManagement(); 