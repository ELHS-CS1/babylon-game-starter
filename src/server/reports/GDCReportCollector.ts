import { format } from 'date-fns';

export interface GameMetrics {
  timestamp: string;
  activePeers: number;
  totalPeers: number;
  environment: string;
  serverUptime: number;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: number;
  networkLatency: number;
  frameRate: number;
  errorCount: number;
  warningCount: number;
}

export interface PeerMetrics {
  id: string;
  name: string;
  environment: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  lastUpdate: string;
  connectionTime: number;
  totalPlayTime: number;
  actionsPerformed: number;
  errorsEncountered: number;
}

export interface EnvironmentMetrics {
  name: string;
  activePeers: number;
  totalLoadTime: number;
  averageFrameRate: number;
  memoryFootprint: number;
  errorRate: number;
  lastAccessed: string;
}

export interface GDCReportData {
  reportId: string;
  generatedAt: string;
  reportPeriod: {
    start: string;
    end: string;
  };
  gameMetrics: GameMetrics;
  peerMetrics: PeerMetrics[];
  environmentMetrics: EnvironmentMetrics[];
  systemHealth: {
    serverStatus: 'healthy' | 'degraded' | 'critical';
    databaseStatus: 'connected' | 'disconnected' | 'error';
    networkStatus: 'stable' | 'unstable' | 'down';
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  performanceSummary: {
    averageResponseTime: number;
    peakConcurrentUsers: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
  };
  recommendations: string[];
}

export class GDCReportCollector {
  private metrics: GameMetrics[] = [];
  private peerMetrics: Map<string, PeerMetrics> = new Map();
  private environmentMetrics: Map<string, EnvironmentMetrics> = new Map();
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private warningCount: number = 0;

  constructor() {
    // Initialization logging disabled per TEN_COMMANDMENTS
  }

  public collectGameMetrics(activePeers: number, totalPeers: number, environment: string): void {
    const metrics: GameMetrics = {
      timestamp: new Date().toISOString(),
      activePeers,
      totalPeers,
      environment,
      serverUptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      networkLatency: Math.random() * 100, // Placeholder - would be real measurement
      frameRate: 60, // Placeholder - would be real measurement
      errorCount: this.errorCount,
      warningCount: this.warningCount
    };

    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  public collectPeerMetrics(peerId: string, peerData: Record<string, unknown>): void {
    const existingMetrics = this.peerMetrics.get(peerId);
    const now = Date.now();
    
    const metrics: PeerMetrics = {
      id: peerId,
      name: typeof peerData['name'] === 'string' ? peerData['name'] : `Player_${peerId}`,
      environment: typeof peerData['environment'] === 'string' ? peerData['environment'] : 'levelTest',
      position: (() => {
        if (typeof peerData['position'] === 'object' && peerData['position'] !== null && 'x' in peerData['position'] && 'y' in peerData['position'] && 'z' in peerData['position']) {
          const pos = peerData['position'];
          if (typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
            return { x: pos.x, y: pos.y, z: pos.z };
          }
        }
        return { x: 0, y: 0, z: 0 };
      })(),
      rotation: (() => {
        if (typeof peerData['rotation'] === 'object' && peerData['rotation'] !== null && 'x' in peerData['rotation'] && 'y' in peerData['rotation'] && 'z' in peerData['rotation']) {
          const rot = peerData['rotation'];
          if (typeof rot.x === 'number' && typeof rot.y === 'number' && typeof rot.z === 'number') {
            return { x: rot.x, y: rot.y, z: rot.z };
          }
        }
        return { x: 0, y: 0, z: 0 };
      })(),
      lastUpdate: new Date().toISOString(),
      connectionTime: existingMetrics !== undefined ? existingMetrics.connectionTime : now,
      totalPlayTime: existingMetrics !== undefined ? existingMetrics.totalPlayTime + (now - existingMetrics.connectionTime) : 0,
      actionsPerformed: existingMetrics ? existingMetrics.actionsPerformed + 1 : 1,
      errorsEncountered: existingMetrics ? existingMetrics.errorsEncountered : 0
    };

    this.peerMetrics.set(peerId, metrics);
  }

  public collectEnvironmentMetrics(environmentName: string, activePeers: number): void {
    const existingMetrics = this.environmentMetrics.get(environmentName);
    
    const metrics: EnvironmentMetrics = {
      name: environmentName,
      activePeers,
      totalLoadTime: existingMetrics !== undefined ? existingMetrics.totalLoadTime : Math.random() * 5000,
      averageFrameRate: existingMetrics !== undefined ? existingMetrics.averageFrameRate : 60,
      memoryFootprint: existingMetrics !== undefined ? existingMetrics.memoryFootprint : Math.random() * 100,
      errorRate: existingMetrics !== undefined ? existingMetrics.errorRate : 0,
      lastAccessed: new Date().toISOString()
    };

    this.environmentMetrics.set(environmentName, metrics);
  }

  public incrementRequestCount(): void {
    this.requestCount++;
  }

  public incrementErrorCount(): void {
    this.errorCount++;
  }

  public incrementWarningCount(): void {
    this.warningCount++;
  }

  public generateReportData(reportPeriodHours: number = 24): GDCReportData {
    const now = new Date();
    const startTime = new Date(now.getTime() - (reportPeriodHours * 60 * 60 * 1000));
    
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp) >= startTime
    );

    const averageResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.networkLatency, 0) / recentMetrics.length 
      : 0;

    const peakConcurrentUsers = Math.max(...recentMetrics.map(m => m.activePeers), 0);
    
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

    const systemHealth = this.calculateSystemHealth(recentMetrics);
    const recommendations = this.generateRecommendations(recentMetrics, systemHealth);

    return {
      reportId: `GDC-${format(now, 'yyyyMMdd-HHmmss')}`,
      generatedAt: now.toISOString(),
      reportPeriod: {
        start: startTime.toISOString(),
        end: now.toISOString()
      },
      gameMetrics: recentMetrics[recentMetrics.length - 1] ?? this.getDefaultGameMetrics(),
      peerMetrics: Array.from(this.peerMetrics.values()),
      environmentMetrics: Array.from(this.environmentMetrics.values()),
      systemHealth,
      performanceSummary: {
        averageResponseTime,
        peakConcurrentUsers,
        totalRequests: this.requestCount,
        errorRate,
        uptime: Date.now() - this.startTime
      },
      recommendations
    };
  }

  private calculateSystemHealth(metrics: GameMetrics[]): GDCReportData['systemHealth'] {
    const latestMetric = metrics[metrics.length - 1];
    if (!latestMetric) {
      return {
        serverStatus: 'healthy',
        databaseStatus: 'connected',
        networkStatus: 'stable',
        overallHealth: 'excellent'
      };
    }

    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const memoryUsagePercent = latestMetric.memoryUsage ? (latestMetric.memoryUsage.heapUsed / latestMetric.memoryUsage.heapTotal) * 100 : 0;

    let serverStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorRate > 10 || memoryUsagePercent > 90) {
      serverStatus = 'critical';
    } else if (errorRate > 5 || memoryUsagePercent > 75) {
      serverStatus = 'degraded';
    }

    let networkStatus: 'stable' | 'unstable' | 'down' = 'stable';
    if (latestMetric.networkLatency > 500) {
      networkStatus = 'down';
    } else if (latestMetric.networkLatency > 200) {
      networkStatus = 'unstable';
    }

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (serverStatus === 'critical' || networkStatus === 'down') {
      overallHealth = 'poor';
    } else if (serverStatus === 'degraded' || networkStatus === 'unstable') {
      overallHealth = 'fair';
    } else if (errorRate > 2 || memoryUsagePercent > 50) {
      overallHealth = 'good';
    }

    return {
      serverStatus,
      databaseStatus: 'connected', // Placeholder - would check actual DB status
      networkStatus,
      overallHealth
    };
  }

  private generateRecommendations(metrics: GameMetrics[], systemHealth: GDCReportData['systemHealth']): string[] {
    const recommendations: string[] = [];

    if (systemHealth.overallHealth === 'poor') {
      recommendations.push('CRITICAL: Immediate attention required for system stability');
    }

    const latestMetric = metrics[metrics.length - 1];
    if (latestMetric) {
      const memoryUsagePercent = latestMetric.memoryUsage ? (latestMetric.memoryUsage.heapUsed / latestMetric.memoryUsage.heapTotal) * 100 : 0;
      
      if (memoryUsagePercent > 80) {
        recommendations.push('Consider implementing memory optimization strategies');
      }
      
      if (latestMetric.networkLatency > 200) {
        recommendations.push('Network latency is high - investigate connection issues');
      }
      
      if (latestMetric.errorCount > 10) {
        recommendations.push('High error count detected - review error logs and implement fixes');
      }
    }

    if (this.requestCount > 10000) {
      recommendations.push('High request volume - consider implementing rate limiting');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performing optimally - continue monitoring');
    }

    return recommendations;
  }

  private getDefaultGameMetrics(): GameMetrics {
    return {
      timestamp: new Date().toISOString(),
      activePeers: 0,
      totalPeers: 0,
      environment: 'levelTest',
      serverUptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      networkLatency: 0,
      frameRate: 60,
      errorCount: this.errorCount,
      warningCount: this.warningCount
    };
  }

  public clearOldData(maxAgeHours: number = 168): void { // Default 7 days
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) > cutoffTime);
    
    // Clear old peer metrics
    for (const [peerId, metrics] of this.peerMetrics.entries()) {
      if (new Date(metrics.lastUpdate) < cutoffTime) {
        this.peerMetrics.delete(peerId);
      }
    }
    
    // Clear old environment metrics
    for (const [envName, metrics] of this.environmentMetrics.entries()) {
      if (new Date(metrics.lastAccessed) < cutoffTime) {
        this.environmentMetrics.delete(envName);
      }
    }
  }
}

