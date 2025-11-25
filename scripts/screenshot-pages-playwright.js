#!/usr/bin/env node

/**
 * Screenshot all pages using Playwright (more reliable alternative)
 * 
 * Usage:
 *   npm install playwright
 *   node scripts/screenshot-pages-playwright.js
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

// Configuration
const DEFAULT_PORT = process.env.PORT || 3000
const DEFAULT_BASE_URL = `http://localhost:${DEFAULT_PORT}`
const DEFAULT_OUTPUT_DIR = 'screenshots'

// Get command line arguments
const args = process.argv.slice(2)
const portArg = args.find(arg => arg.startsWith('--port='))
const outputArg = args.find(arg => arg.startsWith('--output='))
const baseUrlArg = args.find(arg => arg.startsWith('--url='))

const PORT = portArg ? portArg.split('=')[1] : DEFAULT_PORT
const BASE_URL = baseUrlArg ? baseUrlArg.split('=')[1] : DEFAULT_BASE_URL
const OUTPUT_DIR = outputArg ? outputArg.split('=')[1] : DEFAULT_OUTPUT_DIR

// List of all public pages to screenshot
const PAGES = [
    { path: '/', name: 'home', waitFor: 2000 },
    { path: '/about', name: 'about', waitFor: 2000 },
    { path: '/features', name: 'features', waitFor: 2000 },
    { path: '/how-it-works', name: 'how-it-works', waitFor: 2000 },
    { path: '/pricing', name: 'pricing', waitFor: 2000 },
    { path: '/faq', name: 'faq', waitFor: 2000 },
    { path: '/contact', name: 'contact', waitFor: 2000 },
    { path: '/privacy', name: 'privacy', waitFor: 2000 },
    { path: '/terms', name: 'terms', waitFor: 2000 },
    { path: '/security', name: 'security', waitFor: 2000 },
    { path: '/why', name: 'why', waitFor: 2000 },
    { path: '/roadmap', name: 'roadmap', waitFor: 2000 },
    { path: '/blog', name: 'blog', waitFor: 2000 },
    { path: '/login', name: 'login', waitFor: 2000 },
    { path: '/signup', name: 'signup', waitFor: 2000 },
    { path: '/forgot-password', name: 'forgot-password', waitFor: 2000 },
]

// Viewport configurations
const VIEWPORTS = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
]

async function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

async function takeScreenshot(page, url, outputPath, viewport, waitTime = 2000) {
    try {
        console.log(`  📸 Screenshotting ${viewport.name} (${viewport.width}x${viewport.height})...`)
        
        await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
        })
        
        await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 60000,
        })
        
        // Wait for any animations or lazy-loaded content
        await page.waitForTimeout(waitTime)
        
        // Scroll to bottom to trigger lazy loading
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight)
        })
        await page.waitForTimeout(500)
        
        // Scroll back to top
        await page.evaluate(() => {
            window.scrollTo(0, 0)
        })
        await page.waitForTimeout(500)
        
        await page.screenshot({
            path: outputPath,
            fullPage: true,
            type: 'png',
        })
        
        console.log(`  ✅ Saved: ${outputPath}`)
        return true
    } catch (error) {
        console.error(`  ❌ Error screenshotting ${url}:`, error.message)
        return false
    }
}

async function screenshotAllPages() {
    console.log('🚀 Starting screenshot process (Playwright)...\n')
    console.log(`📍 Base URL: ${BASE_URL}`)
    console.log(`📁 Output directory: ${OUTPUT_DIR}\n`)
    
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
        viewport: { width: 1920, height: 1080 },
    })
    
    const page = await context.newPage()
    
    const results = {
        success: 0,
        failed: 0,
        total: 0,
    }
    
    for (const pageConfig of PAGES) {
        const url = `${BASE_URL}${pageConfig.path}`
        const pageName = pageConfig.name || pageConfig.path.replace(/\//g, '-').replace(/^-/, '') || 'index'
        
        console.log(`\n📄 Processing: ${pageConfig.path}`)
        
        for (const viewport of VIEWPORTS) {
            const filename = `${pageName}-${viewport.name}.png`
            const outputPath = path.join(OUTPUT_DIR, filename)
            
            results.total++
            const success = await takeScreenshot(
                page,
                url,
                outputPath,
                viewport,
                pageConfig.waitFor
            )
            
            if (success) {
                results.success++
            } else {
                results.failed++
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

