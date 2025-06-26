const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs on a different port

async function testStudentLogin() {
  try {
    console.log('Testing student login and API access...\n');

    // Test login with the student user
    console.log('1. Attempting to login as student1@gmail.com...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email_id: 'student1@gmail.com',
      password: 'password123' // You may need to adjust this password
    });

    console.log('✅ Login successful!');
    console.log('User ID:', loginResponse.data.id);
    console.log('Email:', loginResponse.data.email_id);
    console.log('Roles:', loginResponse.data.roles);
    
    const token = loginResponse.data.access_token;
    console.log('Token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('❌ No access token received');
      return;
    }

    // Test the student enrollment endpoints
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n2. Testing /student-subject-enrollments/student/my-enrollments...');
    try {
      const enrollmentsResponse = await axios.get(
        `${BASE_URL}/student-subject-enrollments/student/my-enrollments`,
        { headers }
      );
      console.log('✅ My enrollments endpoint works!');
      console.log('Enrollments count:', enrollmentsResponse.data.length);
    } catch (error) {
      console.log('❌ My enrollments endpoint failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }

    console.log('\n3. Testing /student-subject-enrollments/student/available-subjects...');
    try {
      const subjectsResponse = await axios.get(
        `${BASE_URL}/student-subject-enrollments/student/available-subjects`,
        { headers }
      );
      console.log('✅ Available subjects endpoint works!');
      console.log('Available subjects count:', subjectsResponse.data.length);
      subjectsResponse.data.forEach((subject, index) => {
        console.log(`   ${index + 1}. ${subject.name} - ${subject.teacher_subjects.length} teacher(s)`);
      });
    } catch (error) {
      console.log('❌ Available subjects endpoint failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }
}

// Test with different possible passwords
async function testWithDifferentPasswords() {
  const passwords = ['password123', 'password', '123456', 'student123'];
  
  for (const password of passwords) {
    try {
      console.log(`\nTrying password: ${password}`);
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email_id: 'student1@gmail.com',
        password: password
      });
      
      console.log(`✅ Successful login with password: ${password}`);
      return password;
    } catch (error) {
      console.log(`❌ Failed with password: ${password}`);
    }
  }
  
  return null;
}

async function main() {
  console.log('Finding correct password...');
  const correctPassword = await testWithDifferentPasswords();
  
  if (correctPassword) {
    console.log(`\n🎉 Found working password: ${correctPassword}`);
    console.log('\nNow testing API endpoints...');
    await testStudentLogin();
  } else {
    console.log('\n❌ Could not find working password. Please check the user credentials in the database.');
  }
}

main(); 