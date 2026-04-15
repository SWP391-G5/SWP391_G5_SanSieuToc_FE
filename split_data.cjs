const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'src/data/mockData.js'), 'utf8');
const lines = src.split('\n');

// Helper: extract lines (1-indexed inclusive start/end → 0-indexed slice)
function extract(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// mockFields: lines 524-1120 (JSDoc + data)
fs.writeFileSync('src/data/mockFields.js', extract(524, 1120), 'utf8');
console.log('mockFields.js');

// mockBookingDetails: lines 1115-1278
fs.writeFileSync('src/data/mockBookingDetails.js', extract(1115, 1278), 'utf8');
console.log('mockBookingDetails.js');

// mockFeedbacks: lines 1280-1640 (includes helpers: getFeedbacksByFieldID, getFieldRating, fieldRatings)
fs.writeFileSync('src/data/mockFeedbacks.js', extract(1280, 1640), 'utf8');
console.log('mockFeedbacks.js');

// mockBookings: lines 1642-2232 (includes BOOKING_ORDER_STATUS, MEMBER_TIERS, helpers)
fs.writeFileSync('src/data/mockBookings.js', extract(1642, 2300), 'utf8');
console.log('mockBookings.js');

// constants: lines 2302-2364
fs.writeFileSync('src/data/constants.js', extract(2302, 2364), 'utf8');
console.log('constants.js');

console.log('Done!');
