import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { GDCReportData } from './GDCReportCollector.js';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF; // eslint-disable-line no-unused-vars
  }
}

export class GDCPDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  public generateReport(reportData: GDCReportData): Buffer {
    this.doc = new jsPDF();
    
    // Set up document properties
    this.doc.setProperties({
      title: `GDC Report - ${reportData.reportId}`,
      subject: 'Game Development Conference Performance Report',
      author: 'Babylon.js Multiplayer Game System',
      creator: 'GDC Report Generator v1.0'
    });

    // Generate report sections
    this.addCoverPage(reportData);
    this.addExecutiveSummary(reportData);
    this.addSystemHealthSection(reportData);
    this.addPerformanceMetrics(reportData);
    this.addPeerAnalytics(reportData);
    this.addEnvironmentMetrics(reportData);
    this.addRecommendations(reportData);
    this.addTechnicalDetails(reportData);

    return Buffer.from(this.doc.output('arraybuffer'));
  }

  private addCoverPage(reportData: GDCReportData): void {
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GDC Performance Report', 105, 40, { align: 'center' });

    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Game Development Conference Analytics', 105, 55, { align: 'center' });

    // Report ID and Date
    this.doc.setFontSize(12);
    this.doc.text(`Report ID: ${reportData.reportId}`, 20, 80);
    this.doc.text(`Generated: ${format(new Date(reportData.generatedAt), 'PPP p')}`, 20, 90);
    this.doc.text(`Period: ${format(new Date(reportData.reportPeriod.start), 'PPP')} - ${format(new Date(reportData.reportPeriod.end), 'PPP')}`, 20, 100);

    // System Status Box
    const statusColor = this.getStatusColor(reportData.systemHealth.overallHealth);
    this.doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
    this.doc.rect(20, 120, 170, 20, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`System Status: ${reportData.systemHealth.overallHealth.toUpperCase()}`, 105, 133, { align: 'center' });

    // Reset text color
    this.doc.setTextColor(0, 0, 0);

    // Key Metrics Summary
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Metrics Summary', 20, 160);

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Peak Concurrent Users: ${reportData.performanceSummary.peakConcurrentUsers}`, 20, 175);
    this.doc.text(`Total Requests: ${reportData.performanceSummary.totalRequests.toLocaleString()}`, 20, 185);
    this.doc.text(`Error Rate: ${reportData.performanceSummary.errorRate.toFixed(2)}%`, 20, 195);
    this.doc.text(`Uptime: ${this.formatUptime(reportData.performanceSummary.uptime)}`, 20, 205);

    // Add new page
    this.doc.addPage();
  }

  private addExecutiveSummary(reportData: GDCReportData): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', 20, 30);

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    const summary = this.generateExecutiveSummary(reportData);
    const lines: unknown = this.doc.splitTextToSize(summary, 170);
    if (Array.isArray(lines)) {
      this.doc.text(lines, 20, 45);
    } else {
      this.doc.text(summary, 20, 45);
    }

    this.doc.addPage();
  }

  private addSystemHealthSection(reportData: GDCReportData): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('System Health Overview', 20, 30);

    // Health Status Table
    const healthData = [
      ['Component', 'Status', 'Details'],
      ['Server', reportData.systemHealth.serverStatus, this.getHealthDetails(reportData.systemHealth.serverStatus)],
      ['Database', reportData.systemHealth.databaseStatus, this.getHealthDetails(reportData.systemHealth.databaseStatus)],
      ['Network', reportData.systemHealth.networkStatus, this.getHealthDetails(reportData.systemHealth.networkStatus)],
      ['Overall', reportData.systemHealth.overallHealth, this.getHealthDetails(reportData.systemHealth.overallHealth)]
    ];

    this.doc.autoTable({
      head: [healthData[0]],
      body: healthData.slice(1),
      startY: 45,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    this.doc.addPage();
  }

  private addPerformanceMetrics(reportData: GDCReportData): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Performance Metrics', 20, 30);

    // Performance Summary Table
    const perfData = [
      ['Metric', 'Value', 'Status'],
      ['Average Response Time', `${reportData.performanceSummary.averageResponseTime.toFixed(2)}ms`, this.getPerformanceStatus(reportData.performanceSummary.averageResponseTime, 200)],
      ['Peak Concurrent Users', reportData.performanceSummary.peakConcurrentUsers.toString(), this.getPerformanceStatus(reportData.performanceSummary.peakConcurrentUsers, 100)],
      ['Total Requests', reportData.performanceSummary.totalRequests.toLocaleString(), 'N/A'],
      ['Error Rate', `${reportData.performanceSummary.errorRate.toFixed(2)}%`, this.getPerformanceStatus(reportData.performanceSummary.errorRate, 5, true)],
      ['Uptime', this.formatUptime(reportData.performanceSummary.uptime), 'N/A']
    ];

    this.doc.autoTable({
      head: [perfData[0]],
      body: perfData.slice(1),
      startY: 45,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Memory Usage Chart (simplified as table)
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Memory Usage', 20, 120);

    const mem = reportData.gameMetrics.memoryUsage;
    const memoryData = [
      ['Memory Type', 'Used (MB)', 'Total (MB)', 'Percentage'],
      ['Heap Used', mem ? (mem.heapUsed / 1024 / 1024).toFixed(2) : 'N/A', mem ? (mem.heapTotal / 1024 / 1024).toFixed(2) : 'N/A', mem ? `${((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)}%` : 'N/A'],
      ['External', mem ? (mem.external / 1024 / 1024).toFixed(2) : 'N/A', 'N/A', 'N/A'],
      ['RSS', mem ? (mem.rss / 1024 / 1024).toFixed(2) : 'N/A', 'N/A', 'N/A']
    ];

    this.doc.autoTable({
      head: [memoryData[0]],
      body: memoryData.slice(1),
      startY: 140,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    this.doc.addPage();
  }

  private addPeerAnalytics(reportData: GDCReportData): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Peer Analytics', 20, 30);

    if (reportData.peerMetrics.length === 0) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('No peer data available for this reporting period.', 20, 50);
    } else {
      // Peer Summary Table
      const peerData = reportData.peerMetrics.map(peer => [
        peer.id.substring(0, 8) + '...',
        peer.name,
        peer.environment,
        this.formatPlayTime(peer.totalPlayTime),
        peer.actionsPerformed.toString(),
        peer.errorsEncountered.toString()
      ]);

      this.doc.autoTable({
        head: [['Peer ID', 'Name', 'Environment', 'Play Time', 'Actions', 'Errors']],
        body: peerData,
        startY: 45,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
    }

    this.doc.addPage();
  }

  private addEnvironmentMetrics(reportData: GDCReportData): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Environment Metrics', 20, 30);

    if (reportData.environmentMetrics.length === 0) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('No environment data available for this reporting period.', 20, 50);
    } else {
      const envData = reportData.environmentMetrics.map(env => [
        env.name,
        env.activePeers.toString(),
        `${env.totalLoadTime.toFixed(0)}ms`,
        env.averageFrameRate.toFixed(1),
        `${env.memoryFootprint.toFixed(1)}MB`,
        `${env.errorRate.toFixed(2)}%`
      ]);

      this.doc.autoTable({
        head: [['Environment', 'Active Peers', 'Load Time', 'Avg FPS', 'Memory', 'Error Rate']],
        body: envData,
        startY: 45,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
    }

    this.doc.addPage();
  }

  private addRecommendations(reportData: GDCReportData): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Recommendations', 20, 30);

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    if (reportData.recommendations.length === 0) {
      this.doc.text('No specific recommendations at this time.', 20, 50);
    } else {
      reportData.recommendations.forEach((recommendation, index) => {
        const yPos = 45 + (index * 15);
        this.doc.text(`${index + 1}. ${recommendation}`, 20, yPos);
      });
    }

    this.doc.addPage();
  }

  private addTechnicalDetails(reportData: GDCReportData): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Technical Details', 20, 30);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const technicalData = [
      ['Detail', 'Value'],
      ['Report Generation Time', new Date().toISOString()],
      ['Server Uptime', this.formatUptime(reportData.gameMetrics.serverUptime)],
      ['CPU Usage', `${reportData.gameMetrics.cpuUsage.toFixed(2)}s`],
      ['Network Latency', `${reportData.gameMetrics.networkLatency.toFixed(2)}ms`],
      ['Frame Rate', `${reportData.gameMetrics.frameRate} FPS`],
      ['Error Count', reportData.gameMetrics.errorCount.toString()],
      ['Warning Count', reportData.gameMetrics.warningCount.toString()],
      ['Node.js Version', process.version],
      ['Platform', process.platform],
      ['Architecture', process.arch]
    ];

    this.doc.autoTable({
      head: [technicalData[0]],
      body: technicalData.slice(1),
      startY: 45,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  }

  private getStatusColor(status: string): { r: number; g: number; b: number } {
    switch (status.toLowerCase()) {
      case 'excellent':
      case 'healthy':
      case 'stable':
      case 'connected':
        return { r: 40, g: 167, b: 69 }; // Green
      case 'good':
      case 'degraded':
      case 'unstable':
        return { r: 255, g: 193, b: 7 }; // Yellow
      case 'fair':
      case 'critical':
      case 'down':
      case 'error':
      case 'disconnected':
        return { r: 220, g: 53, b: 69 }; // Red
      case 'poor':
        return { r: 108, g: 117, b: 125 }; // Gray
      default:
        return { r: 66, g: 139, b: 202 }; // Blue
    }
  }

  private generateExecutiveSummary(reportData: GDCReportData): string {
    const health = reportData.systemHealth.overallHealth;
    const peakUsers = reportData.performanceSummary.peakConcurrentUsers;
    const errorRate = reportData.performanceSummary.errorRate;
    const uptime = reportData.performanceSummary.uptime;

    let summary = `The Babylon.js Multiplayer Game system has been operating with ${health} overall health during the reporting period. `;
    
    if (peakUsers > 0) {
      summary += `The system successfully handled a peak of ${peakUsers} concurrent users. `;
    }
    
    summary += `The error rate was ${errorRate.toFixed(2)}%, and the system maintained ${this.formatUptime(uptime)} of uptime. `;
    
    if (errorRate > 5) {
      summary += `Attention is required to address the elevated error rate. `;
    } else if (errorRate > 2) {
      summary += `The error rate is within acceptable limits but should be monitored. `;
    } else {
      summary += `The system is performing within optimal parameters. `;
    }

    if (reportData.recommendations.length > 0) {
      summary += `Key recommendations include: ${reportData.recommendations.slice(0, 2).join(', ')}.`;
    }

    return summary;
  }

  private getHealthDetails(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'excellent':
      case 'stable':
      case 'connected':
        return 'Operating normally';
      case 'good':
      case 'degraded':
      case 'unstable':
        return 'Minor issues detected';
      case 'fair':
      case 'critical':
      case 'down':
      case 'error':
      case 'disconnected':
        return 'Requires immediate attention';
      case 'poor':
        return 'Significant issues present';
      default:
        return 'Status unknown';
    }
  }

  private getPerformanceStatus(value: number, threshold: number, reverse: boolean = false): string {
    if (reverse) {
      return value <= threshold ? 'Good' : 'Needs Attention';
    }
    return value <= threshold ? 'Good' : 'Needs Attention';
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private formatPlayTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
