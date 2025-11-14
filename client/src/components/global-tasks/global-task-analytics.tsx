

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  Activity,
  Award,
  Zap
} from "lucide-react";
import { getGlobalTaskAnalytics } from "@/lib/api/global-tasks";
import type { GlobalTaskAnalytics } from "@/lib/types/global-tasks";

export function GlobalTaskAnalytics() {
  const [analytics, setAnalytics] = useState<GlobalTaskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await getGlobalTaskAnalytics();
      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Start creating tasks to see your analytics.</p>
      </div>
    );
  }

  const getProductivityScore = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const productivityScore = getProductivityScore(analytics.productivity_score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Task Analytics</h2>
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{analytics.total_tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{analytics.completed_tasks}</p>
                <p className="text-xs text-gray-500">
                  {analytics.completion_rate.toFixed(1)}% completion rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{analytics.in_progress_tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">{analytics.overdue_tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Productivity Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Performance</span>
                <span className={productivityScore.color}>
                  {analytics.productivity_score.toFixed(1)}% - {productivityScore.label}
                </span>
              </div>
              <Progress value={analytics.productivity_score} className="h-3" />
            </div>
            <div className={`px-3 py-1 rounded-full ${productivityScore.bg}`}>
              <span className={`text-sm font-medium ${productivityScore.color}`}>
                {productivityScore.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.tasks_by_status).map(([status, count]) => {
                const percentage = analytics.total_tasks > 0 ? (count / analytics.total_tasks) * 100 : 0;
                const statusColors = {
                  'todo': 'bg-gray-500',
                  'in-progress': 'bg-blue-500',
                  'completed': 'bg-green-500',
                  'cancelled': 'bg-red-500',
                  'on-hold': 'bg-yellow-500',
                };
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{status.replace('-', ' ')}</span>
                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Tasks by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.tasks_by_priority).map(([priority, count]) => {
                const percentage = analytics.total_tasks > 0 ? (count / analytics.total_tasks) * 100 : 0;
                const priorityColors = {
                  'urgent': 'bg-red-500',
                  'high': 'bg-orange-500',
                  'medium': 'bg-blue-500',
                  'low': 'bg-green-500',
                };
                
                return (
                  <div key={priority} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{priority}</span>
                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Time Tracking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.total_time_tracked.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Total Time Logged</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.average_completion_time.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Avg. Completion Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.completed_tasks > 0 ? (analytics.total_time_tracked / analytics.completed_tasks).toFixed(1) : 0}h
              </div>
              <div className="text-sm text-gray-600">Avg. Time per Task</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.completion_rate >= 80 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Excellent Completion Rate</h4>
                  <p className="text-sm text-green-700">
                    You're completing {analytics.completion_rate.toFixed(1)}% of your tasks. Keep up the great work!
                  </p>
                </div>
              </div>
            )}
            
            {analytics.overdue_tasks > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Overdue Tasks</h4>
                  <p className="text-sm text-red-700">
                    You have {analytics.overdue_tasks} overdue task(s). Consider reviewing your priorities and deadlines.
                  </p>
                </div>
              </div>
            )}
            
            {analytics.in_progress_tasks > analytics.completed_tasks && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Activity className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Focus on Completion</h4>
                  <p className="text-sm text-yellow-700">
                    You have more tasks in progress than completed. Consider focusing on finishing existing tasks before starting new ones.
                  </p>
                </div>
              </div>
            )}
            
            {analytics.total_time_tracked === 0 && (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Start Time Tracking</h4>
                  <p className="text-sm text-blue-700">
                    Enable time tracking to get better insights into your productivity and task completion patterns.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
