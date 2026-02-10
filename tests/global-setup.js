// tests/global-setup.js
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup() {
  // Ensure reports directory exists
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Create accessibility reports subdirectory
  const accessibilityReportsDir = path.join(reportsDir, 'accessibility');
  if (!fs.existsSync(accessibilityReportsDir)) {
    fs.mkdirSync(accessibilityReportsDir, { recursive: true });
  }

  console.log('🚀 Setting up accessibility testing environment...');
  
  // Verify the application is running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ Application is accessible and ready for testing');
  } catch (error) {
    console.error('❌ Failed to connect to application:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;