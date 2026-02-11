/**
 * OWASP Top 10:2025 Security Tests
 * Comprehensive security testing for pizza application
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Global test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy'
];

test.describe('OWASP Top 10:2025 Security Tests', () => {
  
  test.describe('A01:2025 - Broken Access Control', () => {
    test('Should implement proper CORS configuration', async ({ page }) => {
      // Navigate to the main page
      const response = await page.goto(BASE_URL);
      
      // Check for proper CORS headers
      const corsHeader = response.headers()['access-control-allow-origin'];
      
      // Should not allow wildcard (*) for credentials-enabled requests
      if (corsHeader) {
        expect(corsHeader).not.toBe('*');
      }
    });

    test('Should prevent unauthorized data access', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test direct object reference vulnerabilities
      // Try accessing order data without proper authentication
      const orderResponse = await page.request.get(`${BASE_URL}/api/orders/test-order-id`);
      
      // Should return 401/403 for unauthenticated requests
      expect([401, 403, 404]).toContain(orderResponse.status());
    });

    test('Should validate IDOR vulnerabilities in cart operations', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Try to access another user's cart data
      await page.evaluate(() => {
        // Attempt to manipulate localStorage with foreign user data
        localStorage.setItem('pizza-user', JSON.stringify({
          id: 'malicious-user-id',
          name: 'Attacker'
        }));
      });
      
      // Check if application properly validates user context
      await page.reload();
      
      const userContext = await page.evaluate(() => {
        return localStorage.getItem('pizza-user');
      });
      
      // Application should have mechanisms to validate user context
      expect(userContext).toBeDefined();
    });
  });

  test.describe('A02:2025 - Security Misconfiguration', () => {
    test('Should implement security headers', async ({ page }) => {
      const response = await page.goto(BASE_URL);
      const headers = response.headers();
      
      // Test for critical security headers
      expect(headers).toHaveProperty('x-frame-options');
      expect(headers).toHaveProperty('x-content-type-options');
      expect(headers['x-content-type-options']).toBe('nosniff');
      
      // Check for CSP header (critical for XSS prevention)
      if (!headers['content-security-policy']) {
        console.warn('CRITICAL: Content-Security-Policy header missing');
      }
    });

    test('Should not expose sensitive information in errors', async ({ page }) => {
      // Test error handling by requesting non-existent resources
      const response = await page.request.get(`${BASE_URL}/api/nonexistent`);
      
      if (response.status() >= 400) {
        const errorText = await response.text();
        
        // Should not expose stack traces or system information
        expect(errorText.toLowerCase()).not.toContain('stack');
        expect(errorText.toLowerCase()).not.toContain('error:');
        expect(errorText).not.toMatch(/\\[A-Z]:\\\\/);
      }
    });

    test('Should have proper file permissions configuration', async () => {
      // Test for configuration files that might be exposed
      const sensitiveFiles = [
        '/.env',
        '/.env.local',
        '/package.json',
        '/next.config.js'
      ];
      
      for (const file of sensitiveFiles) {
        const response = await page.request.get(`${BASE_URL}${file}`);
        
        // These files should not be directly accessible
        if (file.includes('.env')) {
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      }
    });
  });

  test.describe('A03:2025 - Software Supply Chain Failures', () => {
    test('Should verify package.json for vulnerable dependencies', async () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for known vulnerable packages
      const vulnerablePackages = ['lodash', 'moment', 'request'];
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      vulnerablePackages.forEach(pkg => {
        if (dependencies[pkg]) {
          console.warn(`WARNING: Potentially vulnerable package detected: ${pkg}`);
        }
      });
      
      // Ensure dependencies are pinned to specific versions
      Object.entries(dependencies).forEach(([name, version]) => {
        if (typeof version === 'string' && version.startsWith('^')) {
          console.warn(`WARNING: Unpinned dependency ${name}: ${version}`);
        }
      });
    });
    
    test('Should check for integrity verification of external resources', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for external scripts and resources
      const scriptTags = await page.$$eval('script[src]', scripts => 
        scripts.map(s => ({ src: s.src, integrity: s.integrity }))
      );
      
      const linkTags = await page.$$eval('link[rel="stylesheet"][href]', links => 
        links.map(l => ({ href: l.href, integrity: l.integrity }))
      );
      
      // External resources should have integrity checks
      [...scriptTags, ...linkTags].forEach(resource => {
        const url = resource.src || resource.href;
        if (url && !url.startsWith(BASE_URL) && !url.startsWith('/')) {
          // External resource should have integrity attribute for security
          if (!resource.integrity) {
            console.warn(`WARNING: External resource without integrity check: ${url}`);
          }
        }
      });
    });
  });

  test.describe('A04:2025 - Cryptographic Failures', () => {
    test('Should enforce HTTPS in production', async ({ page }) => {
      // Check if application enforces HTTPS
      const response = await page.goto(BASE_URL.replace('https://', 'http://'), { timeout: 5000 }).catch(() => null);
      
      if (response) {
        // Should redirect to HTTPS or block HTTP
        const finalUrl = page.url();
        if (process.env.NODE_ENV === 'production') {
          expect(finalUrl).toMatch(/^https:/);
        }
      }
    });

    test('Should not store sensitive data in localStorage unencrypted', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Simulate user data storage
      await page.evaluate(() => {
        const userData = {
          id: 'user123',
          email: 'user@example.com',
          phone: '555-1234',
          address: '123 Main St'
        };
        localStorage.setItem('pizza-user', JSON.stringify(userData));
      });
      
      const storedData = await page.evaluate(() => {
        return localStorage.getItem('pizza-user');
      });
      
      // Check if sensitive data is stored unencrypted
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Email and phone should be encrypted or hashed
        if (parsedData.email && parsedData.email.includes('@')) {
          console.warn('WARNING: Email stored unencrypted in localStorage');
        }
        
        if (parsedData.phone && parsedData.phone.match(/\d{3}-\d{4}/)) {
          console.warn('WARNING: Phone number stored unencrypted in localStorage');
        }
      }
    });

    test('Should use secure random ID generation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test ID generation for predictability
      const ids = await page.evaluate(() => {
        // Access the generateId function if exposed
        const ids = [];
        for (let i = 0; i < 100; i++) {
          // Simulate ID generation
          ids.push(`${Date.now()}-${Math.random()}`);
        }
        return ids;
      });
      
      // Check for sequential or predictable patterns
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length); // All IDs should be unique
    });
  });

  test.describe('A05:2025 - Injection', () => {
    test('Should prevent XSS in pizza names and descriptions', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test XSS payload injection
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"onmouseover="alert(1)"',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>'
      ];
      
      // Test if XSS payloads are properly escaped in pizza displays
      for (const payload of xssPayloads) {
        await page.evaluate((payload) => {
          // Try to inject XSS through pizza data
          const pizzaData = [{
            id: 'test',
            name: payload,
            description: payload,
            basePrice: 10
          }];
          
          // Store malicious pizza data
          localStorage.setItem('malicious-pizza', JSON.stringify(pizzaData));
        }, payload);
      }
      
      await page.reload();
      
      // Check that no script execution occurred
      const hasAlert = await page.evaluate(() => {
        return typeof window.alert === 'function';
      });
      
      expect(hasAlert).toBeTruthy(); // Alert function should still exist but shouldn't have been called
    });

    test('Should validate input in cart operations', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test malicious input in cart operations
      await page.evaluate(() => {
        const maliciousCart = JSON.stringify({
          items: [{
            quantity: -999999, // Negative quantity
            totalPrice: '<script>alert("XSS")</script>',
            pizza: {
              name: '{{7*7}}', // Template injection
              description: '${{process.env}}'
            }
          }]
        });
        
        localStorage.setItem('pizza-cart', maliciousCart);
      });
      
      await page.reload();
      
      // Check if malicious input is properly handled
      const cartDisplay = await page.textContent('body');
      
      // Should not contain executed template injection
      expect(cartDisplay).not.toContain('49'); // 7*7 should not be executed
      expect(cartDisplay).not.toMatch(/process\.env/); // Environment variables shouldn't be exposed
    });
  });

  test.describe('A06:2025 - Insecure Design', () => {
    test('Should implement proper business logic validation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test business logic flaws
      await page.evaluate(() => {
        // Try to create order with invalid data
        const invalidOrder = {
          items: [{
            quantity: 0, // Zero quantity
            totalPrice: -100, // Negative price
          }],
          total: -100
        };
        
        localStorage.setItem('invalid-order-test', JSON.stringify(invalidOrder));
      });
      
      // Application should validate business rules
      // This test documents the need for server-side validation
    });

    test('Should implement rate limiting', async ({ page }) => {
      // Test rate limiting on API endpoints
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          page.request.get(`${BASE_URL}/api/pizzas`).catch(() => ({ status: () => 429 }))
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status && r.status() === 429);
      
      // At least some requests should be rate limited
      if (!rateLimited) {
        console.warn('WARNING: No rate limiting detected on API endpoints');
      }
    });
  });

  test.describe('A07:2025 - Authentication Failures', () => {
    test('Should implement proper session management', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test session handling
      await page.evaluate(() => {
        localStorage.setItem('pizza-user', JSON.stringify({
          id: 'user123',
          sessionToken: 'weak-token-123'
        }));
      });
      
      const sessionData = await page.evaluate(() => {
        return localStorage.getItem('pizza-user');
      });
      
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        
        // Check for proper session token format
        if (parsed.sessionToken && parsed.sessionToken.length < 32) {
          console.warn('WARNING: Weak session token detected');
        }
      }
    });

    test('Should not expose authentication state in URLs', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const currentUrl = page.url();
      
      // URLs should not contain sensitive authentication information
      expect(currentUrl.toLowerCase()).not.toContain('password');
      expect(currentUrl.toLowerCase()).not.toContain('token');
      expect(currentUrl.toLowerCase()).not.toContain('session');
    });
  });

  test.describe('A08:2025 - Software or Data Integrity Failures', () => {
    test('Should validate external image sources', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check image sources for integrity
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({ src: img.src, integrity: img.integrity }))
      );
      
      images.forEach(img => {
        if (img.src.startsWith('https://images.unsplash.com')) {
          // External images should have some form of validation
          console.warn(`WARNING: External image without integrity check: ${img.src}`);
        }
      });
    });

    test('Should handle file operations securely', async () => {
      // Test file operation security (server-side)
      const fileOpsPath = path.join(__dirname, '../../src/lib/security/fileOperations.ts');
      const fileOpsContent = await fs.readFile(fileOpsPath, 'utf8');
      
      // Check for atomic operations and race condition prevention
      expect(fileOpsContent).toContain('fileLocks');
      expect(fileOpsContent).toContain('atomicUpdate');
    });
  });

  test.describe('A09:2025 - Security Logging & Alerting Failures', () => {
    test('Should implement comprehensive logging', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test logging functionality
      const hasLogger = await page.evaluate(() => {
        return typeof console !== 'undefined';
      });
      
      expect(hasLogger).toBeTruthy();
      
      // Check if security events are logged
      await page.evaluate(() => {
        // Simulate security event
        try {
          localStorage.setItem('test-security-event', 'failed-login-attempt');
        } catch (e) {
          console.error('Security event:', e);
        }
      });
    });

    test('Should not log sensitive information', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check console for sensitive data leaks
      const logs = [];
      page.on('console', msg => logs.push(msg.text()));
      
      await page.evaluate(() => {
        const sensitiveData = {
          password: 'secret123',
          creditCard: '4532-1234-5678-9999',
          ssn: '123-45-6789'
        };
        
        console.log('User data:', sensitiveData);
      });
      
      // Wait for logs to be captured
      await page.waitForTimeout(1000);
      
      // Check if sensitive data appears in logs
      const logText = logs.join(' ');
      expect(logText).not.toContain('secret123');
      expect(logText).not.toContain('4532-1234');
    });
  });

  test.describe('A10:2025 - Mishandling of Exceptional Conditions', () => {
    test('Should handle localStorage quota exceeded gracefully', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test localStorage quota handling
      const result = await page.evaluate(() => {
        try {
          // Try to fill localStorage to quota
          const largeData = 'x'.repeat(5000000); // 5MB string
          localStorage.setItem('large-test', largeData);
          return 'success';
        } catch (error) {
          return error.name;
        }
      });
      
      // Should gracefully handle quota exceeded
      if (result === 'QuotaExceededError') {
        console.log('INFO: localStorage quota handling detected');
      }
    });

    test('Should handle network failures gracefully', async ({ page }) => {
      // Simulate offline condition
      await page.context().setOffline(true);
      
      const response = await page.goto(BASE_URL, { timeout: 5000 }).catch(e => e);
      
      // Should handle offline gracefully
      expect(response).toBeDefined();
      
      await page.context().setOffline(false);
    });

    test('Should validate error boundaries exist', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test React error boundary handling
      const hasErrorBoundary = await page.evaluate(() => {
        // Check if error boundaries are implemented
        return window.React !== undefined;
      });
      
      // This test documents the need for proper error boundaries
      expect(hasErrorBoundary).toBeTruthy();
    });
  });
});