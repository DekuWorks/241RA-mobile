# 241Runners Admin Accounts

## Admin Account Information

The following 6 admin accounts are set up in the database:

### 1. Daniel Carey
- **Email**: danielcarey9770@yahoo.com
- **Name**: Daniel Carey
- **Role**: admin
- **Status**: Email verification pending
- **ID**: 4

### 2. Lisa Thomas
- **Email**: lthomas3350@gmail.com
- **Name**: Lisa Thomas
- **Role**: admin
- **Status**: Email verification pending
- **ID**: 5

### 3. Tina Matthews
- **Email**: tinaleggins@yahoo.com
- **Name**: Tina Matthews
- **Role**: admin
- **Status**: Email verification pending
- **ID**: 6

### 4. Mark Melasky
- **Email**: mmelasky@iplawconsulting.com
- **Name**: Mark Melasky
- **Role**: admin
- **Status**: Email verification pending
- **ID**: 7

### 5. Ralph Frank
- **Email**: ralphfrank900@gmail.com
- **Name**: Ralph Frank
- **Role**: admin
- **Status**: Email verification pending
- **ID**: 8

### 6. Marcus Brown (Primary Admin)
- **Email**: dekuworks1@gmail.com
- **Name**: Marcus Brown
- **Role**: admin
- **Status**: Email verified ✅
- **ID**: 9

## Password Setup

**IMPORTANT**: Admin passwords need to be set up. Use the following endpoints:

### Reset Marcus Admin Password
```bash
curl -X POST "https://241runners-api-v2.azurewebsites.net/api/auth/reset-marcus-password"
```

### Seed All Admin Passwords
```bash
curl -X POST "https://241runners-api-v2.azurewebsites.net/api/Admin/seed-admins"
```

**Working Admin Credentials**:
- **Marcus Brown**: dekuworks1@gmail.com / marcus2025 ✅
- **All other admin accounts**: Need password setup via seed-admins endpoint
- **Note**: Original password "marcus2025" works for Marcus Brown account

## Usage

These accounts can be used to:
- Access the mobile app admin portal
- Access the static site admin dashboard
- Manage users, cases, and system settings
- Generate reports and analytics

## Security Notes

- All accounts should have strong passwords
- Email verification should be completed for all accounts
- Regular password updates are recommended
- Monitor admin activity through the portal logs
