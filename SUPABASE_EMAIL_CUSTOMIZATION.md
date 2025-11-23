# Customizing Supabase Email Templates

This guide shows you how to customize the email confirmation template that users receive when they sign up.

## Steps to Customize Email Templates

### 1. Access Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Log in to your account
3. Select your project

### 2. Navigate to Email Templates
1. In the left sidebar, click on **"Authentication"**
2. Click on **"Email Templates"** (under Authentication section)

### 3. Customize the Confirmation Email
1. Find and click on **"Confirm signup"** template
2. You'll see two tabs:
   - **Subject**: The email subject line
   - **Body**: The email body content

### 4. Edit the Template

#### Subject Line
You can customize the subject, for example:
```
Welcome to Data Insights - Confirm Your Email
```

#### Email Body
You can use HTML and template variables. Here's an example with a button (Black & Neon Green theme):

```html
<div style="background-color: #0a0a0a; padding: 30px; border: 1px solid #39ff14; border-radius: 10px;">
  <h2 style="color: #39ff14; text-align: center;">Welcome to Data Insights!</h2>
  <p style="color: #ffffff;">Thank you for signing up. Please confirm your email address by clicking the button below:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
    <tr>
      <td align="center">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 35px; background-color: #39ff14; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);">Confirm Email Address</a>
      </td>
    </tr>
  </table>
  <p style="color: #cccccc;">If you didn't create an account, you can safely ignore this email.</p>
  <p style="color: #39ff14;">Best regards,<br>The Data Insights Team</p>
</div>
```

### 5. Available Template Variables

Supabase provides these variables you can use in your templates:

- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after confirmation

### 6. Example Custom Template - Black & Neon Green Theme

Here's a complete example for a branded confirmation email matching your brand colors:

**Subject:**
```
Confirm Your Data Insights Account
```

**Body:**
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #ffffff; margin: 0; padding: 20px; background-color: #000000;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 0; border-radius: 10px; border: 1px solid #39ff14; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-bottom: 2px solid #39ff14;">
      <h1 style="color: #39ff14; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);">Welcome to Data Insights!</h1>
    </div>
    <div style="padding: 40px; background-color: #0a0a0a;">
      <p style="color: #ffffff; margin-bottom: 15px;">Hi there,</p>
      <p style="color: #ffffff; margin-bottom: 15px;">Thank you for signing up for Data Insights. We're excited to have you on board!</p>
      <p style="color: #ffffff; margin-bottom: 30px;">To get started, please confirm your email address by clicking the button below:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
        <tr>
          <td align="center">
            <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 35px; background-color: #39ff14; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);">Confirm Email Address</a>
          </td>
        </tr>
      </table>
      <p style="color: #cccccc; margin-top: 30px;">Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #39ff14; font-size: 12px; background-color: #1a1a1a; padding: 10px; border-radius: 4px; border: 1px solid #39ff14;">{{ .ConfirmationURL }}</p>
      <p style="color: #999999; font-size: 12px; margin-top: 20px;">This link will expire in 24 hours.</p>
      <p style="color: #cccccc; margin-top: 30px;">If you didn't create an account with us, you can safely ignore this email.</p>
      <p style="color: #39ff14; margin-top: 30px;">Best regards,<br><strong>The Data Insights Team</strong></p>
    </div>
    <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #39ff14; opacity: 0.3;">
      <p style="color: #39ff14; font-size: 12px; margin: 0;">© 2024 Data Insights. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

### 7. Save and Test
1. Click **"Save"** to save your changes
2. Test by signing up with a test email address
3. Check that the email appears correctly

### 8. Password Reset Email Template - Black & Neon Green Theme

Here's a ready-to-use password reset template with a button matching your brand:

**Subject:**
```
Reset Your Data Insights Password
```

**Body:**
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #ffffff; margin: 0; padding: 20px; background-color: #000000;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 40px; border-radius: 10px; border: 1px solid #39ff14;">
    <h1 style="color: #39ff14; text-align: center; margin-bottom: 30px; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
    <p style="color: #ffffff;">Hi there,</p>
    <p style="color: #ffffff;">We received a request to reset your password for your Data Insights account. Click the button below to create a new password:</p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 35px; background-color: #39ff14; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);">Reset Password</a>
        </td>
      </tr>
    </table>
    
    <p style="color: #cccccc; font-size: 14px; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #39ff14; font-size: 12px; background-color: #1a1a1a; padding: 10px; border-radius: 4px; border: 1px solid #39ff14;">{{ .ConfirmationURL }}</p>
    
    <p style="color: #999999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
    <p style="color: #ff6b6b; font-size: 12px; font-weight: bold;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    
    <hr style="border: none; border-top: 1px solid #39ff14; margin: 30px 0; opacity: 0.3;">
    <p style="text-align: center; color: #39ff14; font-size: 12px;">© 2024 Data Insights. All rights reserved.</p>
  </div>
</body>
</html>
```

### 9. Other Email Templates

You can also customize:
- **Magic Link** - For passwordless login
- **Change Email Address** - When user changes email
- **Invite User** - When inviting team members

## Tips

1. **Keep it simple**: Don't overcomplicate the design
2. **Mobile-friendly**: Test on mobile devices
3. **Clear CTA**: Make the confirmation button/link prominent
4. **Brand consistency**: Use your brand colors and fonts
5. **Test thoroughly**: Always test before deploying to production

## Changing the Sender Email Address

By default, Supabase sends emails from `noreply@mail.app.supabase.io`. To change this to a custom sender like "Data Insights" or use your own domain, you have two options:

### Option 1: Custom SMTP (Recommended for Production)

This allows you to send emails from your own domain (e.g., `noreply@datainsights.io`):

1. **Go to Supabase Dashboard**:
   - Navigate to your project
   - Click **"Settings"** (gear icon) in the left sidebar
   - Click **"Auth"** in the settings menu
   - Scroll down to **"SMTP Settings"**

2. **Configure SMTP**:
   - Enable **"Enable Custom SMTP"**
   - Fill in your SMTP provider details:
     - **SMTP Host**: Your email provider's SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
     - **SMTP Port**: Usually `587` (TLS) or `465` (SSL)
     - **SMTP User**: Your email address or SMTP username
     - **SMTP Password**: Your email password or SMTP API key
     - **Sender Email**: The email address that will appear as sender (e.g., `noreply@datainsights.io`)
     - **Sender Name**: Display name (e.g., `Data Insights`)

3. **Popular SMTP Providers**:
   - **SendGrid**: Free tier available, easy setup
   - **Mailgun**: Developer-friendly
   - **Amazon SES**: Cost-effective for high volume
   - **Gmail**: Can use Gmail SMTP (requires app password)

4. **Example Configuration (SendGrid)**:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Password: [Your SendGrid API Key]
   Sender Email: noreply@datainsights.io
   Sender Name: Data Insights
   ```

5. **Save and Test**:
   - Click **"Save"**
   - Test by triggering a signup or password reset
   - Check that emails now come from your custom address

### Option 2: Supabase Custom Domain (Pro Plan)

If you're on Supabase Pro plan, you can use a custom domain:

1. **Go to Settings → Auth**
2. **Find "Custom Domain" section**
3. **Add your domain** (e.g., `datainsights.io`)
4. **Configure DNS records** as instructed by Supabase
5. **Verify domain ownership**
6. **Update sender email** to use your domain

### Quick Setup with Gmail (For Testing)

If you want to quickly test with Gmail:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account → Security → App passwords
   - Create a new app password for "Mail"
3. **Configure in Supabase**:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: your-email@gmail.com
   SMTP Password: [Your App Password]
   Sender Email: your-email@gmail.com
   Sender Name: Data Insights
   ```

### Important Notes

- **Free Tier Limitation**: Supabase free tier uses their default sender. Custom SMTP is available on paid plans.
- **Email Deliverability**: Using your own SMTP provider improves deliverability and reduces spam risk.
- **Domain Verification**: Some providers require domain verification for better deliverability.
- **SPF/DKIM Records**: For production, set up SPF and DKIM records for your domain to prevent emails from going to spam.

## Troubleshooting

- **Changes not appearing**: Clear your browser cache or try incognito mode
- **Variables not working**: Make sure you're using the correct syntax: `{{ .VariableName }}`
- **Styling issues**: Use inline CSS for better email client compatibility
- **Emails not sending**: Check SMTP credentials and firewall settings
- **Emails going to spam**: Set up SPF/DKIM records for your domain

