# Code Commenting Guide

## Overview
This guide outlines the commenting standards for the 241RA Mobile app to improve code maintainability and developer experience.

## Comment Types

### 1. File Header Comments
Every TypeScript/JavaScript file should start with a brief description:

```typescript
/**
 * Component Name
 * 
 * Brief description of what this component/service does
 * Key functionality points:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */
```

### 2. Function/Method Comments
Use JSDoc format for functions:

```typescript
/**
 * Brief description of what the function does
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter
 * @returns Description of return value
 */
```

### 3. Inline Comments
Use inline comments for complex logic:

```typescript
// Explain why this logic exists, not what it does
if (user.role === 'admin') {
  // Admin users get elevated permissions for system management
  await grantAdminAccess();
}
```

### 4. TODO Comments
Use TODO comments for future improvements:

```typescript
// TODO: Implement caching for better performance
// TODO: Add error handling for network failures
```

## Commenting Standards

### Do's ✅
- Explain **why** code exists, not **what** it does
- Use clear, concise language
- Comment complex business logic
- Document API endpoints and data structures
- Explain error handling strategies
- Comment configuration options

### Don'ts ❌
- Don't comment obvious code
- Don't use outdated comments
- Don't comment every line
- Don't use unclear abbreviations
- Don't leave TODO comments without context

## Examples

### Good Comments
```typescript
/**
 * Authentication Service
 * 
 * Handles user authentication including:
 * - Login/logout functionality
 * - Token management
 * - User session persistence
 * - Role-based access control
 */
export class AuthService {
  /**
   * Authenticate user with email/password and optional 2FA
   * @param credentials - User login credentials
   * @returns Authentication response with user data and tokens
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Normalize email to prevent case-sensitivity issues
    const normalizedEmail = credentials.email.toLowerCase().trim();
    
    // Test API connectivity in development
    if (__DEV__) {
      await this.testApiConnectivity();
    }
    
    // TODO: Add rate limiting to prevent brute force attacks
    return await this.performLogin(normalizedEmail, credentials.password);
  }
}
```

### Bad Comments
```typescript
// This is the AuthService class
export class AuthService {
  // This function logs in the user
  static async login(credentials) {
    // Set email to lowercase
    const email = credentials.email.toLowerCase();
    // Make API call
    return await api.post('/login', { email });
  }
}
```

## Special Comment Types

### Debug Comments
Use conditional logging for development:

```typescript
// Log debug information only in development
if (__DEV__) {
  console.log('[DEBUG] User authentication started');
}
```

### Security Comments
Document security considerations:

```typescript
// Sanitize user input to prevent XSS attacks
const sanitizedInput = sanitizeHtml(userInput);

// Use secure token storage for sensitive data
await SecureTokenService.setAccessToken(token);
```

### Performance Comments
Document performance optimizations:

```typescript
// Use React.memo to prevent unnecessary re-renders
const OptimizedComponent = React.memo(Component);

// Debounce API calls to reduce server load
const debouncedSearch = useDebounce(searchTerm, 300);
```

## Comment Maintenance

1. **Update comments when code changes**
2. **Remove outdated comments**
3. **Keep comments close to relevant code**
4. **Use consistent formatting**
5. **Review comments during code reviews**

## Tools and Automation

- Use ESLint rules for comment consistency
- Configure IDE to show TODO comments
- Use JSDoc generators for API documentation
- Set up comment linting in CI/CD pipeline
