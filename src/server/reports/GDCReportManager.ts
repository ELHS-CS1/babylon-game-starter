import { promises as fs } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';
import type { GDCReportData } from './GDCReportCollector';
import { GDCPDFGenerator } from './GDCPDFGenerator.js';
import { GDCTextGenerator } from './GDCTextGenerator.js';

export interface StoredReport {
  id: string;
  reportId: string;
  generatedAt: string;
  format: 'pdf' | 'txt' | 'csv' | 'json' | 'md';
  filePath: string;
  size: number;
  reportData: GDCReportData;
}

export interface ReportStorageConfig {
  reportsDirectory: string;
  maxReports: number;
  maxAgeDays: number;
  compressionEnabled: boolean;
}

export class GDCReportManager {
  private config: ReportStorageConfig;
  private pdfGenerator: GDCPDFGenerator;
  private textGenerator: GDCTextGenerator;
  private reports: Map<string, StoredReport> = new Map();

  constructor(config?: Partial<ReportStorageConfig>) {
    this.config = {
      reportsDirectory: join(process.cwd(), 'GDC', 'reports'),
      maxReports: 100,
      maxAgeDays: 30,
      compressionEnabled: false,
      ...config
    };

    this.pdfGenerator = new GDCPDFGenerator();
    this.textGenerator = new GDCTextGenerator();

    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.config.reportsDirectory, { recursive: true });
      await this.loadExistingReports();
      // Initialization logging disabled per TEN_COMMANDMENTS
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
    }
  }

  private async loadExistingReports(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.reportsDirectory);
      const reportFiles = files.filter(file => file.endsWith('.json'));

      for (const file of reportFiles) {
        try {
          const filePath = join(this.config.reportsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const reportData: unknown = JSON.parse(content);
          if (reportData === null || reportData === undefined || typeof reportData !== 'object') {
            continue;
          }
          // Type guard for StoredReport
          if ('id' in reportData && 'filePath' in reportData && 'format' in reportData && 'generatedAt' in reportData) {
            const report: StoredReport = {
              reportId: typeof reportData.id === 'string' ? reportData.id : '',
              reportData: reportData as unknown as ReportData,
              id: typeof reportData.id === 'string' ? reportData.id : '',
              filePath: typeof reportData.filePath === 'string' ? reportData.filePath : '',
              format: (() => {
                if (typeof reportData.format === 'string') {
                  if (reportData.format === 'pdf') return 'pdf' as const;
                  if (reportData.format === 'txt') return 'txt' as const;
                  if (reportData.format === 'csv') return 'csv' as const;
                  if (reportData.format === 'json') return 'json' as const;
                  if (reportData.format === 'md') return 'md' as const;
                }
                return 'txt' as const;
              })(),
              generatedAt: reportData['generatedAt'] instanceof Date ? reportData['generatedAt'].toISOString() : new Date().toISOString(),
              size: typeof (reportData as Record<string, unknown>)['size'] === 'number' ? (reportData as Record<string, unknown>)['size'] as number : 0
            };
          
            // Verify file still exists
            try {
            await fs.access(report.filePath);
            this.reports.set(report.id, report);
          } catch {
            // File doesn't exist, remove the metadata
            await fs.unlink(filePath);
          }
          }
        } catch {
          // Warning logging disabled per TEN_COMMANDMENTS
        }
      }

      // Loading logging disabled per TEN_COMMANDMENTS
    } catch {
      // Warning logging disabled per TEN_COMMANDMENTS
    }
  }

  public async generateAndStoreReport(
    reportData: GDCReportData, 
    formats: ('pdf' | 'txt' | 'csv' | 'json' | 'md')[] = ['pdf', 'txt', 'json']
  ): Promise<StoredReport[]> {
    const storedReports: StoredReport[] = [];
    const timestamp = format(new Date(reportData.generatedAt), 'yyyyMMdd-HHmmss');

    for (const format of formats) {
      try {
        const report = await this.generateAndStoreSingleReport(reportData, format, timestamp);
        storedReports.push(report);
        this.reports.set(report.id, report);
      } catch {
        // Error logging disabled per TEN_COMMANDMENTS
      }
    }

    // Store metadata
    await this.storeReportMetadata(reportData);

    // Cleanup old reports
    await this.cleanupOldReports();

    // Success logging disabled per TEN_COMMANDMENTS
    return storedReports;
  }

  private async generateAndStoreSingleReport(
    reportData: GDCReportData, 
    format: 'pdf' | 'txt' | 'csv' | 'json' | 'md',
    timestamp: string
  ): Promise<StoredReport> {
    const fileName = `${reportData.reportId}-${timestamp}.${format}`;
    const filePath = join(this.config.reportsDirectory, fileName);
    
    let content: Buffer | string;
    let size: number;

    switch (format) {
      case 'pdf':
        content = this.pdfGenerator.generateReport(reportData);
        size = content.length;
        await fs.writeFile(filePath, content);
        break;
        
      case 'txt':
        content = this.textGenerator.generateReport(reportData);
        size = Buffer.byteLength(content, 'utf-8');
        await fs.writeFile(filePath, content, 'utf-8');
        break;
        
      case 'csv':
        content = this.textGenerator.generateCSVReport(reportData);
        size = Buffer.byteLength(content, 'utf-8');
        await fs.writeFile(filePath, content, 'utf-8');
        break;
        
      case 'json':
        content = this.textGenerator.generateJSONReport(reportData);
        size = Buffer.byteLength(content, 'utf-8');
        await fs.writeFile(filePath, content, 'utf-8');
        break;
        
      case 'md':
        content = this.textGenerator.generateMarkdownReport(reportData);
        size = Buffer.byteLength(content, 'utf-8');
        await fs.writeFile(filePath, content, 'utf-8');
        break;
        
      default:
        throw new Error(`Unsupported report format: ${String(format)}`);
    }

    const storedReport: StoredReport = {
      id: `${reportData.reportId}-${format}`,
      reportId: reportData.reportId,
      generatedAt: reportData.generatedAt,
      format,
      filePath,
      size,
      reportData
    };

    return storedReport;
  }

  private async storeReportMetadata(reportData: GDCReportData): Promise<void> {
    const metadataFile = join(this.config.reportsDirectory, `${reportData.reportId}-metadata.json`);
    const metadata = {
      reportId: reportData.reportId,
      generatedAt: reportData.generatedAt,
      reportPeriod: reportData.reportPeriod,
      systemHealth: reportData.systemHealth,
      performanceSummary: reportData.performanceSummary,
      peerCount: reportData.peerMetrics.length,
      environmentCount: reportData.environmentMetrics.length,
      recommendationCount: reportData.recommendations.length
    };

    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  public async getReport(reportId: string, format?: 'pdf' | 'txt' | 'csv' | 'json' | 'md'): Promise<StoredReport | null> {
    if (format) {
      const id = `${reportId}-${format}`;
      return this.reports.get(id) ?? null;
    }

      // Return the first available format
      for (const [, report] of this.reports.entries()) {
        if (report.reportId === reportId) {
          return report;
        }
      }

    return null;
  }

  public async getAllReports(): Promise<StoredReport[]> {
    return Array.from(this.reports.values()).sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  public async getReportsByDateRange(startDate: Date, endDate: Date): Promise<StoredReport[]> {
    return Array.from(this.reports.values())
      .filter(report => {
        const reportDate = new Date(report.generatedAt);
        return reportDate >= startDate && reportDate <= endDate;
      })
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  public async deleteReport(reportId: string, format?: 'pdf' | 'txt' | 'csv' | 'json' | 'md'): Promise<boolean> {
    const report = await this.getReport(reportId, format);
    if (!report) {
      return false;
    }

    try {
      // Delete the report file
      await fs.unlink(report.filePath);
      
      // Remove from memory
      this.reports.delete(report.id);
      
      // Delete metadata if this was the last format
      const remainingReports = Array.from(this.reports.values())
        .filter(r => r.reportId === reportId);
      
      if (remainingReports.length === 0) {
        const metadataFile = join(this.config.reportsDirectory, `${reportId}-metadata.json`);
        try {
          await fs.unlink(metadataFile);
        } catch {
          // Metadata file might not exist
        }
      }

      // Deletion logging disabled per TEN_COMMANDMENTS
      return true;
    } catch (_error) { // eslint-disable-line no-unused-vars
      // Error logging disabled per TEN_COMMANDMENTS
      return false;
    }
  }

  public async cleanupOldReports(): Promise<void> {
    const cutoffDate = new Date(Date.now() - (this.config.maxAgeDays * 24 * 60 * 60 * 1000));
    const reportsToDelete: StoredReport[] = [];

    // Find old reports
    for (const report of this.reports.values()) {
      if (new Date(report.generatedAt) < cutoffDate) {
        reportsToDelete.push(report);
      }
    }

    // Delete old reports
    for (const report of reportsToDelete) {
      await this.deleteReport(report.reportId, report.format);
    }

    // Limit total number of reports
    const allReports = await this.getAllReports();
    if (allReports.length > this.config.maxReports) {
      const reportsToRemove = allReports.slice(this.config.maxReports);
      for (const report of reportsToRemove) {
        await this.deleteReport(report.reportId, report.format);
      }
    }

    // Cleanup logging disabled per TEN_COMMANDMENTS
  }

  public async getStorageStats(): Promise<{
    totalReports: number;
    totalSize: number;
    reportsByFormat: Record<string, number>;
    oldestReport: string | null;
    newestReport: string | null;
  }> {
    const allReports = await this.getAllReports();
    const totalSize = allReports.reduce((sum, report) => sum + report.size, 0);
    
    const reportsByFormat: Record<string, number> = {};
    for (const report of allReports) {
      reportsByFormat[report.format] = (reportsByFormat[report.format] ?? 0) + 1;
    }

    return {
      totalReports: allReports.length,
      totalSize,
      reportsByFormat,
      oldestReport: allReports.length > 0 ? (allReports[allReports.length - 1]?.generatedAt ?? null) : null,
      newestReport: allReports.length > 0 ? (allReports[0]?.generatedAt ?? null) : null
    };
  }

  public async exportReports(exportPath: string, reportIds?: string[]): Promise<void> {
    const reportsToExport = reportIds !== undefined
      ? Array.from(this.reports.values()).filter(r => reportIds.includes(r.reportId))
      : Array.from(this.reports.values());

    await fs.mkdir(exportPath, { recursive: true });

    for (const report of reportsToExport) {
      const fileName = `${report.reportId}-${report.format}.${report.format}`;
      const exportFilePath = join(exportPath, fileName);
      
      try {
        await fs.copyFile(report.filePath, exportFilePath);
      } catch {
        // Error logging disabled per TEN_COMMANDMENTS
      }
    }

    // Export logging disabled per TEN_COMMANDMENTS
  }

  public async getReportContent(reportId: string, format: 'pdf' | 'txt' | 'csv' | 'json' | 'md'): Promise<Buffer | null> {
    const report = await this.getReport(reportId, format);
    if (!report) {
      return null;
    }

    try {
      return await fs.readFile(report.filePath);
    } catch (_error) { // eslint-disable-line no-unused-vars
      // Error logging disabled per TEN_COMMANDMENTS
      return null;
    }
  }
}
