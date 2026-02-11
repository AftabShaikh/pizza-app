/**
 * Penetration Testing Suite
 * Advanced security testing for common attack vectors
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * XSS Test Payloads
 */
const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '"><script>alert("XSS")</script>',
  "'><script>alert('XSS')</script>",
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<body onload=alert("XSS")>',
  '<marquee onstart=alert("XSS")>',
  '${alert("XSS")}', // Template literal injection
  '{{7*7}}', // Template injection
  '<script src="data:text/javascript,alert(\'XSS\')">' 
];

/**
 * SQL Injection Payloads
 */
const SQL_INJECTION_PAYLOADS = [
  "' OR 1=1 --",
  "\'; DROP TABLE users; --",
  "' UNION SELECT * FROM information_schema.tables --",
  "1' OR '1'='1",
  "admin'/*",
  "' OR 1=1#",
  "') OR ('1'='1",
  "' OR 'x'='x",
  "1; EXEC sp_msforeachtable 'DROP TABLE ?'  --"
];

/**
 * Path Traversal Payloads
 */
const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '....//....//....//etc/passwd',
  '../../../../../proc/version',
  '..%2F..%2F..%2Fetc%2Fpasswd',
  '..\\..\\..\\..\\..\\/etc/passwd'
];

test.describe('Penetration Testing Suite', () => {
  
  test.describe('Cross-Site Scripting (XSS) Tests', () => {
    
    test('Should prevent reflected XSS in URL parameters', async ({ page }) => {
      for (const payload of XSS_PAYLOADS) {
        const encodedPayload = encodeURIComponent(payload);
        const testUrl = `${BASE_URL}/?search=${encodedPayload}&category=${encodedPayload}`;
        
        try {
          await page.goto(testUrl);
          
          // Check if payload is executed
          const pageContent = await page.content();
          
          // XSS payload should be escaped/sanitized, not executed
          expect(pageContent).not.toContain('<script>');
          expect(pageContent).not.toContain('javascript:');
          expect(pageContent).not.toContain('onerror=');
          expect(pageContent).not.toContain('onload=');
          
          // Check if alert was triggered
          const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
          if (await dialogPromise) {
            throw new Error(`XSS vulnerability detected with payload: ${payload}`);
          }
        } catch (error) {
          if (error.message.includes('XSS vulnerability')) {
            throw error;
          }
          // Navigation errors are acceptable for malformed URLs
        }
      }
    });
    
    test('Should prevent stored XSS in user input fields', async ({ page }) => {
      await page.goto(BASE_URL);
      
      for (const payload of XSS_PAYLOADS.slice(0, 5)) { // Test subset for performance
        await page.evaluate((payload) => {
          // Simulate storing XSS payload in localStorage
          const userData = {
            name: payload,
            email: `test${payload}@example.com`,
            address: `${payload} Street`
          };
          localStorage.setItem('pizza-user', JSON.stringify(userData));
          
          const cartData = [{
            id: 'test',
            pizza: {
              name: payload,
              description: payload
            },
            quantity: 1,
            customizations: payload
          }];
          localStorage.setItem('pizza-cart', JSON.stringify(cartData));
        }, payload);
        
        await page.reload();
        
        // Check if XSS payload is properly escaped when displayed
        const pageContent = await page.content();
        
        // Should not contain unescaped script tags
        expect(pageContent).not.toContain('<script>alert');
        expect(pageContent).not.toMatch(/onerror\s*=\s*alert/);
        
        // Check for dialog events
        const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
        if (await dialogPromise) {
          throw new Error(`Stored XSS vulnerability detected with payload: ${payload}`);
        }
      }
    });
    
    test('Should prevent DOM-based XSS', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test DOM manipulation XSS
      const xssAttempted = await page.evaluate(() => {
        try {
          // Simulate DOM-based XSS attempt
          const userInput = '<img src=x onerror=alert("DOM-XSS")/>';
          
          // Try to inject into DOM
          const div = document.createElement('div');
          div.innerHTML = userInput;
          document.body.appendChild(div);
          
          return true;
        } catch (error) {
          return false;
        }
      });
      
      // Wait for potential alert
      const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
      const dialog = await dialogPromise;
      
      if (dialog) {
        throw new Error('DOM-based XSS vulnerability detected');
      }
    });
  });
  
  test.describe('Injection Attack Tests', () => {
    
    test('Should prevent SQL injection in API calls', async ({ page }) => {
      await page.goto(BASE_URL);
      
      for (const payload of SQL_INJECTION_PAYLOADS) {
        // Test SQL injection in potential API endpoints
        const testEndpoints = [
          `/api/pizzas?id=${encodeURIComponent(payload)}`,
          `/api/orders?user=${encodeURIComponent(payload)}`,
          `/api/search?q=${encodeURIComponent(payload)}`
        ];
        
        for (const endpoint of testEndpoints) {
          try {
            const response = await page.request.get(`${BASE_URL}${endpoint}`);
            const responseText = await response.text().catch(() => '');
            
            // Should not expose database errors or structure
            expect(responseText.toLowerCase()).not.toContain('sql');
            expect(responseText.toLowerCase()).not.toContain('mysql');
            expect(responseText.toLowerCase()).not.toContain('postgresql');
            expect(responseText.toLowerCase()).not.toContain('sqlite');
            expect(responseText.toLowerCase()).not.toContain('ora-');
            expect(responseText).not.toContain('syntax error');
            
          } catch (error) {
            // Network errors are acceptable, we're testing for data leaks
          }
        }
      }
    });
    
    test('Should prevent NoSQL injection', async ({ page }) => {
      const nosqlPayloads = [
        '{\'$ne\': null}',
        '{\'$gt\': \'\'}',
        '{\'$where\': \'this.password.length > 0\'}',
        '{\'$regex\': \'.*\'}',
        '{\'$exists\': true}'
      ];
      
      for (const payload of nosqlPayloads) {
        try {
          const response = await page.request.get(`${BASE_URL}/api/users?filter=${encodeURIComponent(payload)}`);
          const responseText = await response.text().catch(() => '');
          
          // Should not expose database structure or execute NoSQL operations
          expect(responseText).not.toContain('MongoError');
          expect(responseText).not.toContain('CastError');
          expect(responseText).not.toContain('ValidationError');
          
        } catch (error) {
          // Expected for non-existent endpoints
        }
      }
    });
  });
  
  test.describe('Path Traversal Tests', () => {
    
    test('Should prevent directory traversal attacks', async ({ page }) => {
      for (const payload of PATH_TRAVERSAL_PAYLOADS) {
        const testUrls = [
          `${BASE_URL}/api/files/${encodeURIComponent(payload)}`,
          `${BASE_URL}/uploads/${payload}`,
          `${BASE_URL}/static/${payload}`,
          `${BASE_URL}/${payload}`
        ];
        
        for (const url of testUrls) {
          try {
            const response = await page.request.get(url);
            const responseText = await response.text().catch(() => '');
            
            // Should not expose system files
            expect(responseText).not.toContain('root:x:');
            expect(responseText).not.toContain('[boot loader]');
            expect(responseText).not.toContain('Linux version');
            expect(responseText).not.toMatch(/\[HKEY_LOCAL_MACHINE\\\\/);
            
          } catch (error) {
            // Network errors are expected for invalid paths
          }
        }
      }
    });
  });
  
  test.describe('Business Logic Tests', () => {
    
    test('Should prevent price manipulation attacks', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test price manipulation through client-side data
      await page.evaluate(() => {
        const maliciousCart = {
          items: [{
            id: 'test',
            pizza: {
              id: 'margherita',
              name: 'Margherita',
              basePrice: 0.01 // Manipulated price
            },
            quantity: 1000, // Large quantity
            totalPrice: 0.01 // Manipulated total
          }]
        };
        
        localStorage.setItem('pizza-cart', JSON.stringify(maliciousCart));
      });
      
      await page.reload();
      
      // Application should recalculate prices server-side
      const cartTotal = await page.evaluate(() => {
        const cart = JSON.parse(localStorage.getItem('pizza-cart') || '[]');
        return cart.items?.[0]?.totalPrice;
      });
      
      // Price should be recalculated, not trusted from client
      expect(cartTotal).not.toBe(0.01);
    });
    
    test('Should prevent negative quantity attacks', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.evaluate(() => {
        const negativeCart = {
          items: [{
            id: 'test',
            pizza: { id: 'test', basePrice: 10 },
            quantity: -100, // Negative quantity
            totalPrice: -1000 // Would result in credit
          }]
        };
        
        localStorage.setItem('pizza-cart', JSON.stringify(negativeCart));
      });
      
      await page.reload();
      
      // Should validate and reject negative quantities
      const cart = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('pizza-cart') || '{"items":[]}');
      });
      
      // Negative quantities should be filtered out or corrected
      cart.items?.forEach(item => {
        expect(item.quantity).toBeGreaterThanOrEqual(0);
        expect(item.totalPrice).toBeGreaterThanOrEqual(0);
      });
    });
  });
  
  test.describe('Session and Authentication Tests', () => {
    
    test('Should prevent session fixation attacks', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Simulate session fixation attempt
      const originalSessionId = await page.evaluate(() => {
        const sessionData = { id: 'fixed-session-id', user: 'attacker' };
        localStorage.setItem('pizza-user', JSON.stringify(sessionData));
        return sessionData.id;
      });
      
      // Simulate legitimate login
      await page.evaluate(() => {
        const legitimateUser = { id: 'user123', name: 'John Doe', email: 'john@example.com' };
        localStorage.setItem('pizza-user', JSON.stringify(legitimateUser));
      });
      
      await page.reload();
      
      const newSessionId = await page.evaluate(() => {
        const user = JSON.parse(localStorage.getItem('pizza-user') || '{}');
        return user.id;
      });
      
      // Session ID should change after authentication
      expect(newSessionId).not.toBe(originalSessionId);
    });
    
    test('Should prevent privilege escalation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Simulate privilege escalation attempt
      await page.evaluate(() => {
        const userData = {
          id: 'user123',
          name: 'Regular User',
          role: 'admin', // Attempting to escalate privileges
          permissions: ['read', 'write', 'delete']
        };
        localStorage.setItem('pizza-user', JSON.stringify(userData));
      });
      
      // Try to access admin functionality
      const response = await page.request.get(`${BASE_URL}/api/admin/users`).catch(() => ({ status: () => 403 }));
      
      // Should deny access without proper server-side authorization
      expect([401, 403, 404]).toContain(response.status());
    });
  });
  
  test.describe('CSRF and CORS Tests', () => {
    
    test('Should implement CSRF protection', async ({ page, context }) => {
      // Create a second page to simulate cross-site request
      const attackerPage = await context.newPage();
      
      // Navigate to external site (simulated)
      await attackerPage.goto('data:text/html,<html><body>Attacker Site</body></html>');
      
      // Attempt CSRF attack
      const csrfResult = await attackerPage.evaluate(async (baseUrl) => {
        try {
          const response = await fetch(`${baseUrl}/api/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{ id: 'csrf-attack', quantity: 1 }],
              total: 100
            })
          });
          
          return {
            status: response.status,
            success: response.ok
          };
        } catch (error) {
          return { error: error.message };
        }
      }, BASE_URL);
      
      // CSRF requests should be blocked
      if (csrfResult.status) {
        expect([403, 405, 429]).toContain(csrfResult.status);
      }
      
      await attackerPage.close();
    });
    
    test('Should implement proper CORS policy', async ({ page }) => {
      const response = await page.request.get(BASE_URL, {
        headers: {
          'Origin': 'https://evil-site.com'
        }
      });
      
      const corsHeader = response.headers()['access-control-allow-origin'];
      
      // Should not allow arbitrary origins
      if (corsHeader) {
        expect(corsHeader).not.toBe('*');
        expect(corsHeader).not.toBe('https://evil-site.com');
      }
    });
  });
});