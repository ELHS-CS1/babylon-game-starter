import type { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import type { GDCReportManager } from './GDCReportManager.js';
import type { GDCReportCollector } from './GDCReportCollector.js';
// import type { GDCReportData } from './GDCReportCollector';

export class GDCReportAPI {
  private reportManager: GDCReportManager;
  private reportCollector: GDCReportCollector;

  constructor(reportManager: GDCReportManager, reportCollector: GDCReportCollector) {
    this.reportManager = reportManager;
    this.reportCollector = reportCollector;
  }

  public async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method;

    try {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Route handling
      if (pathname === '/api/reports' && method === 'GET') {
        await this.handleGetAllReports(req, res, url);
      } else if (pathname === '/api/reports' && method === 'POST') {
        await this.handleGenerateReport(req, res);
      } else if (pathname.startsWith('/api/reports/') && method === 'GET') {
        await this.handleGetReport(req, res, pathname);
      } else if (pathname.startsWith('/api/reports/') && method === 'DELETE') {
        await this.handleDeleteReport(req, res, pathname);
      } else if (pathname === '/api/reports/stats' && method === 'GET') {
        await this.handleGetStats(req, res);
      } else if (pathname === '/api/reports/export' && method === 'POST') {
        await this.handleExportReports(req, res);
      } else if (pathname === '/api/reports/cleanup' && method === 'POST') {
        await this.handleCleanupReports(req, res);
      } else {
        this.sendError(res, 404, 'Report endpoint not found');
      }
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Internal server error');
    }
  }

  private async handleGetAllReports(_req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    try {
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const formatParam = url.searchParams.get('format');
      const format = (() => {
        if (formatParam === 'pdf') return 'pdf' as const;
        if (formatParam === 'txt') return 'txt' as const;
        if (formatParam === 'csv') return 'csv' as const;
        if (formatParam === 'json') return 'json' as const;
        if (formatParam === 'md') return 'md' as const;
        return null;
      })();

      let reports;
      if (startDate !== null && endDate !== null) {
        reports = await this.reportManager.getReportsByDateRange(
          new Date(startDate),
          new Date(endDate)
        );
      } else {
        reports = await this.reportManager.getAllReports();
      }

      // Filter by format if specified
      if (format) {
        reports = reports.filter(report => report.format === format);
      }

      // Return summary information (not full report data)
      const reportSummaries = reports.map(report => ({
        id: report.id,
        reportId: report.reportId,
        generatedAt: report.generatedAt,
        format: report.format,
        size: report.size,
        systemHealth: report.reportData.systemHealth.overallHealth,
        peakUsers: report.reportData.performanceSummary.peakConcurrentUsers,
        errorRate: report.reportData.performanceSummary.errorRate
      }));

      this.sendJSON(res, 200, {
        reports: reportSummaries,
        total: reportSummaries.length
      });
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Failed to retrieve reports');
    }
  }

  private async handleGenerateReport(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.readRequestBody(req);
      const requestData: unknown = JSON.parse(body);
      if (requestData === null || requestData === undefined || typeof requestData !== 'object') {
        this.sendError(res, 400, 'Invalid request data');
        return;
      }
      const reportPeriodHours = typeof requestData['reportPeriodHours'] === 'number' ? requestData['reportPeriodHours'] : 24;
      const formats = Array.isArray(requestData['formats']) ? requestData['formats'] : ['pdf', 'txt', 'json'];

      // Generate report data
      const reportData = this.reportCollector.generateReportData(reportPeriodHours);

      // Generate and store reports
      const validFormats = Array.isArray(formats) ? formats.filter((format): format is 'pdf' | 'txt' | 'csv' | 'json' | 'md' => {
        return format === 'pdf' || format === 'txt' || format === 'csv' || format === 'json' || format === 'md';
      }) : ['pdf', 'txt', 'json'];
      const storedReports = await this.reportManager.generateAndStoreReport(reportData, validFormats);

      this.sendJSON(res, 201, {
        message: 'Report generated successfully',
        reportId: reportData.reportId,
        generatedReports: storedReports.map(report => ({
          id: report.id,
          format: report.format,
          size: report.size
        }))
      });
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Failed to generate report');
    }
  }

  private async handleGetReport(_req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
    try {
      const pathParts = pathname.split('/');
      const reportId = pathParts[3];
      const formatParam = pathParts[4];
      const format = (() => {
        if (formatParam === 'pdf') return 'pdf' as const;
        if (formatParam === 'txt') return 'txt' as const;
        if (formatParam === 'csv') return 'csv' as const;
        if (formatParam === 'json') return 'json' as const;
        if (formatParam === 'md') return 'md' as const;
        return 'txt' as const;
      })();

      if (reportId === '') {
        this.sendError(res, 400, 'Report ID is required');
        return;
      }

      // Return specific format
      const content = await this.reportManager.getReportContent(reportId, format);
      if (!content) {
        this.sendError(res, 404, 'Report not found');
        return;
      }

      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        txt: 'text/plain',
        csv: 'text/csv',
        json: 'application/json',
        md: 'text/markdown'
      };

      res.setHeader('Content-Type', mimeTypes[format] ?? 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${reportId}.${format}"`);
      res.writeHead(200);
      res.end(content);
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Failed to retrieve report');
    }
  }

  private async handleDeleteReport(_req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
    try {
      const pathParts = pathname.split('/');
      const reportId = pathParts[3];
      const formatParam = pathParts[4];
      const format = (() => {
        if (formatParam === 'pdf') return 'pdf' as const;
        if (formatParam === 'txt') return 'txt' as const;
        if (formatParam === 'csv') return 'csv' as const;
        if (formatParam === 'json') return 'json' as const;
        if (formatParam === 'md') return 'md' as const;
        return undefined;
      })();

      if (reportId === '') {
        this.sendError(res, 400, 'Report ID is required');
        return;
      }

      const deleted = await this.reportManager.deleteReport(reportId, format);
      if (!deleted) {
        this.sendError(res, 404, 'Report not found');
        return;
      }

      this.sendJSON(res, 200, {
        message: 'Report deleted successfully',
        reportId
      });
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Failed to delete report');
    }
  }

  private async handleGetStats(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const stats = await this.reportManager.getStorageStats();
      this.sendJSON(res, 200, stats);
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Failed to retrieve statistics');
    }
  }

  private async handleExportReports(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.readRequestBody(req);
      const requestData: unknown = JSON.parse(body);
      if (requestData === null || requestData === undefined || typeof requestData !== 'object') {
        this.sendError(res, 400, 'Invalid request data');
        return;
      }
      const reportIds: unknown = requestData['reportIds'];
      const exportPath: unknown = requestData['exportPath'];

      if (exportPath === null || exportPath === undefined || exportPath === '') {
        this.sendError(res, 400, 'Export path is required');
        return;
      }

      const validExportPath = typeof exportPath === 'string' ? exportPath : '';
      const validReportIds = Array.isArray(reportIds) ? reportIds.filter((id): id is string => typeof id === 'string') : undefined;
      await this.reportManager.exportReports(validExportPath, validReportIds);

      this.sendJSON(res, 200, {
        message: 'Reports exported successfully',
        exportPath: validExportPath,
        reportCount: Array.isArray(reportIds) ? reportIds.length : 'all'
      });
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Failed to export reports');
    }
  }

  private async handleCleanupReports(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      await this.reportManager.cleanupOldReports();
      const stats = await this.reportManager.getStorageStats();

      this.sendJSON(res, 200, {
        message: 'Reports cleaned up successfully',
        stats
      });
    } catch {
      // Error logging disabled per TEN_COMMANDMENTS
      this.sendError(res, 500, 'Failed to cleanup reports');
    }
  }

  private async readRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: unknown) => {
        body += String(chunk);
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  private sendJSON(res: ServerResponse, statusCode: number, data: unknown): void {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify(data, null, 2));
  }

  private sendError(res: ServerResponse, statusCode: number, message: string): void {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify({ error: message }, null, 2));
  }
}
