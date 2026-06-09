import http from 'http';

const PORT = 5050;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make HTTP requests
const makeRequest = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(postData);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('=== STARTING API INTEGRATION TESTS ===');
  
  const testEmail = `test_user_${Date.now()}@example.com`;
  const testPassword = 'password123';
  let token = '';
  let taskId = '';

  try {
    // 1. Test POST /api/auth/register
    console.log('\n[1/6] Testing user registration (POST /api/auth/register)...');
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Tester',
      email: testEmail,
      password: testPassword,
    });
    
    console.log(`Response Status: ${registerRes.statusCode}`);
    if (registerRes.statusCode === 201 && registerRes.body.token) {
      console.log('✔ Registration successful! Token generated.');
      token = registerRes.body.token;
    } else {
      console.log('❌ Registration failed:', registerRes.body);
      process.exit(1);
    }

    // 2. Test POST /api/auth/login
    console.log('\n[2/6] Testing user login (POST /api/auth/login)...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    
    console.log(`Response Status: ${loginRes.statusCode}`);
    if (loginRes.statusCode === 200 && loginRes.body.token) {
      console.log('✔ Login successful! User authenticated.');
    } else {
      console.log('❌ Login failed:', loginRes.body);
      process.exit(1);
    }

    // 3. Test POST /api/tasks (Create Task)
    console.log('\n[3/6] Testing task creation (POST /api/tasks)...');
    const createTaskRes = await makeRequest(
      'POST',
      '/api/tasks',
      { title: 'Complete integration tests' },
      { Authorization: `Bearer ${token}` }
    );
    
    console.log(`Response Status: ${createTaskRes.statusCode}`);
    if (createTaskRes.statusCode === 201 && createTaskRes.body._id) {
      console.log('✔ Task creation successful!');
      console.log('Task title:', createTaskRes.body.title);
      console.log('Task status:', createTaskRes.body.status);
      taskId = createTaskRes.body._id;
    } else {
      console.log('❌ Task creation failed:', createTaskRes.body);
      process.exit(1);
    }

    // 4. Test GET /api/tasks (Retrieve Tasks)
    console.log('\n[4/6] Testing tasks retrieval (GET /api/tasks)...');
    const getTasksRes = await makeRequest(
      'GET',
      '/api/tasks',
      null,
      { Authorization: `Bearer ${token}` }
    );
    
    console.log(`Response Status: ${getTasksRes.statusCode}`);
    if (getTasksRes.statusCode === 200 && Array.isArray(getTasksRes.body)) {
      console.log(`✔ Tasks fetched successfully! Total tasks: ${getTasksRes.body.length}`);
    } else {
      console.log('❌ Tasks fetch failed:', getTasksRes.body);
      process.exit(1);
    }

    // 5. Test PATCH /api/tasks/:id/done (Mark task as completed)
    console.log(`\n[5/6] Testing marking task as completed (PATCH /api/tasks/${taskId}/done)...`);
    const updateTaskRes = await makeRequest(
      'PATCH',
      `/api/tasks/${taskId}/done`,
      null,
      { Authorization: `Bearer ${token}` }
    );
    
    console.log(`Response Status: ${updateTaskRes.statusCode}`);
    if (updateTaskRes.statusCode === 200 && updateTaskRes.body.status === 'done') {
      console.log('✔ Task marked done successfully!');
    } else {
      console.log('❌ Updating task failed:', updateTaskRes.body);
      process.exit(1);
    }

    // 6. Test DELETE /api/tasks/:id (Delete task permanently)
    console.log(`\n[6/6] Testing task deletion (DELETE /api/tasks/${taskId})...`);
    const deleteTaskRes = await makeRequest(
      'DELETE',
      `/api/tasks/${taskId}`,
      null,
      { Authorization: `Bearer ${token}` }
    );
    
    console.log(`Response Status: ${deleteTaskRes.statusCode}`);
    if (deleteTaskRes.statusCode === 200 && deleteTaskRes.body.message) {
      console.log('✔ Task deleted successfully!');
    } else {
      console.log('❌ Deleting task failed:', deleteTaskRes.body);
      process.exit(1);
    }

    console.log('\n=== ALL REST API INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('❌ Test execution error:', error);
    process.exit(1);
  }
};

runTests();
