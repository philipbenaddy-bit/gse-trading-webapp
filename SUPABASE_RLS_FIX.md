# Fix for RLS Policy Violation on User Creation

## Problem
When trying to create a user during registration, you get:
```
new row violates row-level security policy for table "users"
```

## Root Cause
The `public.users` table has RLS enabled but **no INSERT policy** for unauthenticated users. Your backend is using the `SUPABASE_ANON_KEY` which doesn't have permission to insert new users.

## Solution Applied

### 1. Updated Supabase Service
Modified `backend/src/supabase/supabase.service.ts` to support two clients:
- **Regular client** (anon key) - for RLS-protected operations
- **Admin client** (service role key) - bypasses RLS for admin operations like user creation

### 2. Updated Users Service
Modified `backend/src/users/users.service.ts` to use the admin client for user creation.

### 3. Required: Add Service Role Key

**You need to add your Supabase Service Role Key to your `.env` file:**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pxdheimwyfilhvvdbrup
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (under "Project API keys")
4. Copy the key
5. Add it to your `backend/.env` file:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZGhlaW13eWZpbGh2dmRicnVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2MzAzNiwiZXhwIjoyMDkzNzM5MDM2fQ.YOUR_ACTUAL_KEY_HERE
```

### 4. Restart Your Backend
After adding the service role key:
```bash
cd backend
npm run start:dev
```

## Security Notes

⚠️ **IMPORTANT**: The service role key bypasses ALL RLS policies. 

- **Never expose it to the frontend**
- **Never commit it to version control** (it's in .gitignore)
- **Only use it in your backend** for operations that require elevated privileges
- Use the regular client (anon key) for user-specific operations where RLS should apply

## Alternative Solution (Not Recommended)

If you don't want to use the service role key, you could add an INSERT policy to the users table:

```sql
-- Allow anyone to insert new users (registration)
CREATE POLICY "Allow public user registration" ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);
```

However, this is **less secure** because:
1. Anyone could insert users with any role (including 'admin')
2. No server-side validation
3. The service role approach is the recommended pattern for backend applications

## Testing

After adding the service role key, test user registration:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+233123456789",
    "firstName": "Test",
    "lastName": "User",
    "password": "SecurePass123!"
  }'
```

You should now be able to create users successfully! ✅
