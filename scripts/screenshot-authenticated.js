#!/usr/bin/env node

/**
 * Screenshot authenticated pages with login
 * Takes screenshots in 1080px chunks for both light and dark themes
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

// Configuration
const DEFAULT_PORT = process.env.PORT || 3000
const DEFAULT_BASE_URL = `http://localhost:${DEFAULT_PORT}`
const DEFAULT_OUTPUT_DIR = 'screenshots'

// Login credentials
const EMAIL = 'ctaishwary@gmail.com'
const PASSWORD = 'ashu1234'

// Get command line arguments
const args = process.argv.slice(2)
const portArg = args.find(arg => arg.startsWith('--port='))
const outputArg = args.find(arg => arg.startsWith('--output='))
const baseUrlArg = args.find(arg => arg.startsWith('--url='))

const PORT = portArg ? portArg.split('=')[1] : DEFAULT_PORT
const BASE_URL = baseUrlArg ? baseUrlArg.split('=')[1] : DEFAULT_BASE_URL
const OUTPUT_DIR = outputArg ? outputArg.split('=')[1] : DEFAULT_OUTPUT_DIR

// Pages to screenshot (authenticated pages)
const PAGES = [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/advanced-analytics', name: 'advanced-analytics' },
    { path: '/upload', name: 'upload' },
    { path: '/gps-burn-analytics', name: 'gps-burn-analytics' },
    { path: '/model-metrics', name: 'model-metrics' },
    { path: '/settings', name: 'settings' },
]

// Viewport: Desktop only, 1920x1080
const VIEWPORT = {
    width: 1920,
    height: 1080,
    name: 'desktop'
}

const SCREENSHOT_HEIGHT = 1080 // Exactly 1080 pixels per screenshot

async function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

async function login(page, baseUrl) {
    console.log('🔐 Logging in...')
    
    try {
        await page.goto(`${baseUrl}/login`, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        })
        
        // Wait for login form
        await page.waitForSelector('input[type="email"]', { timeout: 10000 })
        await page.waitForSelector('input[type="password"]', { timeout: 10000 })
        
        // Clear and fill in email
        await page.click('input[type="email"]')
        await page.keyboard.down('Control')
        await page.keyboard.press('KeyA')
        await page.keyboard.up('Control')
        await page.type('input[type="email"]', EMAIL, { delay: 50 })
        
        // Clear and fill in password
        await page.click('input[type="password"]')
        await page.keyboard.down('Control')
        await page.keyboard.press('KeyA')
        await page.keyboard.up('Control')
        await page.type('input[type="password"]', PASSWORD, { delay: 50 })
        
        // Wait a bit before submitting
        await page.waitForTimeout(500)
        
        // Click submit button - try multiple selectors
        const submitButton = await page.$('button[type="submit"]') || 
                            await page.$('button:has-text("Sign In")') ||
                            await page.$('button:has-text("Signing in")')
        
        if (submitButton) {
            await submitButton.click()
        } else {
            // Fallback: press Enter
            await page.keyboard.press('Enter')
        }
        
        // Wait for navigation after login (check for dashboard URL)
        try {
            await page.waitForFunction(
                () => window.location.pathname.includes('/dashboard'),
                { timeout: 30000 }
            )
        } catch (e) {
            // Alternative: wait for navigation
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {})
        }
        
        // Wait a bit more for any redirects or data loading
        await page.waitForTimeout(3000)
        
        // Verify we're logged in by checking URL or page content
        const currentUrl = page.url()
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/login') === false) {
            console.log('✅ Login successful')
            return true
        } else {
            console.warn('⚠️  May not have logged in successfully, but continuing...')
            return true // Continue anyway
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message)
        // Try to continue anyway - maybe already logged in
        console.log('⚠️  Attempting to continue...')
        return true
    }
}

async function setTheme(page, theme) {
    console.log(`  🎨 Setting theme to: ${theme}`)
    
    try {
        // Set theme using next-themes approach (localStorage + class)
        await page.evaluate((t) => {
            // Set localStorage for next-themes
            localStorage.setItem('theme', t)
            
            // Set class on html element
            if (t === 'dark') {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
            
            // Also set data-theme attribute if needed
            document.documentElement.setAttribute('data-theme', t)
        }, theme)
        
        // Wait for theme to apply
        await page.waitForTimeout(1000)
        
        // Verify theme is set
        const currentTheme = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        })
        
        if (currentTheme === theme) {
            console.log(`  ✅ Theme set to ${theme}`)
            return true
        } else {
            // Try clicking theme toggle if available
            try {
                const themeToggle = await page.$('button[aria-label*="theme" i], [data-theme-toggle], button:has-text("Dark"), button:has-text("Light")')
                if (themeToggle) {
                    await themeToggle.click()
                    await page.waitForTimeout(1000)
                }
            } catch (e) {
                // Ignore
            }
            
            // Force set again
            await page.evaluate((t) => {
                if (t === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
                localStorage.setItem('theme', t)
            }, theme)
            await page.waitForTimeout(500)
            
            console.log(`  ✅ Theme forced to ${theme}`)
            return true
        }
    } catch (error) {
        console.warn(`  ⚠️  Error setting theme: ${error.message}, forcing...`)
        // Force direct DOM manipulation
        await page.evaluate((t) => {
            if (t === 'dark') {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
            localStorage.setItem('theme', t)
        }, theme)
        await page.waitForTimeout(500)
        return true
    }
}

async function takeScreenshotChunks(page, url, outputDir, pageName, theme, waitTime = 3000) {
    try {
        console.log(`  📸 Navigating to ${url}...`)
        
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        })
        
        // Wait for content to load
        await page.waitForTimeout(waitTime)
        
        // Scroll to top
        await page.evaluate(() => {
            window.scrollTo(0, 0)
        })
        await page.waitForTimeout(500)
        
        // Get page dimensions
        const pageDimensions = await page.evaluate(() => {
            return {
                width: Math.max(
                    document.body.scrollWidth,
                    document.body.offsetWidth,
                    document.documentElement.clientWidth,
                    document.documentElement.scrollWidth,
                    document.documentElement.offsetWidth
                ),
                height: Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                )
            }
        })
        
        const totalHeight = pageDimensions.height
        const viewportWidth = VIEWPORT.width
        const chunks = Math.ceil(totalHeight / SCREENSHOT_HEIGHT)
        
        console.log(`  📏 Page height: ${totalHeight}px, taking ${chunks} screenshot(s)`)
        
        const screenshots = []
        
        for (let i = 0; i < chunks; i++) {
            const scrollY = i * SCREENSHOT_HEIGHT
            const chunkNumber = i + 1
            
            // Scroll to position
            await page.evaluate((y) => {
                window.scrollTo(0, y)
            }, scrollY)
            
            await page.waitForTimeout(500) // Wait for scroll to complete
            
            // Take screenshot of viewport (exactly 1080px)
            const filename = chunks > 1 
                ? `${pageName}-${theme}-part${chunkNumber}.png`
                : `${pageName}-${theme}.png`
            const outputPath = path.join(outputDir, filename)
            
            await page.screenshot({
                path: outputPath,
                clip: {
                    x: 0,
                    y: 0,
                    width: viewportWidth,
                    height: SCREENSHOT_HEIGHT
                },
                type: 'png',
            })
            
            screenshots.push(outputPath)
            console.log(`    ✅ Saved chunk ${chunkNumber}/${chunks}: ${filename}`)
        }
        
        return screenshots
    } catch (error) {
        console.error(`  ❌ Error screenshotting ${url}:`, error.message)
        return []
    }
}

async function screenshotAllPages() {
    console.log('🚀 Starting authenticated screenshot process...\n')
    console.log(`📍 Base URL: ${BASE_URL}`)
    console.log(`📁 Output directory: ${OUTPUT_DIR}`)
    console.log(`👤 Email: ${EMAIL}\n`)
    
    // Create output directory
    await ensureDirectoryExists(OUTPUT_DIR)
    
    let browser
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ],
            ignoreHTTPSErrors: true,
            timeout: 60000,
        })
    } catch (error) {
        console.error('❌ Failed to launch browser:', error.message)
        console.error('\n💡 Try: npx puppeteer browsers install chrome')
        process.exit(1)
    }
    
    const page = await browser.newPage()
    
    // Set viewport
    await page.setViewport({
        width: VIEWPORT.width,
        height: VIEWPORT.height,
        deviceScaleFactor: 2, // Retina quality
    })
    
    page.setDefaultNavigationTimeout(60000)
    page.setDefaultTimeout(60000)
    
    // Login first
    const loginSuccess = await login(page, BASE_URL)
    if (!loginSuccess) {
        console.error('❌ Cannot proceed without login')
        await browser.close()
        process.exit(1)
    }
    
    const results = {
        success: 0,
        failed: 0,
        total: 0,
    }
    
    const themes = ['light', 'dark']
    
    for (const pageConfig of PAGES) {
        const url = `${BASE_URL}${pageConfig.path}`
        const pageName = pageConfig.name || pageConfig.path.replace(/\//g, '-').replace(/^-/, '') || 'index'
        
        console.log(`\n📄 Processing: ${pageConfig.path}`)
        
        for (const theme of themes) {
            console.log(`\n  Theme: ${theme}`)
            
            // Set theme
            await setTheme(page, theme)
            
            // Take screenshots in chunks
            const screenshots = await takeScreenshotChunks(
                page,
                url,
                OUTPUT_DIR,
                pageName,
                theme,
                3000
            )
            
            if (screenshots.length > 0) {
                results.success += screenshots.length
                results.total += screenshots.length
            } else {
                results.failed++
                results.total++
            }
        }
    }
    
    await browser.close()
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 Screenshot Summary:')
    console.log(`   ✅ Successful: ${results.success}`)
    console.log(`   ❌ Failed: ${results.failed}`)
    console.log(`   📦 Total: ${results.total}`)
    console.log(`   📁 Output: ${path.resolve(OUTPUT_DIR)}`)
    console.log('='.repeat(50))
}

// Run the script
screenshotAllPages().catch(error => {
    console.error('\n❌ Fatal error:', error.message)
    if (error.stack) {
        console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
})

