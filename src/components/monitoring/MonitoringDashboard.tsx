'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { performanceMonitor, type PerformanceMetric } from '@/lib/instrumentation/performance';
import { healthMonitor, type SystemHealth, createCartHealthCheck, createUserHealthCheck } from '@/lib/instrumentation/health';
import { logger, LogLevel } from '@/lib/instrumentation/logger';

interface MonitoringDashboardProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function MonitoringDashboard({ isVisible, onToggle }: MonitoringDashboardProps) {
  const [activeTab, setActiveTab] = useState<'performance' | 'health' | 'logs'>('performance');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh data
  const refreshData = async () => {
    try {
      // Get performance metrics
      const completed = performanceMonitor.getCompletedMetrics();
      const stats = performanceMonitor.getStats();
      setPerformanceMetrics(completed.slice(-20)); // Last 20 metrics

      // Get health status
      healthMonitor.registerCheck('cart', createCartHealthCheck);
      healthMonitor.registerCheck('userSession', createUserHealthCheck);
      const health = await healthMonitor.checkHealth();
      setSystemHealth(health);

      // Get recent logs
      const recentLogs = logger.getLogs({ limit: 50 });
      setLogs(recentLogs);
    } catch (error) {
      console.error('Failed to refresh monitoring data:', error);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isVisible) {
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isVisible]);

  // Initial load
  useEffect(() => {
    if (isVisible) {
      refreshData();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
      case 'completed':
        return 'bg-green-500';
      case 'degraded':
      case 'warn':
      case 'warning':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'fail':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'bg-gray-500';
      case LogLevel.INFO:
        return 'bg-blue-500';
      case LogLevel.WARN:
        return 'bg-yellow-500';
      case LogLevel.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">🔍 SRE Monitoring Dashboard</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <Button onClick={refreshData} variant="outline" size="sm">
                Refresh
              </Button>
              <Button onClick={onToggle} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-4 mt-4">
            {['performance', 'health', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded capitalize ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-full">
          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-600">Total Methods</h3>
                  <p className="text-2xl font-bold">{performanceMonitor.getStats().totalMethods}</p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-600">Running</h3>
                  <p className="text-2xl font-bold">{performanceMonitor.getStats().runningMethods}</p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-600">Avg Duration</h3>
                  <p className="text-2xl font-bold">
                    {performanceMonitor.getStats().averageDuration.toFixed(1)}ms
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-600">Error Rate</h3>
                  <p className="text-2xl font-bold">
                    {performanceMonitor.getStats().errorRate.toFixed(1)}%
                  </p>
                </Card>
              </div>

              {/* Slow Methods Alert */}
              {(() => {
                const slowMethods = performanceMonitor.getSlowMethods();
                const hasSlow = slowMethods.warning.length > 0 || slowMethods.critical.length > 0;
                
                if (!hasSlow) return null;

                return (
                  <Card className="p-4 border-yellow-400 bg-yellow-50">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Performance Alerts</h3>
                    <div className="space-y-2">
                      {slowMethods.critical.map((metric, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{metric.method}</span>
                          <Badge className="bg-red-100 text-red-800">
                            {metric.duration?.toFixed(1)}ms (CRITICAL)
                          </Badge>
                        </div>
                      ))}
                      {slowMethods.warning.map((metric, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{metric.method}</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {metric.duration?.toFixed(1)}ms (slow)
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })()}

              {/* Recent Metrics */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Recent Method Executions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {performanceMetrics.map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{metric.method}</span>
                        {metric.metadata?.args && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({metric.metadata.args} args)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {metric.duration?.toFixed(1)}ms
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(metric.status)}`}
                          title={metric.status}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && systemHealth && (
            <div className="space-y-6">
              {/* Overall Health Status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">System Health</h3>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full ${getStatusColor(systemHealth.status)}`}
                    />
                    <span className="font-semibold capitalize">{systemHealth.status}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Last checked: {new Date(systemHealth.timestamp).toLocaleTimeString()}
                </p>
              </Card>

              {/* System Metrics */}
              {systemHealth.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemHealth.metrics.memory && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Memory Usage</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Used:</span>
                          <span>{(systemHealth.metrics.memory.used / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{(systemHealth.metrics.memory.total / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              systemHealth.metrics.memory.percentage > 80
                                ? 'bg-red-500'
                                : systemHealth.metrics.memory.percentage > 60
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${systemHealth.metrics.memory.percentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          {systemHealth.metrics.memory.percentage.toFixed(1)}% used
                        </p>
                      </div>
                    </Card>
                  )}

                  {systemHealth.metrics.storage && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Storage Usage</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>localStorage:</span>
                          <span>{(systemHealth.metrics.storage.localStorageUsage / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>sessionStorage:</span>
                          <span>{(systemHealth.metrics.storage.sessionStorageUsage / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Health Checks */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Health Checks</h3>
                <div className="space-y-3">
                  {systemHealth.checks.map((check, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(check.status)}`}
                          />
                          <span className="font-medium capitalize">{check.name}</span>
                          <span className="text-sm text-gray-500">
                            ({check.duration.toFixed(1)}ms)
                          </span>
                        </div>
                        {check.message && (
                          <p className="text-sm text-gray-600 ml-5 mt-1">{check.message}</p>
                        )}
                      </div>
                      <Badge className={`text-white ${getStatusColor(check.status)}`}>
                        {check.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Log Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(logger.getStats()).map(([level, count]) => (
                  <Card key={level} className="p-3">
                    <h3 className="font-semibold text-gray-600 capitalize">{level}</h3>
                    <p className="text-xl font-bold">{count}</p>
                  </Card>
                ))}
              </div>

              {/* Recent Logs */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Recent Logs</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-white text-xs ${getLogLevelColor(log.level)}`}>
                            {LogLevel[log.level]}
                          </Badge>
                          {log.context && (
                            <span className="text-gray-600">[{log.context}]</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-medium">{log.message}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}