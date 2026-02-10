// tests/global-teardown.js
import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  console.log('🧹 Cleaning up accessibility testing environment...');
  
  // Generate summary report
  const reportsDir = path.join(process.cwd(), 'reports');
  const summaryPath = path.join(reportsDir, 'accessibility-summary.json');
  
  try {
    // Read all accessibility test results
    const accessibilityResultsPath = path.join(reportsDir, 'accessibility-results.json');
    
    if (fs.existsSync(accessibilityResultsPath)) {
      const results = JSON.parse(fs.readFileSync(accessibilityResultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.suites?.reduce((acc, suite) => acc + suite.tests.length, 0) || 0,
        passed: results.suites?.reduce((acc, suite) => 
          acc + suite.tests.filter(test => test.outcome === 'expected').length, 0) || 0,
        failed: results.suites?.reduce((acc, suite) => 
          acc + suite.tests.filter(test => test.outcome === 'unexpected').length, 0) || 0,
        skipped: results.suites?.reduce((acc, suite) => 
          acc + suite.tests.filter(test => test.outcome === 'skipped').length, 0) || 0,
        duration: results.stats?.duration || 0
      };
      
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log(`📊 Test Summary:
        Total: ${summary.totalTests}
        Passed: ${summary.passed}
        Failed: ${summary.failed}
        Skipped: ${summary.skipped}
        Duration: ${Math.round(summary.duration / 1000)}s`);
    }
    
    console.log('✅ Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

export default globalTeardown;