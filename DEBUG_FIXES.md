# Debug Fixes for Food Listing Form Submission

## Issues Fixed

### 1. **DateTime Format Mismatch**
**Problem:** The React `datetime-local` input produces `YYYY-MM-DDTHH:mm` format (e.g., `2026-06-04T13:17`), but Django's DateTimeField expects full ISO 8601 format with seconds (e.g., `2026-06-04T13:17:00Z`).

**Solution Applied:**
- Added `formatDateTimeForBackend()` function in `DonorFoodListingManager.js`
- Converts `2026-06-04T13:17` → `2026-06-04T13:17:00Z` before sending to backend
- Updated both `handlePostSubmit()` and `handleSaveEdit()` to use this function

**Files Modified:**
- `src/components/DonorFoodListingManager.js` - Added datetime formatting function and applied it in form handlers

### 2. **Enhanced Error Messages**
**Problem:** Backend validation errors weren't being properly displayed to the user.

**Solution Applied:**
- Updated error extraction in `handlePostSubmit()` to handle nested error structures
- Now checks: `response.error?.detail`, `response.error?.non_field_errors?.[0]`, `response.error?.pickup_time?.[0]`
- Falls back to full JSON stringify if specific errors aren't found
- Same improvements applied to `handleSaveEdit()`

**Files Modified:**
- `src/components/DonorFoodListingManager.js` - Enhanced error message handling

### 3. **Form Validation**
**Problem:** Missing required field validation before submission.

**Solution Applied:**
- Added client-side validation for all required fields
- Shows specific error message for each missing field
- Prevents form submission if validation fails

**Files Modified:**
- `src/components/DonorFoodListingManager.js` - Added field validation

### 4. **Authentication Debugging**
**Problem:** Difficult to verify if authentication token is being sent correctly.

**Solution Applied:**
- Updated `api.js` `createFoodListing()` to explicitly construct Authorization header
- Added console logging to track:
  - Whether auth token is found in storage
  - Length of token (for verification)
  - Full request payload being sent
  - Response status and body
- Same improvements applied to `updateFoodListing()`

**Files Modified:**
- `src/api.js` - Enhanced auth header handling with debugging console logs

### 5. **Django Serializer DateTime Field**
**Problem:** Serializer didn't explicitly handle datetime format conversion.

**Solution Applied:**
- Added explicit `DateTimeField` configuration to `FoodListingSerializer`
- Set multiple input formats that the serializer accepts:
  - `'iso-8601'` (primary format)
  - `'%Y-%m-%dT%H:%M:%SZ'` (ISO with Z suffix)
  - `'%Y-%m-%dT%H:%M:%S.%fZ'` (ISO with milliseconds)
  - `'%Y-%m-%dT%H:%M:%S'` (ISO without Z)
  - `'%Y-%m-%d %H:%M:%S'` (Alternative format)

**Files Modified:**
- `backend/food_api/serializers.py` - Added explicit DateTime field with multiple input formats

## Testing Steps

### Step 1: Start Backend Server
```bash
cd backend
python manage.py runserver
```

### Step 2: Open Browser Console
- In React app, open Developer Tools (F12)
- Go to Console tab
- Look for `[API]` prefixed logs

### Step 3: Submit a Food Listing

1. Navigate to Donor Dashboard → Post Food tab
2. Fill in the form:
   - **Food Type:** Select any option (e.g., "Cooked Food")
   - **Quantity:** Enter any value (e.g., "5 kg")
   - **Pickup Time:** Select a date and time
   - **Location:** Enter any location (e.g., "123 Main St")
3. Click "Create Listing"

### Step 4: Check Console Logs

You should see logs like:
```
[API] Auth token found, length: 40
[API] Sending payload: {food_type: 'Cooked', quantity: '5 kg', pickup_time: '2026-06-04T13:17:00Z', location: '123 Main St'}
[API] Response status: 201 Body: {id: 1, user: {...}, food_type: 'Cooked', ...}
```

### Step 5: Verify Success

- If successful: Green message "Food listing created successfully."
- If error: Red message with detailed error (e.g., "Invalid datetime format")
- Check MySQL database: `SELECT * FROM food_api_foodlisting;`

## Backend Validation

### DateTime Validation
Django's DateTimeField now accepts multiple formats. If still getting errors:

1. Check exact error message in browser console
2. Verify MySQL can parse the datetime:
   ```sql
   SELECT STR_TO_DATE('2026-06-04T13:17:00Z', '%Y-%m-%dT%H:%i:%sZ');
   ```

### Token Authentication
If getting 401 Unauthorized:

1. Check console log shows token with length ~40
2. Verify token exists in database: `SELECT * FROM authtoken_token;`
3. Verify header format is exactly: `Authorization: Token <40-char-token>`

### CORS Issues
If getting network error:

1. Verify `CORS_ALLOW_ALL_ORIGINS = True` in `backend/core/settings.py`
2. Check Network tab in DevTools shows CORS headers in response
3. Try hitting API directly: `curl -H "Authorization: Token YOUR_TOKEN" http://localhost:8000/api/food-listings/`

## Key Code Changes Summary

### DonorFoodListingManager.js
```javascript
// NEW: Helper function to format datetime
const formatDateTimeForBackend = (dateTimeLocalValue) => {
  if (!dateTimeLocalValue) return '';
  const [datePart, timePart] = dateTimeLocalValue.split('T');
  if (!datePart || !timePart) return dateTimeLocalValue;
  const [hour, minute] = timePart.split(':');
  return `${datePart}T${hour}:${minute}:00Z`;
};

// UPDATED: handlePostSubmit now:
// 1. Validates all required fields
// 2. Formats pickup_time using helper function
// 3. Extracts nested error structures from API response
```

### api.js
```javascript
// UPDATED: createFoodListing now:
// 1. Explicitly constructs Authorization header
// 2. Logs token length and payload for debugging
// 3. Logs response status and body
// 4. Improved error handling with console warnings
```

### serializers.py
```python
# NEW: Explicit DateTimeField configuration
pickup_time = serializers.DateTimeField(
    format='iso-8601',
    input_formats=[
        'iso-8601',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%dT%H:%M:%S.%fZ',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d %H:%M:%S'
    ]
)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to create listing" with no details | Open browser console, look for `[API]` logs to see actual error |
| Invalid datetime format error | Check that `formatDateTimeForBackend()` is being called in `handlePostSubmit()` |
| 401 Unauthorized | Verify token is in localStorage using browser DevTools Application tab |
| CORS error | Ensure `CORS_ALLOW_ALL_ORIGINS = True` in Django settings |
| Listing not appearing in table | Check Network tab - verify 201 response received, then refresh page |

## Next Steps

1. Test the form submission
2. Check browser console for any errors
3. Verify listing appears in database
4. If issues persist, check:
   - Django server logs for detailed error messages
   - Network tab for request/response details
   - Database logs for constraint violations
