# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('afrovending_db');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'customer',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date().toISOString()
});
db.google_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "https://afro-paypal-test.preview.emergentagent.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test with cookie
curl -X GET "https://afro-paypal-test.preview.emergentagent.com/api/auth/me" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```python
# Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "afro-paypal-test.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://afro-paypal-test.preview.emergentagent.com")
```

## Quick Debug
```bash
# Check data format
mongosh --eval "
use('afrovending_db');
db.users.find().limit(2).pretty();
db.google_sessions.find().limit(2).pretty();
"

# Clean test data
mongosh --eval "
use('afrovending_db');
db.users.deleteMany({email: /test\.user\./});
db.google_sessions.deleteMany({session_token: /test_session/});
"
```

## Checklist
- [ ] User document has id field (custom UUID)
- [ ] Session user_id matches user's id exactly
- [ ] All queries use `{"_id": 0}` projection
- [ ] API returns user data (not 401/404)
- [ ] Browser loads dashboard (not login page)

## Success Indicators
✅ /api/auth/me returns user data
✅ Dashboard loads without redirect
✅ CRUD operations work

## Failure Indicators
❌ "User not found" errors
❌ 401 Unauthorized responses
❌ Redirect to login page
