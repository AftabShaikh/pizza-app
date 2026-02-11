/**
 * Software Supply Chain Security Audit
 * OWASP A03:2025 - Software Supply Chain Failures
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Known vulnerable packages and versions
 */
const KNOWN_VULNERABILITIES = {
  'lodash': {
    versions: ['< 4.17.12'],
    cve: 'CVE-2019-10744',
    severity: 'HIGH',
    description: 'Prototype pollution vulnerability'
  },
  'moment': {
    versions: ['all'],
    cve: 'Legacy package',
    severity: 'MEDIUM',
    description: 'Legacy package, use date-fns or dayjs instead'
  },
  'request': {
    versions: ['all'],
    cve: 'Deprecated',
    severity: 'MEDIUM',
    description: 'Deprecated package, use axios or fetch'
  },
  'node-sass': {
    versions: ['< 7.0.0'],
    cve: 'Multiple',
    severity: 'HIGH',
    description: 'Multiple vulnerabilities, use dart-sass'
  }
};

/**
 * Audit package.json for security issues
 */
async function auditPackageJson() {
  const results = {
    vulnerabilities: [],
    warnings: [],
    info: [],
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  };

  try {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };

    // Check for known vulnerabilities
    for (const [pkg, version] of Object.entries(allDeps)) {
      results.summary.total++;
      
      if (KNOWN_VULNERABILITIES[pkg]) {
        const vuln = KNOWN_VULNERABILITIES[pkg];
        const finding = {
          type: 'vulnerability',
          package: pkg,
          version: version,
          severity: vuln.severity,
          cve: vuln.cve,
          description: vuln.description,
          recommendation: `Update or replace ${pkg}`
        };
        
        results.vulnerabilities.push(finding);
        
        switch (vuln.severity) {
          case 'CRITICAL': results.summary.critical++; break;
          case 'HIGH': results.summary.high++; break;
          case 'MEDIUM': results.summary.medium++; break;
          case 'LOW': results.summary.low++; break;
        }
      }
      
      // Check for unpinned versions
      if (version.startsWith('^') || version.startsWith('~')) {
        results.warnings.push({
          type: 'unpinned_version',
          package: pkg,
          version: version,
          message: 'Version not pinned - potential for supply chain attacks',
          recommendation: 'Pin to specific version or use lockfile'
        });
      }
      
      // Check for pre-release versions
      if (version.includes('alpha') || version.includes('beta') || version.includes('rc')) {
        results.warnings.push({
          type: 'prerelease',
          package: pkg,
          version: version,
          message: 'Using pre-release version',
          recommendation: 'Consider using stable version for production'
        });
      }
    }
    
    // Check for lockfile presence
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    const hasLockFile = await Promise.all(
      lockFiles.map(async (file) => {
        try {
          await fs.access(path.join(__dirname, '../../', file));
          return file;
        } catch {
          return null;
        }
      })
    ).then(results => results.filter(Boolean));
    
    if (hasLockFile.length === 0) {
      results.vulnerabilities.push({
        type: 'missing_lockfile',
        severity: 'HIGH',
        description: 'No lockfile found - dependencies not pinned',
        recommendation: 'Generate and commit lockfile (npm install, yarn, or pnpm install)'
      });
      results.summary.high++;
    } else {
      results.info.push({
        type: 'lockfile_present',
        files: hasLockFile,
        message: 'Dependency lockfile found'
      });
    }
    
  } catch (error) {
    results.vulnerabilities.push({
      type: 'audit_error',
      severity: 'CRITICAL',
      description: `Failed to audit dependencies: ${error.message}`,
      recommendation: 'Fix package.json format and re-run audit'
    });
    results.summary.critical++;
  }
  
  return results;
}

/**
 * Run npm audit if available
 */
async function runNpmAudit() {
  try {
    const output = execSync('npm audit --json', { 
      cwd: path.join(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 30000
    });
    
    return JSON.parse(output);
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities found
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Generate supply chain security report
 */
async function generateSupplyChainReport() {
  console.log('🔍 Running Software Supply Chain Security Audit...');
  
  const packageAudit = await auditPackageJson();
  const npmAudit = await runNpmAudit();
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: packageAudit.summary,
    vulnerabilities: packageAudit.vulnerabilities,
    warnings: packageAudit.warnings,
    npmAudit: npmAudit,
    recommendations: [
      'Pin all dependency versions to prevent supply chain attacks',
      'Regularly update dependencies to latest secure versions',
      'Use npm audit or yarn audit to check for known vulnerabilities',
      'Implement automated dependency scanning in CI/CD pipeline',
      'Consider using tools like Snyk or Dependabot for continuous monitoring',
      'Verify package signatures where possible',
      'Review dependency tree for unnecessary packages'
    ]
  };
  
  return report;
}

// Export for use in tests
if (require.main === module) {
  generateSupplyChainReport().then(report => {
    console.log('\n📊 Supply Chain Security Report:');
    console.log('================================');
    console.log(`Total Dependencies: ${report.summary.total}`);
    console.log(`Vulnerabilities: ${report.vulnerabilities.length}`);
    console.log(`Warnings: ${report.warnings.length}`);
    
    if (report.vulnerabilities.length > 0) {
      console.log('\n🚨 Vulnerabilities Found:');
      report.vulnerabilities.forEach(vuln => {
        console.log(`  - ${vuln.severity}: ${vuln.package || 'System'} - ${vuln.description}`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      report.warnings.slice(0, 5).forEach(warning => {
        console.log(`  - ${warning.package}: ${warning.message}`);
      });
      
      if (report.warnings.length > 5) {
        console.log(`  ... and ${report.warnings.length - 5} more warnings`);
      }
    }
    
    console.log('\n📋 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  }).catch(console.error);
}

module.exports = { generateSupplyChainReport, auditPackageJson, runNpmAudit };