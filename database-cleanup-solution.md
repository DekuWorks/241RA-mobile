# Database Cleanup Solution for 241Runners

## Current Situation
- **Total Users**: 18 (6 admin + 12 non-admin)
- **Non-admin users are being deactivated** (not deleted) due to related data
- **Need**: Permanent deletion of mock data and test users

## Solutions

### Option 1: Backend Repository Access (Recommended)
Access the backend repository to add a force delete endpoint:

**Backend Repo**: https://github.com/DekuWorks/241RunnersAwareness

1. **Clone the backend repository**
2. **Add a force delete endpoint** that:
   - Deletes related data first (cases, runners, sightings)
   - Then deletes the user records
   - Bypasses the safety checks for admin cleanup

3. **Deploy the updated backend**

### Option 2: Direct Database Access
If you have direct access to the Azure SQL Database:

```sql
-- 1. First, delete related data for non-admin users
DELETE FROM Cases WHERE UserId IN (
    SELECT Id FROM Users WHERE Role != 'admin'
);

DELETE FROM Runners WHERE UserId IN (
    SELECT Id FROM Users WHERE Role != 'admin'
);

DELETE FROM Sightings WHERE UserId IN (
    SELECT Id FROM Users WHERE Role != 'admin'
);

-- 2. Then delete the non-admin users
DELETE FROM Users WHERE Role != 'admin';
```

### Option 3: Create Admin Endpoint
Add this endpoint to the backend AdminController:

```csharp
[HttpDelete("users/force-delete/{userId}")]
[Authorize(Roles = "admin")]
public async Task<IActionResult> ForceDeleteUser(int userId)
{
    var user = await _userService.GetByIdAsync(userId);
    if (user == null) return NotFound();
    
    // Delete related data first
    await _caseService.DeleteByUserIdAsync(userId);
    await _runnerService.DeleteByUserIdAsync(userId);
    await _sightingService.DeleteByUserIdAsync(userId);
    
    // Then delete the user
    await _userService.ForceDeleteAsync(userId);
    
    return Ok(new { success = true, message = "User and related data deleted" });
}
```

### Option 4: Temporary Solution
For now, the deactivated users won't show up in active user counts, but they'll still exist in the database.

## Recommended Next Steps

1. **Access the backend repository** at https://github.com/DekuWorks/241RunnersAwareness
2. **Add a force delete endpoint** for admin cleanup
3. **Test in development environment** first
4. **Deploy to production**
5. **Run cleanup script** to permanently delete mock data

## Current Admin Users (Keep These)
- Daniel Carey (danielcarey9770@yahoo.com)
- Lisa Thomas (lthomas3350@gmail.com) 
- Tina Matthews (tinaleggins@yahoo.com)
- Mark Melasky (mmelasky@iplawconsulting.com)
- Ralph Frank (ralphfrank900@gmail.com)
- Marcus Brown (dekuworks1@gmail.com)

## Users to Delete
- All users with role != 'admin' (currently 12 users)
- Mock/test data in other tables
