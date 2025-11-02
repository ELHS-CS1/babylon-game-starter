import { format } from 'date-fns';
import type { GDCReportData } from './GDCReportCollector.js';

export class GDCTextGenerator {
  public generateReport(reportData: GDCReportData): string {
    const lines: string[] = [];
    
    // Header
    lines.push('='.repeat(80));
    lines.push('GDC PERFORMANCE REPORT');
    lines.push('Game Development Conference Analytics');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Report Information
    lines.push('REPORT INFORMATION');
    lines.push('-'.repeat(20));
    lines.push(`Report ID: ${reportData.reportId}`);
    lines.push(`Generated: ${format(new Date(reportData.generatedAt), 'PPP p')}`);
    lines.push(`Period: ${format(new Date(reportData.reportPeriod.start), 'PPP')} - ${format(new Date(reportData.reportPeriod.end), 'PPP')}`);
    lines.push('');
    
    // Executive Summary
    lines.push('EXECUTIVE SUMMARY');
    lines.push('-'.repeat(20));
    lines.push(this.generateExecutiveSummary(reportData));
    lines.push('');
    
    // System Health
    lines.push('SYSTEM HEALTH OVERVIEW');
    lines.push('-'.repeat(25));
    lines.push(`Server Status: ${reportData.systemHealth.serverStatus.toUpperCase()}`);
    lines.push(`Database Status: ${reportData.systemHealth.databaseStatus.toUpperCase()}`);
    lines.push(`Network Status: ${reportData.systemHealth.networkStatus.toUpperCase()}`);
    lines.push(`Overall Health: ${reportData.systemHealth.overallHealth.toUpperCase()}`);
    lines.push('');
    
    // Performance Metrics
    lines.push('PERFORMANCE METRICS');
    lines.push('-'.repeat(20));
    lines.push(`Average Response Time: ${reportData.performanceSummary.averageResponseTime.toFixed(2)}ms`);
    lines.push(`Peak Concurrent Users: ${reportData.performanceSummary.peakConcurrentUsers}`);
    lines.push(`Total Requests: ${reportData.performanceSummary.totalRequests.toLocaleString()}`);
    lines.push(`Error Rate: ${reportData.performanceSummary.errorRate.toFixed(2)}%`);
    lines.push(`Uptime: ${this.formatUptime(reportData.performanceSummary.uptime)}`);
    lines.push('');
    
    // Memory Usage
    lines.push('MEMORY USAGE');
    lines.push('-'.repeat(15));
    const mem = reportData.gameMetrics.memoryUsage;
    if (mem) {
      lines.push(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`Heap Usage: ${((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)}%`);
      lines.push(`External: ${(mem.external / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    } else {
      lines.push('Memory usage data not available');
    }
    lines.push('');
    
    // Peer Analytics
    lines.push('PEER ANALYTICS');
    lines.push('-'.repeat(15));
    if (reportData.peerMetrics.length === 0) {
      lines.push('No peer data available for this reporting period.');
    } else {
      lines.push(`Total Active Peers: ${reportData.peerMetrics.length}`);
      lines.push('');
      lines.push('Peer Details:');
      lines.push('ID'.padEnd(12) + 'Name'.padEnd(20) + 'Environment'.padEnd(15) + 'Play Time'.padEnd(12) + 'Actions'.padEnd(8) + 'Errors');
      lines.push('-'.repeat(80));
      
      reportData.peerMetrics.forEach(peer => {
        const peerId = peer.id.substring(0, 8) + '...';
        const playTime = this.formatPlayTime(peer.totalPlayTime);
        lines.push(
          peerId.padEnd(12) + 
          peer.name.padEnd(20) + 
          peer.environment.padEnd(15) + 
          playTime.padEnd(12) + 
          peer.actionsPerformed.toString().padEnd(8) + 
          peer.errorsEncountered.toString()
        );
      });
    }
    lines.push('');
    
    // Environment Metrics
    lines.push('ENVIRONMENT METRICS');
    lines.push('-'.repeat(20));
    if (reportData.environmentMetrics.length === 0) {
      lines.push('No environment data available for this reporting period.');
    } else {
      lines.push('Environment'.padEnd(15) + 'Active Peers'.padEnd(12) + 'Load Time'.padEnd(10) + 'Avg FPS'.padEnd(8) + 'Memory'.padEnd(8) + 'Error Rate');
      lines.push('-'.repeat(70));
      
      reportData.environmentMetrics.forEach(env => {
        lines.push(
          env.name.padEnd(15) + 
          env.activePeers.toString().padEnd(12) + 
          `${env.totalLoadTime.toFixed(0)}ms`.padEnd(10) + 
          env.averageFrameRate.toFixed(1).padEnd(8) + 
          `${env.memoryFootprint.toFixed(1)}MB`.padEnd(8) + 
          `${env.errorRate.toFixed(2)}%`
        );
      });
    }
    lines.push('');
    
    // Recommendations
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(15));
    if (reportData.recommendations.length === 0) {
      lines.push('No specific recommendations at this time.');
    } else {
      reportData.recommendations.forEach((recommendation, index) => {
        lines.push(`${index + 1}. ${recommendation}`);
      });
    }
    lines.push('');
    
    // Technical Details
    lines.push('TECHNICAL DETAILS');
    lines.push('-'.repeat(17));
    lines.push(`Report Generation Time: ${new Date().toISOString()}`);
    lines.push(`Server Uptime: ${this.formatUptime(reportData.gameMetrics.serverUptime)}`);
    lines.push(`CPU Usage: ${reportData.gameMetrics.cpuUsage.toFixed(2)}s`);
    lines.push(`Network Latency: ${reportData.gameMetrics.networkLatency.toFixed(2)}ms`);
    lines.push(`Frame Rate: ${reportData.gameMetrics.frameRate} FPS`);
    lines.push(`Error Count: ${reportData.gameMetrics.errorCount}`);
    lines.push(`Warning Count: ${reportData.gameMetrics.warningCount}`);
    lines.push(`Node.js Version: ${process.version}`);
    lines.push(`Platform: ${process.platform}`);
    lines.push(`Architecture: ${process.arch}`);
    lines.push('');
    
    // Footer
    lines.push('='.repeat(80));
    lines.push('End of Report');
    lines.push('Generated by GDC Report Generator v1.0');
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }

  public generateCSVReport(reportData: GDCReportData): string {
    const lines: string[] = [];
    
    // CSV Header
    lines.push('Report ID,Generated At,Period Start,Period End,Overall Health,Peak Users,Total Requests,Error Rate,Uptime,Server Status,Database Status,Network Status');
    
    // Main data row
    const mainRow = [
      reportData.reportId,
      reportData.generatedAt,
      reportData.reportPeriod.start,
      reportData.reportPeriod.end,
      reportData.systemHealth.overallHealth,
      reportData.performanceSummary.peakConcurrentUsers,
      reportData.performanceSummary.totalRequests,
      reportData.performanceSummary.errorRate.toFixed(2),
      this.formatUptime(reportData.performanceSummary.uptime),
      reportData.systemHealth.serverStatus,
      reportData.systemHealth.databaseStatus,
      reportData.systemHealth.networkStatus
    ];
    lines.push(mainRow.join(','));
    
    // Peer data section
    if (reportData.peerMetrics.length > 0) {
      lines.push(''); // Empty line separator
      lines.push('Peer ID,Name,Environment,Play Time,Actions,Errors,Last Update');
      reportData.peerMetrics.forEach(peer => {
        const peerRow = [
          peer.id,
          peer.name,
          peer.environment,
          this.formatPlayTime(peer.totalPlayTime),
          peer.actionsPerformed,
          peer.errorsEncountered,
          peer.lastUpdate
        ];
        lines.push(peerRow.join(','));
      });
    }
    
    // Environment data section
    if (reportData.environmentMetrics.length > 0) {
      lines.push(''); // Empty line separator
      lines.push('Environment,Active Peers,Load Time,Avg FPS,Memory,Error Rate,Last Accessed');
      reportData.environmentMetrics.forEach(env => {
        const envRow = [
          env.name,
          env.activePeers,
          env.totalLoadTime.toFixed(0),
          env.averageFrameRate.toFixed(1),
          env.memoryFootprint.toFixed(1),
          env.errorRate.toFixed(2),
          env.lastAccessed
        ];
        lines.push(envRow.join(','));
      });
    }
    
    return lines.join('\n');
  }

  public generateJSONReport(reportData: GDCReportData): string {
    return JSON.stringify(reportData, null, 2);
  }

  public generateMarkdownReport(reportData: GDCReportData): string {
    const lines: string[] = [];
    
    // Markdown Header
    lines.push('# GDC Performance Report');
    lines.push('');
    lines.push(`**Report ID:** ${reportData.reportId}`);
    lines.push(`**Generated:** ${format(new Date(reportData.generatedAt), 'PPP p')}`);
    lines.push(`**Period:** ${format(new Date(reportData.reportPeriod.start), 'PPP')} - ${format(new Date(reportData.reportPeriod.end), 'PPP')}`);
    lines.push('');
    
    // Executive Summary
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(this.generateExecutiveSummary(reportData));
    lines.push('');
    
    // System Health
    lines.push('## System Health Overview');
    lines.push('');
    lines.push('| Component | Status |');
    lines.push('|-----------|--------|');
    lines.push(`| Server | ${reportData.systemHealth.serverStatus} |`);
    lines.push(`| Database | ${reportData.systemHealth.databaseStatus} |`);
    lines.push(`| Network | ${reportData.systemHealth.networkStatus} |`);
    lines.push(`| Overall | **${reportData.systemHealth.overallHealth}** |`);
    lines.push('');
    
    // Performance Metrics
    lines.push('## Performance Metrics');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Average Response Time | ${reportData.performanceSummary.averageResponseTime.toFixed(2)}ms |`);
    lines.push(`| Peak Concurrent Users | ${reportData.performanceSummary.peakConcurrentUsers} |`);
    lines.push(`| Total Requests | ${reportData.performanceSummary.totalRequests.toLocaleString()} |`);
    lines.push(`| Error Rate | ${reportData.performanceSummary.errorRate.toFixed(2)}% |`);
    lines.push(`| Uptime | ${this.formatUptime(reportData.performanceSummary.uptime)} |`);
    lines.push('');
    
    // Memory Usage
    lines.push('## Memory Usage');
    lines.push('');
    const mem = reportData.gameMetrics.memoryUsage;
    lines.push('| Type | Value |');
    lines.push('|------|-------|');
    if (mem) {
      lines.push(`| Heap Used | ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB |`);
      lines.push(`| Heap Total | ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB |`);
      lines.push(`| Heap Usage | ${((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)}% |`);
      lines.push(`| External | ${(mem.external / 1024 / 1024).toFixed(2)} MB |`);
      lines.push(`| RSS | ${(mem.rss / 1024 / 1024).toFixed(2)} MB |`);
    } else {
      lines.push('| Memory Usage | Data not available |');
    }
    lines.push('');
    
    // Peer Analytics
    lines.push('## Peer Analytics');
    lines.push('');
    if (reportData.peerMetrics.length === 0) {
      lines.push('No peer data available for this reporting period.');
    } else {
      lines.push('| ID | Name | Environment | Play Time | Actions | Errors |');
      lines.push('|----|------|-------------|-----------|---------|--------|');
      reportData.peerMetrics.forEach(peer => {
        const peerId = peer.id.substring(0, 8) + '...';
        lines.push(`| ${peerId} | ${peer.name} | ${peer.environment} | ${this.formatPlayTime(peer.totalPlayTime)} | ${peer.actionsPerformed} | ${peer.errorsEncountered} |`);
      });
    }
    lines.push('');
    
    // Environment Metrics
    lines.push('## Environment Metrics');
    lines.push('');
    if (reportData.environmentMetrics.length === 0) {
      lines.push('No environment data available for this reporting period.');
    } else {
      lines.push('| Environment | Active Peers | Load Time | Avg FPS | Memory | Error Rate |');
      lines.push('|-------------|--------------|-----------|---------|--------|------------|');
      reportData.environmentMetrics.forEach(env => {
        lines.push(`| ${env.name} | ${env.activePeers} | ${env.totalLoadTime.toFixed(0)}ms | ${env.averageFrameRate.toFixed(1)} | ${env.memoryFootprint.toFixed(1)}MB | ${env.errorRate.toFixed(2)}% |`);
      });
    }
    lines.push('');
    
    // Recommendations
    lines.push('## Recommendations');
    lines.push('');
    if (reportData.recommendations.length === 0) {
      lines.push('No specific recommendations at this time.');
    } else {
      reportData.recommendations.forEach((recommendation, index) => {
        lines.push(`${index + 1}. ${recommendation}`);
      });
    }
    lines.push('');
    
    // Technical Details
    lines.push('## Technical Details');
    lines.push('');
    lines.push('| Detail | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Report Generation Time | ${new Date().toISOString()} |`);
    lines.push(`| Server Uptime | ${this.formatUptime(reportData.gameMetrics.serverUptime)} |`);
    lines.push(`| CPU Usage | ${reportData.gameMetrics.cpuUsage.toFixed(2)}s |`);
    lines.push(`| Network Latency | ${reportData.gameMetrics.networkLatency.toFixed(2)}ms |`);
    lines.push(`| Frame Rate | ${reportData.gameMetrics.frameRate} FPS |`);
    lines.push(`| Error Count | ${reportData.gameMetrics.errorCount} |`);
    lines.push(`| Warning Count | ${reportData.gameMetrics.warningCount} |`);
    lines.push(`| Node.js Version | ${process.version} |`);
    lines.push(`| Platform | ${process.platform} |`);
    lines.push(`| Architecture | ${process.arch} |`);
    lines.push('');
    
    // Footer
    lines.push('---');
    lines.push('*Generated by GDC Report Generator v1.0*');
    
    return lines.join('\n');
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
