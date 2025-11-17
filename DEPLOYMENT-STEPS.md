# Step-by-Step Deployment Instructions

## Prerequisites Checklist

Before starting, ensure you have:
- ✅ All files ready (index.html, script.js, styles.css, config.js, etc.)
- ✅ Netlify account (sign up at netlify.com if needed)
- ✅ Aliyun account with domains: vocabox.top and cilihe.cn
- ✅ DNS access to your Aliyun domains

---

## Step 1: Prepare Your Files for Deployment

### 1.1 Verify All Required Files Exist

Check that these files are in your project folder:
- `index.html`
- `script.js`
- `styles.css`
- `config.js`
- `ielts-8000-data.js`
- All image files (logo.png, title.png, cards.png, test.png, plus.png, books.png, etc.)

### 1.2 Verify config.js Settings

Open `config.js` and confirm:
```javascript
features: {
    useSupabase: false,        // Must be false
    enableCloudSync: false,    // Must be false
    enableOfflineMode: true,   // Should be true
}
```

### 1.3 Test Locally

1. Open `index.html` in your browser
2. Test basic functions:
   - Sign up a new user
   - Add a card
   - Create a folder
   - Export data
3. Check browser console (F12) for any errors
4. Fix any errors before proceeding

---

## Step 2: Deploy to Netlify

### 2.1 Create Netlify Account (if needed)

1. Go to https://www.netlify.com
2. Click "Sign up"
3. Choose "Sign up with email" or use GitHub/GitLab
4. Complete registration

### 2.2 Deploy via Netlify Dashboard

**Option A: Drag and Drop (Easiest)**

1. Log in to Netlify
2. Go to your dashboard
3. Find the "Sites" section
4. Drag your entire project folder onto the deployment area
5. Wait for deployment to complete (usually 30-60 seconds)
6. Note the generated URL (e.g., `random-name-123.netlify.app`)

**Option B: Git Integration (Recommended for updates)**

1. Push your code to GitHub/GitLab/Bitbucket
2. In Netlify dashboard, click "Add new site" → "Import an existing project"
3. Connect your Git provider
4. Select your repository
5. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `/` (or leave as default)
6. Click "Deploy site"

### 2.3 Verify Deployment

1. Visit your Netlify URL (e.g., `random-name-123.netlify.app`)
2. Test the app:
   - Sign up works
   - Add card works
   - Export works
3. Check browser console for errors
4. If errors, check Netlify deployment logs

---

## Step 3: Connect Aliyun Domain to Netlify

### 3.1 Add Custom Domain in Netlify

1. In Netlify dashboard, go to your site
2. Click "Domain settings"
3. Click "Add custom domain"
4. Enter: `vocabox.top`
5. Click "Verify"
6. Netlify will show DNS records needed

### 3.2 Configure DNS in Aliyun

1. Log in to Aliyun Console
2. Go to "域名" (Domain) → "域名解析" (DNS)
3. Find `vocabox.top` in your domain list
4. Click "解析设置" (DNS Settings)

### 3.3 Add DNS Records

Add these records (Netlify will show exact values):

**Record 1: A Record**
- Type: A
- Host: @ (or leave empty)
- Value: Netlify's IP (Netlify will show this, usually `75.2.60.5`)
- TTL: 600 (or default)

**Record 2: CNAME Record**
- Type: CNAME
- Host: www
- Value: `your-site-name.netlify.app` (your Netlify URL)
- TTL: 600 (or default)

**Record 3: CNAME Record (for Netlify subdomain)**
- Type: CNAME
- Host: _netlify
- Value: `your-site-name.netlify.app`
- TTL: 600 (or default)

### 3.4 Wait for DNS Propagation

1. Save DNS records in Aliyun
2. Wait 5-30 minutes for DNS to propagate
3. In Netlify, click "Verify" again
4. Netlify will issue SSL certificate automatically (takes 5-10 minutes)

### 3.5 Repeat for Second Domain (cilihe.cn)

1. In Netlify, add `cilihe.cn` as another custom domain
2. Follow same DNS steps in Aliyun for `cilihe.cn`
3. Wait for SSL certificate

---

## Step 4: Configure ICP备案 (ICP Filing)

### 4.1 Prepare Required Information

You'll need:
- Business license (if company) or ID card (if individual)
- Domain certificate
- Server information (Netlify's information)
- Contact information

### 4.2 Start ICP Filing in Aliyun

1. Log in to Aliyun Console
2. Go to "备案" (ICP Filing)
3. Click "开始备案" (Start Filing)
4. Select "首次备案" (First-time Filing)

### 4.3 Fill Out ICP Filing Form

**Step 1: Product Verification**
- Select: "阿里云" (Aliyun)
- Product type: "网站托管" (Website Hosting)
- Service provider: Select Netlify (or "其他" if not listed)
- Service IP: Use Netlify's IP address

**Step 2: Website Information**
- Website name: "VocaBox" (or your preferred name)
- Website domain: `vocabox.top` and `cilihe.cn`
- Website type: Select appropriate category
- Website description: "在线英语单词学习应用" (Online English vocabulary learning app)

**Step 3: Entity Information**
- Fill in your company or personal information
- Upload required documents (ID card, business license, etc.)

**Step 4: Review and Submit**
- Review all information
- Submit for review

### 4.4 Wait for ICP Approval

- Initial review: 1-3 business days
- Aliyun will contact you if corrections needed
- After approval, you'll receive ICP filing number
- Add ICP number to your website footer (required)

---

## Step 5: Configure 公安备案 (Public Security Filing)

### 5.1 Wait for ICP Approval First

- 公安备案 can only be done after ICP备案 is approved
- You'll need your ICP filing number

### 5.2 Access 公安备案 System

1. Go to: https://www.beian.gov.cn
2. Register an account
3. Log in

### 5.3 Fill Out 公安备案 Form

**Required Information:**
- ICP filing number (from Step 4)
- Website domain: `vocabox.top` and `cilihe.cn`
- Website name: "VocaBox"
- Website type: "非交互式" (Non-interactive) or appropriate type
- Server location: Select location
- Service provider: Netlify (or "其他")
- Contact information

**Required Documents:**
- ICP filing certificate
- Domain certificate
- ID card or business license
- Website screenshot

### 5.4 Submit and Wait

- Submit the form
- Wait for review (usually 1-2 weeks)
- You'll receive approval notification
- Add 公安备案 number to website footer

---

## Step 6: Add ICP and 公安备案 Numbers to Website

### 6.1 Update index.html

Add this to the footer (before `</body>` tag):

```html
<footer style="text-align: center; padding: 20px; color: #666; font-size: 0.85rem; border-top: 1px solid #eee; margin-top: 40px;">
    <p>© 2024 VocaBox. All rights reserved.</p>
    <p>
        <a href="http://www.beian.gov.cn" target="_blank" style="color: #666; text-decoration: none;">
            公安备案号: [Your 公安备案 Number]
        </a>
        <span style="margin: 0 10px;">|</span>
        <a href="https://beian.miit.gov.cn" target="_blank" style="color: #666; text-decoration: none;">
            ICP备案号: [Your ICP Number]
        </a>
    </p>
</footer>
```

### 6.2 Replace Placeholders

- Replace `[Your 公安备案 Number]` with your actual number
- Replace `[Your ICP Number]` with your actual number

### 6.3 Redeploy to Netlify

1. Update `index.html` with the footer
2. If using Git: Commit and push changes
3. If using drag-and-drop: Drag updated folder to Netlify
4. Wait for deployment

---

## Step 7: Final Verification

### 7.1 Test Both Domains

1. Visit `https://vocabox.top`
2. Visit `https://cilihe.cn`
3. Both should show your app
4. Both should have SSL (https://)

### 7.2 Test All Features

- [ ] Sign up new user
- [ ] Sign in
- [ ] Add card
- [ ] Create folder
- [ ] Test mode works
- [ ] Export data works
- [ ] Import data works
- [ ] Subscription limits work (100 cards, 3 folders)
- [ ] Upgrade modal appears when limit reached

### 7.3 Check Browser Console

1. Open browser console (F12)
2. Check for any errors
3. Verify no Supabase errors (should see "Supabase not configured" message, which is normal)

---

## Step 8: Ongoing Maintenance

### 8.1 Update Your App

**If using Git:**
1. Make changes locally
2. Commit changes
3. Push to Git repository
4. Netlify auto-deploys

**If using drag-and-drop:**
1. Make changes locally
2. Drag updated folder to Netlify
3. Netlify redeploys

### 8.2 Monitor Netlify

- Check Netlify dashboard regularly
- Monitor deployment status
- Check for any errors in logs

### 8.3 Backup User Data

- Remind users to export data regularly (localStorage can be cleared)
- Consider adding backup reminder in app

---

## Troubleshooting

### DNS Not Working

- Wait longer (can take up to 48 hours)
- Check DNS records are correct
- Verify Netlify domain settings

### SSL Certificate Not Issuing

- Ensure DNS is properly configured
- Wait 10-15 minutes
- Contact Netlify support if still not working

### ICP Filing Rejected

- Check error message from Aliyun
- Correct information and resubmit
- Ensure all documents are clear and valid

### App Not Working After Deployment

- Check browser console for errors
- Verify all files are uploaded
- Check Netlify deployment logs
- Test locally first

---

## Important Notes

1. **No Backend Required**: Your app works entirely in the browser
2. **localStorage Only**: All data stored in user's browser
3. **No Supabase**: Don't enable Supabase until much later
4. **Static Hosting**: Netlify serves static files only
5. **ICP Required**: Must complete ICP备案 for Chinese domains
6. **公安备案 Required**: Must complete after ICP备案

---

## Support Resources

- Netlify Docs: https://docs.netlify.com
- Aliyun ICP Guide: Check Aliyun console help section
- 公安备案 Guide: https://www.beian.gov.cn

---

## Next Steps After Deployment

Once deployed and ICP/公安备案 complete:

1. Test thoroughly
2. Share with users
3. Monitor usage
4. Collect feedback
5. Plan future features (Supabase, Stripe, etc.)

