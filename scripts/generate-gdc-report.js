#!/usr/bin/env node

/**
 * GDC Report Generation Script
 * Generates comprehensive Game Development Conference reports
 * Similar to DoD reports in sigma-sockets project
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:10000';
const REPORTS_DIR = join(process.cwd(), 'reports');

class GDCReportGenerator {
  constructor() {
    this.ensureReportsDirectory();
  }

  async ensureReportsDirectory() {
    try {
      await fs.mkdir(REPORTS_DIR, { recursive: true });
      console.log(`📁 Reports directory: ${REPORTS_DIR}`);
    } catch (error) {
      console.error('❌ Failed to create reports directory:', error);
      process.exit(1);
    }
  }

  async generateReport(options = {}) {
    const {
      reportPeriodHours = 24,
      formats = ['pdf', 'txt', 'json', 'md'],
      outputDir = REPORTS_DIR
    } = options;

    console.log('📊 Generating GDC Report...');
    console.log(`   Period: ${reportPeriodHours} hours`);
    console.log(`   Formats: ${formats.join(', ')}`);
    console.log(`   Output: ${outputDir}`);

    try {
      // Generate report via API
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportPeriodHours,
          formats
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Report generated successfully: ${result.reportId}`);

      // Download generated reports
      for (const report of result.generatedReports) {
        await this.downloadReport(result.reportId, report.format, outputDir);
      }

      console.log(`📋 Report summary:`);
      console.log(`   Report ID: ${result.reportId}`);
      console.log(`   Generated: ${result.generatedReports.length} files`);
      console.log(`   Location: ${outputDir}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      throw error;
    }
  }

  async downloadReport(reportId, format, outputDir) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/${format}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download ${format} report: ${response.status}`);
      }

      const content = await response.arrayBuffer();
      const fileName = `${reportId}.${format}`;
      const filePath = join(outputDir, fileName);

      await fs.writeFile(filePath, Buffer.from(content));
      console.log(`   📄 Downloaded: ${fileName}`);

      return filePath;
    } catch (error) {
      console.error(`❌ Failed to download ${format} report:`, error);
      throw error;
    }
  }

  async listReports() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📋 Available Reports:');
      console.log(`   Total: ${data.total} reports`);
      
      if (data.reports.length === 0) {
        console.log('   No reports found');
        return;
      }

      data.reports.forEach((report, index) => {
        console.log(`   ${index + 1}. ${report.reportId}`);
        console.log(`      Format: ${report.format}`);
        console.log(`      Generated: ${new Date(report.generatedAt).toLocaleString()}`);
        console.log(`      Size: ${this.formatFileSize(report.size)}`);
        console.log(`      Health: ${report.systemHealth}`);
        console.log(`      Peak Users: ${report.peakUsers}`);
        console.log(`      Error Rate: ${report.errorRate.toFixed(2)}%`);
        console.log('');
      });

      return data.reports;
    } catch (error) {
      console.error('❌ Failed to list reports:', error);
      throw error;
    }
  }

  async getReportStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/stats`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const stats = await response.json();
      
      console.log('📊 Report Statistics:');
      console.log(`   Total Reports: ${stats.totalReports}`);
      console.log(`   Total Size: ${this.formatFileSize(stats.totalSize)}`);
      console.log(`   Reports by Format:`);
      
      Object.entries(stats.reportsByFormat).forEach(([format, count]) => {
        console.log(`     ${format}: ${count}`);
      });
      
      if (stats.oldestReport) {
        console.log(`   Oldest Report: ${new Date(stats.oldestReport).toLocaleString()}`);
      }
      
      if (stats.newestReport) {
        console.log(`   Newest Report: ${new Date(stats.newestReport).toLocaleString()}`);
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get report stats:', error);
      throw error;
    }
  }

  async cleanupReports() {
    try {
      console.log('🧹 Cleaning up old reports...');
      
      const response = await fetch(`${API_BASE_URL}/api/reports/cleanup`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Cleanup completed');
      console.log(`   Stats: ${JSON.stringify(result.stats, null, 2)}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to cleanup reports:', error);
      throw error;
    }
  }

  async exportReports(reportIds, exportPath) {
    try {
      console.log(`📦 Exporting reports to: ${exportPath}`);
      
      const response = await fetch(`${API_BASE_URL}/api/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportIds,
          exportPath
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Export completed');
      console.log(`   Exported: ${result.reportCount} reports`);
      console.log(`   Location: ${result.exportPath}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to export reports:', error);
      throw error;
    }
  }

  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async checkServerHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`Server health check failed: ${response.status}`);
      }

      const health = await response.json();
      console.log('🏥 Server Health:');
      console.log(`   Status: ${health.status}`);
      console.log(`   Peers: ${health.peers}`);
      console.log(`   Environment: ${health.environment}`);
      console.log(`   Production: ${health.config.isProduction}`);
      console.log(`   Docker: ${health.config.isDocker}`);

      return health;
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const generator = new GDCReportGenerator();

  try {
    switch (command) {
      case 'generate':
      case 'gen':
        const hours = parseInt(args[1]) || 24;
        const formats = args[2] ? args[2].split(',') : ['pdf', 'txt', 'json', 'md'];
        await generator.generateReport({ reportPeriodHours: hours, formats });
        break;

      case 'list':
      case 'ls':
        await generator.listReports();
        break;

      case 'stats':
        await generator.getReportStats();
        break;

      case 'cleanup':
        await generator.cleanupReports();
        break;

      case 'export':
        const reportIds = args[1] ? args[1].split(',') : undefined;
        const exportPath = args[2] || join(process.cwd(), 'exports');
        await generator.exportReports(reportIds, exportPath);
        break;

      case 'health':
        await generator.checkServerHealth();
        break;

      case 'help':
      case '--help':
      case '-h':
        console.log(`
📊 GDC Report Generator

Usage: node scripts/generate-gdc-report.js <command> [options]

Commands:
  generate [hours] [formats]  Generate a new report (default: 24 hours, pdf,txt,json,md)
  list                       List all available reports
  stats                      Show report statistics
  cleanup                    Clean up old reports
  export [ids] [path]        Export reports to directory
  health                     Check server health
  help                       Show this help message

Examples:
  node scripts/generate-gdc-report.js generate
  node scripts/generate-gdc-report.js generate 48 pdf,txt
  node scripts/generate-gdc-report.js list
  node scripts/generate-gdc-report.js stats
  node scripts/generate-gdc-report.js cleanup
  node scripts/generate-gdc-report.js export GDC-20241221-120000 /tmp/exports
  node scripts/generate-gdc-report.js health

Environment Variables:
  API_BASE_URL               Server API URL (default: http://localhost:10000)
        `);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use "help" to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default GDCReportGenerator;
