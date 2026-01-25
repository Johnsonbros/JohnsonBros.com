#!/usr/bin/env node

// Test script to simulate different time scenarios
const http = require('http');

function testScenario(description, mockTime) {
  console.log(`\n=== Testing: ${description} ===`);
  
  // Make request with mock time
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/capacity/today',
    method: 'GET',
    headers: {
      'X-Mock-Time': mockTime.toISOString()
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log(`Time: ${mockTime.toLocaleString('en-US', {timeZone: 'America/New_York'})}`);
        console.log(`State: ${result.overall.state}`);
        console.log(`Headline: ${result.ui_copy.headline}`);
        console.log(`Badge: ${result.ui_copy.badge}`);
      } catch (e) {
        console.error('Error parsing response:', e);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });
  
  req.end();
}

// Test scenarios
setTimeout(() => {
  // Monday 2pm - should show Express
  testScenario('Monday 2pm (Express Available)', new Date('2025-08-25T18:00:00Z'));
}, 100);

setTimeout(() => {
  // Monday 4pm - should show Next Day
  testScenario('Monday 4pm (Next Day)', new Date('2025-08-25T20:00:00Z'));
}, 500);

setTimeout(() => {
  // Friday 2pm - should show Express
  testScenario('Friday 2pm (Express Available)', new Date('2025-08-29T18:00:00Z'));
}, 900);

setTimeout(() => {
  // Friday 4pm - should show Emergency
  testScenario('Friday 4pm (Emergency)', new Date('2025-08-29T20:00:00Z'));
}, 1300);

setTimeout(() => {
  // Saturday - should show Emergency
  testScenario('Saturday (Emergency)', new Date('2025-08-30T17:00:00Z'));
}, 1700);