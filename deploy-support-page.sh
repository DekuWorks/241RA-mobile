#!/bin/bash

# Deploy Support Page Script for 241 Runners
# This script helps deploy the support page to make it accessible

echo "🚀 241 Runners - Deploying Support Page"
echo "======================================"
echo ""

# Check if support.html exists
if [ ! -f "support.html" ]; then
    echo "❌ support.html file not found!"
    echo "Please make sure support.html exists in the current directory."
    exit 1
fi

echo "✅ support.html found"
echo ""

# Display the content that needs to be uploaded
echo "📄 Support page content ready for deployment:"
echo "File: support.html"
echo "Size: $(wc -c < support.html) bytes"
echo ""

echo "📋 DEPLOYMENT INSTRUCTIONS:"
echo "=========================="
echo ""
echo "1. Upload support.html to your web server"
echo "2. Make it accessible at: https://241runnersawareness.org/support"
echo "3. Test the URL in a browser"
echo "4. Verify it loads without errors"
echo ""

echo "🔗 URL TO TEST:"
echo "https://241runnersawareness.org/support"
echo ""

echo "📝 CONTENT PREVIEW:"
echo "==================="
echo "The support page includes:"
echo "• Contact information (support@241runnersawareness.org)"
echo "• FAQ section with common questions"
echo "• Technical support guidance"
echo "• App information and version details"
echo "• Privacy and security information"
echo "• Emergency situation guidance"
echo ""

echo "⚡ QUICK DEPLOYMENT OPTIONS:"
echo "==========================="
echo ""
echo "Option 1 - If you have FTP/SSH access:"
echo "  scp support.html user@your-server:/path/to/website/support.html"
echo ""
echo "Option 2 - If using a hosting service:"
echo "  Upload support.html via your hosting control panel"
echo ""
echo "Option 3 - If using GitHub Pages:"
echo "  Copy support.html to your repository and push changes"
echo ""

echo "🧪 TESTING CHECKLIST:"
echo "====================="
echo "After deployment, verify:"
echo "• URL loads without 404 errors"
echo "• Page displays correctly on mobile and desktop"
echo "• All links work properly"
echo "• Contact information is visible"
echo "• FAQ section is readable"
echo ""

echo "✅ Ready for deployment!"
echo "Once deployed, you can respond to Apple's review team."
echo ""

