# Screenshot Guide

This guide explains how to take screenshots of all pages in your application.

## Quick Start

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Start your development server**:
   ```bash
   npm run dev
   ```

3. **In another terminal, run the screenshot script**:
   ```bash
   npm run screenshot:all
   ```

Screenshots will be saved in the `screenshots/` directory.

## Options

### Custom Port
If your app runs on a different port:
```bash
npm run screenshot:all -- --port=3001
```

### Custom Output Directory
```bash
npm run screenshot:all -- --output=my-screenshots
```

### Custom Base URL
```bash
npm run screenshot:all -- --url=http://localhost:3000
```

### Combined Options
```bash
npm run screenshot:all -- --port=3001 --output=screenshots/production
```

## What Gets Screenshot

The script captures all public pages in multiple viewport sizes:

- **Desktop**: 1920x1080 (Retina quality)
- **Tablet**: 768x1024
- **Mobile**: 375x667

### Pages Included

- Home (`/`)
- About (`/about`)
- Features (`/features`)
- How It Works (`/how-it-works`)
- Pricing (`/pricing`)
- FAQ (`/faq`)
- Contact (`/contact`)
- Privacy (`/privacy`)
- Terms (`/terms`)
- Security (`/security`)
- Why (`/why`)
- Roadmap (`/roadmap`)
- Blog (`/blog`)
- Login (`/login`)
- Signup (`/signup`)
- Forgot Password (`/forgot-password`)

## Output Structure

Screenshots are saved with the naming pattern:
```
screenshots/
  ├── home-desktop.png
  ├── home-tablet.png
  ├── home-mobile.png
  ├── about-desktop.png
  ├── about-tablet.png
  └── ...
```

## Adding More Pages

Edit `scripts/screenshot-pages.js` and add pages to the `PAGES` array:

```javascript
const PAGES = [
    { path: '/your-new-page', name: 'your-new-page', waitFor: 2000 },
    // ...
]
```

## Authenticated Pages

For pages that require authentication (like `/dashboard`), you'll need to:

1. **Login first** in the script
2. **Save cookies/session**
3. **Use the session** for authenticated routes

Example modification for authenticated pages:

```javascript
// After browser launch
const page = await browser.newPage()

// Login
await page.goto(`${BASE_URL}/login`)
await page.type('input[name="email"]', 'your-email@example.com')
await page.type('input[name="password"]', 'your-password')
await page.click('button[type="submit"]')
await page.waitForNavigation()

// Save cookies
const cookies = await page.cookies()
await page.setCookie(...cookies)

// Now you can screenshot authenticated pages
```

## Troubleshooting

### "Navigation timeout"
- Make sure your dev server is running
- Increase timeout in the script if pages load slowly
- Check that the port matches your running server

### "Page not found"
- Verify the page path exists in your app
- Check for typos in the `PAGES` array

### Screenshots are blank
- Increase the `waitFor` time for pages with heavy animations
- Check browser console for JavaScript errors

### Missing content in screenshots
- Some content may be lazy-loaded - the script scrolls to trigger loading
- Increase `waitFor` time for pages with slow-loading content

## Alternative: Manual Screenshots

If you prefer manual screenshots:

1. **Browser Extensions**:
   - [Full Page Screen Capture](https://chrome.google.com/webstore/detail/full-page-screen-capture/fdpohaocaechififmbbbbbknoalclacl) (Chrome)
   - [FireShot](https://chrome.google.com/webstore/detail/take-webpage-screenshots/mcbpblocgmgfnpjjppndjkmgjaogfceg) (Chrome)

2. **Command Line Tools**:
   - `wkhtmltopdf` - Convert pages to PDF
   - `playwright` - Alternative to Puppeteer

3. **Online Tools**:
   - [Screenshot.guru](https://screenshot.guru/)
   - [Page2Images](https://www.page2images.com/)

## Tips

- Run screenshots after making design changes to track visual regressions
- Use screenshots for documentation, marketing materials, or bug reports
- Consider automating screenshots in CI/CD for visual regression testing
- Screenshots are saved as PNG with 2x device pixel ratio (Retina quality)

