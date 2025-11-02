import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

describe('Build Process', () => {
  const projectRoot = process.cwd();
  const distDir = join(projectRoot, 'dist');
  const clientDistDir = join(distDir, 'client');
  const serverDistDir = join(projectRoot, 'src', 'server', 'dist');

  beforeAll(() => {
    // Clean build directories before testing
    console.log('🧹 Cleaning build directories...');
    try {
      execSync('rm -rf dist src/server/dist', { stdio: 'inherit' });
      console.log('✅ Build directories cleaned');
    } catch (error) {
      console.warn('⚠️  Warning: Could not clean some directories:', error);
    }
  });

  afterAll(() => {
    // Clean up after testing
    console.log('🧹 Cleaning up test artifacts...');
    try {
      execSync('rm -rf dist src/server/dist', { stdio: 'inherit' });
      console.log('✅ Test cleanup completed');
    } catch (error) {
      console.warn('⚠️  Warning: Could not clean up:', error);
    }
  });

  describe('Build Command Execution', () => {
    it('should run build command successfully', () => {
      console.log('🔨 Running build command...');
      
      expect(() => {
        execSync('npm run build', { 
          stdio: 'inherit',
          cwd: projectRoot,
          timeout: 60000 // 60 second timeout
        });
      }).not.toThrow();
      
      console.log('✅ Build command completed successfully');
    });
  });

  describe('Client Build Artifacts', () => {
    it('should create client dist directory', () => {
      expect(existsSync(clientDistDir)).toBe(true);
      console.log('✅ Client dist directory exists');
    });

    it('should generate index.html', () => {
      const indexPath = join(clientDistDir, 'index.html');
      expect(existsSync(indexPath)).toBe(true);
      
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Babylon.js Multiplayer Game');
      expect(content).toContain('datastar.js'); // DataStar CDN script
      expect(content).toContain('/assets/index-');
      
      console.log('✅ index.html generated with correct content');
    });

    it('should generate CSS assets', () => {
      const assetsDir = join(clientDistDir, 'assets');
      expect(existsSync(assetsDir)).toBe(true);
      
      const files = require('fs').readdirSync(assetsDir);
      const cssFiles = files.filter((file: string) => file.endsWith('.css'));
      
      expect(cssFiles.length).toBeGreaterThan(0);
      console.log(`✅ Found ${cssFiles.length} CSS file(s)`);
      
      // Check that CSS files are not empty
      cssFiles.forEach((cssFile: string) => {
        const cssPath = join(assetsDir, cssFile);
        const stats = statSync(cssPath);
        expect(stats.size).toBeGreaterThan(0);
        console.log(`✅ CSS file ${cssFile} is not empty (${stats.size} bytes)`);
      });
    });

    it('should generate JavaScript assets', () => {
      const assetsDir = join(clientDistDir, 'assets');
      const files = require('fs').readdirSync(assetsDir);
      const jsFiles = files.filter((file: string) => file.endsWith('.js'));
      
      expect(jsFiles.length).toBeGreaterThan(0);
      console.log(`✅ Found ${jsFiles.length} JavaScript file(s)`);
      
      // Check that JS files are not empty and contain expected content
      jsFiles.forEach((jsFile: string) => {
        const jsPath = join(assetsDir, jsFile);
        const stats = statSync(jsPath);
        expect(stats.size).toBeGreaterThan(1000); // Should be substantial
        console.log(`✅ JS file ${jsFile} is substantial (${stats.size} bytes)`);
      });
    });

    it('should generate source maps', () => {
      const assetsDir = join(clientDistDir, 'assets');
      const files = require('fs').readdirSync(assetsDir);
      const mapFiles = files.filter((file: string) => file.endsWith('.map'));
      
      expect(mapFiles.length).toBeGreaterThan(0);
      console.log(`✅ Found ${mapFiles.length} source map file(s)`);
    });
  });

  describe('Server Build Artifacts', () => {
    it('should create server dist directory', () => {
      expect(existsSync(serverDistDir)).toBe(true);
      console.log('✅ Server dist directory exists');
    });

    it('should generate server JavaScript file', () => {
      const serverIndexPath = join(serverDistDir, 'index.js');
      expect(existsSync(serverIndexPath)).toBe(true);
      
      const stats = statSync(serverIndexPath);
      expect(stats.size).toBeGreaterThan(1000); // Should be substantial
      console.log(`✅ Server index.js generated (${stats.size} bytes)`);
    });

    it('should generate server source map', () => {
      const serverMapPath = join(serverDistDir, 'index.js.map');
      expect(existsSync(serverMapPath)).toBe(true);
      console.log('✅ Server source map generated');
    });

    it('should generate TypeScript declaration files', () => {
      const declarationPath = join(serverDistDir, 'index.d.ts');
      expect(existsSync(declarationPath)).toBe(true);
      
      const content = readFileSync(declarationPath, 'utf-8');
      expect(content).toContain('export');
      console.log('✅ TypeScript declaration file generated');
    });

    it('should generate TypeScript declaration map', () => {
      const declarationMapPath = join(serverDistDir, 'index.d.ts.map');
      expect(existsSync(declarationMapPath)).toBe(true);
      console.log('✅ TypeScript declaration map generated');
    });
  });

  describe('Build Output Validation', () => {
    it('should have correct directory structure for deployment', () => {
      // Check the structure that will be in the Docker container
      expect(existsSync(clientDistDir)).toBe(true);
      expect(existsSync(join(clientDistDir, 'index.html'))).toBe(true);
      expect(existsSync(join(clientDistDir, 'assets'))).toBe(true);
      
      console.log('✅ Deployment directory structure is correct');
    });

    it('should have server files in correct location for Docker', () => {
      // Server files should be in src/server/dist for Docker copying
      expect(existsSync(serverDistDir)).toBe(true);
      expect(existsSync(join(serverDistDir, 'index.js'))).toBe(true);
      
      console.log('✅ Server files in correct location for Docker');
    });

    it('should have assets directory preserved', () => {
      const assetsDir = join(projectRoot, 'assets');
      expect(existsSync(assetsDir)).toBe(true);
      
      // Check for key asset directories
      expect(existsSync(join(assetsDir, 'models'))).toBe(true);
      expect(existsSync(join(assetsDir, 'images'))).toBe(true);
      expect(existsSync(join(assetsDir, 'sounds'))).toBe(true);
      
      console.log('✅ Assets directory structure preserved');
    });
  });

  describe('Build Performance', () => {
    it('should complete build within reasonable time', () => {
      const startTime = Date.now();
      
      // Clean and rebuild to test timing
      execSync('rm -rf dist src/server/dist', { stdio: 'pipe' });
      execSync('npm run build', { 
        stdio: 'pipe',
        cwd: projectRoot,
        timeout: 120000 // 2 minute timeout
      });
      
      const endTime = Date.now();
      const buildTime = endTime - startTime;
      
      expect(buildTime).toBeLessThan(120000); // Should complete within 2 minutes
      console.log(`✅ Build completed in ${buildTime}ms`);
    });
  });

  describe('File Content Validation', () => {
    it('should have valid HTML structure', () => {
      const indexPath = join(clientDistDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      
      // Check for essential HTML elements
      expect(content).toMatch(/<!DOCTYPE html>/);
      expect(content).toMatch(/<html[^>]*>/);
      expect(content).toMatch(/<head>/);
      expect(content).toMatch(/<body>/);
      expect(content).toMatch(/<div id="app">/);
      
      console.log('✅ HTML structure is valid');
    });

    it('should include DataStar CDN script', () => {
      const indexPath = join(clientDistDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      
      expect(content).toContain('datastar.js');
      expect(content).toContain('cdn.jsdelivr.net');
      
      console.log('✅ DataStar CDN script included');
    });

    it('should have proper module script tags', () => {
      const indexPath = join(clientDistDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      
      expect(content).toMatch(/<script type="module"/);
      
      console.log('✅ Module script tags are correct');
    });
  });
});
