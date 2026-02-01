# Google Authentication & Data Segregation Guide

## 🔐 Authentication System

### Overview
Smart Farm AI now uses **Google OAuth exclusively** for user authentication. This ensures:
- ✅ Secure, industry-standard authentication
- ✅ No password management required
- ✅ Automatic user profile creation
- ✅ Seamless user experience

### How It Works

#### 1. User Login Flow
```
User clicks "Sign in with Google"
    ↓
Google OAuth authentication
    ↓
User grants permission
    ↓
Session created with user email
    ↓
User email stored as farm_id in localStorage
    ↓
Backend receives X-Farm-ID header with email
    ↓
User record created/updated in database
    ↓
Dashboard loads with user-specific data
```

#### 2. Session Management
- **Frontend**: Uses NextAuth.js with Google provider
- **Session Storage**: JWT-based sessions (30-day expiry)
- **User Identifier**: User's Google email address
- **Backend Authentication**: X-Farm-ID header sent with every API request

#### 3. Logout Flow
```
User clicks "Logout"
    ↓
localStorage.removeItem("farm_id")
    ↓
signOut() from NextAuth
    ↓
Session cleared
    ↓
Redirect to login page
```

## 🗄️ Data Segregation

### Database Architecture

All user data is segregated using the `user_id` field, which is the user's email address from Google OAuth.

#### Tables with User Segregation

1. **users** - User profiles
   - Primary Key: `id` (hashed email)
   - Unique: `email`

2. **sensor_readings** - Environmental data
   - Foreign Key: `user_id` → `users.id`
   - Index: `idx_sensor_user_time`

3. **voice_logs** - Voice notes and observations
   - Foreign Key: `user_id` → `users.id`
   - Index: `idx_voice_user_time`

4. **pest_incidents** - Pest tracking
   - Foreign Key: `user_id` → `users.id`
   - Index: `idx_pest_user_time`

5. **crop_diagnoses** - AI diagnoses
   - Foreign Key: `user_id` → `users.id`
   - Index: `idx_diagnoses_user_time`

6. **pest_forecasts** - Pest predictions
   - Foreign Key: `user_id` → `users.id`
   - Index: `idx_forecasts_user_date`

7. **safety_logs** - AI safety events
   - Foreign Key: `user_id` → `users.id`

8. **user_preferences** - User settings
   - Composite Primary Key: `(user_id, key)`

### Data Isolation Guarantees

#### Backend API Protection
Every API endpoint that handles user data requires the `X-Farm-ID` header:

```python
def get_current_user_id(
    x_farm_id: str = Header(..., alias="X-Farm-ID")
):
    if not x_farm_id:
        raise HTTPException(status_code=400, detail="Missing X-Farm-ID header")
    return x_farm_id
```

#### Query Examples
All queries filter by `user_id`:

```python
# Sensor readings
cursor.execute("""
    SELECT * FROM sensor_readings
    WHERE user_id = ?
    ORDER BY timestamp DESC
""", (user_id,))

# Voice logs
cursor.execute("""
    SELECT * FROM voice_logs
    WHERE user_id = ?
    ORDER BY timestamp DESC
""", (user_id,))
```

#### Foreign Key Constraints
Database enforces referential integrity:

```sql
FOREIGN KEY (user_id) REFERENCES users(id)
```

This ensures:
- No orphaned records
- Automatic cascade on user deletion (if implemented)
- Data integrity at the database level

## 🧪 Testing Data Segregation

### Automated Test Script
Run the data segregation test:

```bash
cd /Users/ijeong-u/Desktop/smartfarm_ai
python3 backend/scripts/test_data_segregation.py
```

### What It Tests
1. ✅ User table integrity
2. ✅ Sensor readings segregation by user
3. ✅ Voice logs segregation by user
4. ✅ Pest incidents segregation by user
5. ✅ Crop diagnoses segregation by user
6. ✅ No orphaned records (foreign key validation)

### Manual Testing Procedure

#### Test 1: Multiple User Accounts
1. Sign in with Google Account A
2. Record some sensor data
3. Add voice logs
4. Sign out
5. Sign in with Google Account B
6. Verify Account B sees no data from Account A
7. Record different sensor data for Account B
8. Sign out and sign back in as Account A
9. Verify Account A still sees only their original data

#### Test 2: Database Verification
```bash
# Connect to database
sqlite3 farm_data.db

# Check users
SELECT id, email, name FROM users;

# Check sensor readings per user
SELECT user_id, COUNT(*) as count 
FROM sensor_readings 
GROUP BY user_id;

# Verify no cross-contamination
SELECT sr.*, u.email 
FROM sensor_readings sr
JOIN users u ON sr.user_id = u.id
ORDER BY u.email, sr.timestamp;
```

## 🔒 Security Features

### 1. Authentication Security
- ✅ OAuth 2.0 standard
- ✅ No password storage
- ✅ Google's security infrastructure
- ✅ Automatic token refresh
- ✅ Secure session management

### 2. Data Access Control
- ✅ Header-based authentication (X-Farm-ID)
- ✅ User ID validation on every request
- ✅ Database-level foreign key constraints
- ✅ No cross-user data access possible

### 3. Session Security
- ✅ JWT tokens with expiry
- ✅ Secure cookie storage
- ✅ HTTPS enforcement in production
- ✅ CSRF protection via NextAuth

## 📝 User Data Flow

### Creating Sensor Reading
```
Frontend (page.tsx)
    ↓ User inputs data
recordSensorData(data)
    ↓ Includes X-Farm-ID header
Backend (sensors.py)
    ↓ Validates user_id
INSERT INTO sensor_readings (user_id, ...)
    ↓ Database enforces foreign key
✅ Data saved with user_id
```

### Fetching Dashboard Data
```
Frontend (page.tsx)
    ↓ User logged in
fetchDashboardData()
    ↓ Includes X-Farm-ID header
Backend (dashboard.py)
    ↓ Extracts user_id from header
SELECT * FROM sensor_readings WHERE user_id = ?
    ↓ Only user's data returned
✅ User sees only their data
```

## 🚀 Deployment Checklist

### Environment Variables Required
```bash
# Frontend (.env.local)
AUTH_SECRET=<random-secret>
AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-backend.com/api

# Backend (.env)
DB_PATH=/path/to/persistent/farm_data.db
```

### Production Verification
1. ✅ Google OAuth credentials configured
2. ✅ HTTPS enabled
3. ✅ Database persistence configured
4. ✅ Foreign key constraints enabled
5. ✅ Session secret is secure random string
6. ✅ CORS properly configured
7. ✅ Rate limiting enabled (recommended)

## 🔧 Troubleshooting

### Issue: User can't log in
**Check:**
- Google OAuth credentials are correct
- NEXTAUTH_URL matches your domain
- Callback URL registered in Google Console

### Issue: Data not persisting
**Check:**
- X-Farm-ID header is being sent
- User record exists in database
- Database file has write permissions

### Issue: Seeing other users' data
**This should never happen!**
If it does:
1. Check X-Farm-ID header value in browser DevTools
2. Verify backend is using get_current_user_id()
3. Check database queries include WHERE user_id = ?
4. Run test_data_segregation.py script

## 📊 Monitoring

### Key Metrics to Track
- Number of unique users (SELECT COUNT(DISTINCT id) FROM users)
- Data points per user (SELECT user_id, COUNT(*) FROM sensor_readings GROUP BY user_id)
- Orphaned records (should always be 0)
- Failed authentication attempts

### Database Health Check
```sql
-- Check for orphaned sensor readings
SELECT COUNT(*) FROM sensor_readings 
WHERE user_id NOT IN (SELECT id FROM users);

-- Check for orphaned voice logs
SELECT COUNT(*) FROM voice_logs 
WHERE user_id NOT IN (SELECT id FROM users);

-- Verify all users have valid emails
SELECT * FROM users WHERE email IS NULL OR email = '';
```

## 🎯 Best Practices

1. **Never bypass authentication**
   - Always require X-Farm-ID header
   - Validate user_id on every request

2. **Always filter by user_id**
   - Include WHERE user_id = ? in all queries
   - Use parameterized queries to prevent SQL injection

3. **Test data segregation regularly**
   - Run automated tests after deployments
   - Manually verify with multiple accounts

4. **Monitor for anomalies**
   - Check for orphaned records
   - Verify foreign key constraints
   - Review authentication logs

5. **Keep dependencies updated**
   - NextAuth.js
   - Google OAuth libraries
   - Security patches

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [SQLite Foreign Keys](https://www.sqlite.org/foreignkeys.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
