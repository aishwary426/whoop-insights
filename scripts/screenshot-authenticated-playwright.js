#!/usr/bin/env node

/**
 * Screenshot authenticated pages with login (Playwright version - more reliable)
 * Takes screenshots in 1080px chunks for both light and dark themes
 */

const { chromium } = require('playwright')
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
            waitUntil: 'networkidle',
            timeout: 30000,
        })
        
        // Wait for login form
        await page.waitForSelector('input[type="email"]', { timeout: 10000 })
        await page.waitForSelector('input[type="password"]', { timeout: 10000 })
        
        // Fill in credentials
        await page.fill('input[type="email"]', EMAIL)
        await page.fill('input[type="password"]', PASSWORD)
        
        // Wait a bit before submitting
        await page.waitForTimeout(500)
        
        // Click submit button
        await page.click('button[type="submit"]')
        
        // Wait for navigation after login
        await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(async () => {
            // Alternative: wait for navigation
            await page.waitForLoadState('networkidle', { timeout: 30000 })
        })
        
        // Wait a bit more for any redirects or data loading
        await page.waitForTimeout(3000)
        
        // Verify we're logged in
        const currentUrl = page.url()
        if (currentUrl.includes('/dashboard') || !currentUrl.includes('/login')) {
            console.log('✅ Login successful')
            return true
        } else {
            console.warn('⚠️  May not have logged in successfully, but continuing...')
            return true
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message)
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
            waitUntil: 'networkidle',
            timeout: 60000,
        })
        
        // Wait for loading spinners to disappear
        try {
            await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {})
            // Also wait for any loading text to disappear
            await page.waitForFunction(
                () => !document.body.textContent?.includes('Loading') && !document.body.textContent?.includes('Processing'),
                { timeout: 15000 }
            ).catch(() => {})
        } catch (e) {
            // Ignore if no spinner found
        }
        
        // Wait for main content to appear (try multiple selectors)
        const contentSelectors = [
            'main',
            '[role="main"]',
            '.container',
            'article',
            'section',
            'div[class*="dashboard"]',
            'div[class*="content"]',
            'nav', // Navigation is a good indicator UI is loaded
            'header',
        ]
        
        let contentFound = false
        for (const selector of contentSelectors) {
            try {
                const element = await page.waitForSelector(selector, { timeout: 10000 })
                if (element) {
                    // Check if element has visible content
                    const isVisible = await element.evaluate((el) => {
                        const rect = el.getBoundingClientRect()
                        return rect.width > 0 && rect.height > 0
                    })
                    if (isVisible) {
                        contentFound = true
                        break
                    }
                }
            } catch (e) {
                // Continue to next selector
            }
        }
        
        if (!contentFound) {
            console.warn('  ⚠️  No main content selector found, waiting for body content...')
            // Wait for body to have some content
            await page.waitForFunction(
                () => document.body && document.body.children.length > 0,
                { timeout: 10000 }
            ).catch(() => {})
        }
        
        // Wait for content to load and animations to complete
        await page.waitForTimeout(waitTime)
        
        // Wait for any lazy-loaded images or charts
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
        
        // Wait for React to finish rendering - check if body has substantial content
        await page.waitForFunction(
            () => {
                const body = document.body
                return body && (
                    body.scrollHeight > 500 || // Page has some height
                    body.children.length > 3 || // Has multiple elements
                    body.textContent && body.textContent.length > 100 // Has text content
                )
            },
            { timeout: 15000 }
        ).catch(() => {
            console.warn('  ⚠️  Page content might not be fully loaded')
        })
        
        // Final wait for any remaining async operations
        await page.waitForTimeout(2000)
        
        // Scroll to top
        await page.evaluate(() => {
            window.scrollTo(0, 0)
        })
        await page.waitForTimeout(1000)
        
        // Debug: Check if page has visible content
        const hasContent = await page.evaluate(() => {
            const body = document.body
            if (!body) return false
            const rect = body.getBoundingClientRect()
            const hasText = body.textContent && body.textContent.trim().length > 50
            const hasElements = body.children.length > 0
            const hasHeight = rect.height > 100
            return hasText && hasElements && hasHeight
        })
        
        if (!hasContent) {
            console.warn('  ⚠️  Page appears to have no visible content, waiting longer...')
            await page.waitForTimeout(5000)
        }
        
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
                window.scrollTo({
                    top: y,
                    behavior: 'instant'
                })
            }, scrollY)
            
            // Wait for scroll to complete and any lazy loading
            await page.waitForTimeout(1000)
            
            // Wait for any images or content in this viewport to load
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
            
            // Take screenshot of viewport (exactly 1080px)
            const filename = chunks > 1 
                ? `${pageName}-${theme}-part${chunkNumber}.png`
                : `${pageName}-${theme}.png`
            const outputPath = path.join(outputDir, filename)
            
            // Take screenshot of the current viewport (which shows the scrolled content)
            // The clip is relative to the viewport, so y:0 is the top of the visible area
            await page.screenshot({
                path: outputPath,
                clip: {
                    x: 0,
                    y: 0,
                    width: viewportWidth,
                    height: SCREENSHOT_HEIGHT
                },
                type: 'png',
                animations: 'disabled', // Disable animations for consistent screenshots
            })
            
            screenshots.push(outputPath)
            console.log(`    ✅ Saved chunk ${chunkNumber}/${chunks}: ${filename} (scroll: ${scrollY}px)`)
        }
        
        return screenshots
    } catch (error) {
        console.error(`  ❌ Error screenshotting ${url}:`, error.message)
        return []
    }
}

async function screenshotAllPages() {
    console.log('🚀 Starting authenticated screenshot process (Playwright)...\n')
    console.log(`📍 Base URL: ${BASE_URL}`)
    console.log(`📁 Output directory: ${OUTPUT_DIR}`)
    console.log(`👤 Email: ${EMAIL}\n`)
    
    // Create output directory
    await ensureDirectoryExists(OUTPUT_DIR)
    
    let browser
    try {
        browser = await chromium.launch({
            headless: true,
        })
    } catch (error) {
        console.error('❌ Failed to launch browser:', error.message)
        console.error('\n💡 Install Playwright browsers:')
        console.error('   npx playwright install chromium')
        process.exit(1)
    }
    
    const context = await browser.newContext({
        viewport: {
            width: VIEWPORT.width,
            height: VIEWPORT.height,
        },
        // Disable animations for consistent screenshots
        reducedMotion: 'reduce',
        // Set user agent
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    
    // Disable CSS animations and transitions
    await context.addInitScript(() => {
        const style = document.createElement('style')
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
        `
        document.head.appendChild(style)
    })
    
    const page = await context.newPage()
    
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
            
            // Take screenshots in chunks (longer wait time for data to load)
            const screenshots = await takeScreenshotChunks(
                page,
                url,
                OUTPUT_DIR,
                pageName,
                theme,
                5000 // Increased wait time for async data loading
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

