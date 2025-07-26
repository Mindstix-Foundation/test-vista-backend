const axios = require('axios');

// Test the new class analysis functionality
async function testClassAnalysis() {
  try {
    console.log('Testing class analysis API...');
    
    // You'll need to replace these with actual values from your database
    const testPaperId = 1; // Replace with actual test paper ID
    const authToken = 'your-jwt-token'; // Replace with actual teacher JWT token
    
    const response = await axios.get(
      `http://localhost:3000/test-assignments/test-paper/${testPaperId}/results`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('API Response received successfully!');
    console.log('Test Paper:', response.data.test_paper_name);
    console.log('Subject:', response.data.subject);
    console.log('Standard:', response.data.standard);
    console.log('Total Students:', response.data.total_students);
    console.log('Completed Students:', response.data.completed_students);
    
    // Check if new fields are present
    if (response.data.class_strengths) {
      console.log('\n✅ Class Strengths:', response.data.class_strengths);
    } else {
      console.log('\n❌ Class Strengths field missing');
    }
    
    if (response.data.class_weaknesses) {
      console.log('✅ Class Weaknesses:', response.data.class_weaknesses);
    } else {
      console.log('❌ Class Weaknesses field missing');
    }
    
    if (response.data.class_average_areas) {
      console.log('✅ Class Average Areas:', response.data.class_average_areas);
    } else {
      console.log('❌ Class Average Areas field missing');
    }
    
    if (response.data.class_recommendations) {
      console.log('✅ Class Recommendations:');
      response.data.class_recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    } else {
      console.log('❌ Class Recommendations field missing');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testClassAnalysis(); 