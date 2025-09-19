# GitHub Actions Setup Guide

This guide explains how to set up the required secrets for GitHub Actions to work properly with EAS builds.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. EXPO_TOKEN

This is the most important secret for EAS builds to work.

**How to get your EXPO_TOKEN:**

1. Go to [Expo Dashboard](https://expo.dev/accounts/[your-username]/settings/access-tokens)
2. Click "Create Token"
3. Give it a name like "GitHub Actions CI"
4. Select the appropriate permissions (at minimum: `build:read`, `build:write`)
5. Copy the generated token

**How to add it to GitHub:**

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `EXPO_TOKEN`
6. Value: Paste your Expo access token
7. Click "Add secret"

### 2. EXPO_PUBLIC_API_URL (Optional)

If you want to use different API URLs for different environments:

1. Go to "Secrets and variables" → "Actions"
2. Click "New repository secret"
3. Name: `EXPO_PUBLIC_API_URL`
4. Value: `https://241runners-api-v2.azurewebsites.net` (or your API URL)

## Workflow Status

After setting up the secrets, the following workflows should work:

- ✅ **CI/CD Pipeline**: Runs on every push/PR
- ✅ **Security Scan**: Weekly security audits
- ✅ **Code Quality**: Code quality checks
- ✅ **EAS Build**: iOS builds on main branch
- ✅ **Deployment**: Manual deployment triggers

## Troubleshooting

### "An Expo user account is required to proceed"

This error means the `EXPO_TOKEN` secret is either:
- Not set in GitHub repository secrets
- Set with an invalid/expired token
- Set with insufficient permissions

**Solution:**
1. Verify the token exists in GitHub repository secrets
2. Check that the token has the correct permissions
3. Generate a new token if needed

### Build fails with authentication errors

Make sure your Expo token has these permissions:
- `build:read`
- `build:write`
- `project:read` (if using project-specific builds)

## Testing the Setup

After adding the secrets, you can test by:

1. Making a small change to the code
2. Pushing to the main branch
3. Checking the "Actions" tab in GitHub to see if builds succeed

## Security Notes

- Never commit tokens to your code
- Use GitHub repository secrets for all sensitive data
- Rotate tokens regularly
- Use minimal required permissions for tokens
