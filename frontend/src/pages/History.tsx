import React, { useState, useEffect } from 'react';
import { Analysis, UserStatistics } from '../types';
import { Calendar, Clock, Brain, Mic, FileText, User, TrendingUp, AlertCircle } from 'lucide-react';

interface Analysis {
  _id: string;
  timestamp: string;
  analysis_type: string;
  modality: string;
  emotion: string;
  confidence: number;
  mental_state: string;
  severity: string;
  suggestions: string[];
  is_backup: boolean;
  model_used: string;
  language: string;
  processing_time: number;
}

interface UserStatistics {
  total_analyses: number;
  emotion_distribution: Record<string, number>;
  modality_distribution: Record<string, number>;
  average_confidence: number;
  severity_distribution: Record<string, number>;
  recent_activity: Array<{
    id: string;
    timestamp: string;
    emotion: string;
    modality: string;
    confidence: number;
  }>;
}

interface HistoryProps {
  userId: string;
}

export default function History({ userId }: HistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    fetchUserHistory();
    fetchUserStatistics();
  }, [userId]);

  const fetchUserHistory = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/history?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setAnalyses(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatistics = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/statistics`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      
      const stats = await response.json();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'face': return <Brain className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'multimodal': return <User className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy': return 'bg-green-500';
      case 'sad': return 'bg-blue-500';
      case 'angry': return 'bg-red-500';
      case 'neutral': return 'bg-gray-500';
      default: return 'bg-purple-500';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_analyses}</div>
              <p className="text-xs text-muted-foreground">All time analyses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(statistics.average_confidence * 100).toFixed(1)}%
              </div>
              <Progress value={statistics.average_confidence * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.severity_distribution.High || 0}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Common</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(statistics.emotion_distribution).length > 0 
                  ? Object.entries(statistics.emotion_distribution)
                      .sort(([,a], [,b]) => b - a)[0][0]
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">Emotion</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main History Content */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Analysis History</TabsTrigger>
          <TabsTrigger value="statistics">Detailed Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analysis List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">Recent Analyses</h3>
              
              {analyses.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No analysis history found</p>
                      <p className="text-sm">Start an analysis to see your history here</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <Card 
                      key={analysis._id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedAnalysis?._id === analysis._id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getEmotionColor(analysis.emotion)}`}></div>
                            <div>
                              <div className="font-medium">{analysis.emotion}</div>
                              <div className="text-sm text-muted-foreground">
                                {analysis.modality} • {formatDate(analysis.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={getSeverityColor(analysis.severity)}>
                              {analysis.severity}
                            </Badge>
                            {getModalityIcon(analysis.modality)}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Confidence: {(analysis.confidence * 100).toFixed(1)}%
                          </div>
                          {analysis.is_backup && (
                            <Badge variant="secondary" className="text-xs">
                              Backup Model
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Analysis Details */}
            <div className="lg:col-span-1">
              {selectedAnalysis ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getModalityIcon(selectedAnalysis.modality)}
                      <span>Analysis Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Emotion</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-4 h-4 rounded-full ${getEmotionColor(selectedAnalysis.emotion)}`}></div>
                        <span className="font-medium">{selectedAnalysis.emotion}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Mental State</label>
                      <p className="mt-1">{selectedAnalysis.mental_state}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Confidence</label>
                      <div className="mt-1">
                        <Progress value={selectedAnalysis.confidence * 100} className="h-2" />
                        <span className="text-sm text-gray-600">
                          {(selectedAnalysis.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Severity</label>
                      <div className="mt-1">
                        <Badge className={getSeverityColor(selectedAnalysis.severity)}>
                          {selectedAnalysis.severity}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Model Used</label>
                      <p className="mt-1 text-sm">{selectedAnalysis.model_used}</p>
                      {selectedAnalysis.is_backup && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Fallback Model
                        </Badge>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Date & Time</label>
                      <p className="mt-1 text-sm">{formatDate(selectedAnalysis.timestamp)}</p>
                    </div>

                    {selectedAnalysis.suggestions && selectedAnalysis.suggestions.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Suggestions</label>
                        <ul className="mt-1 space-y-1">
                          {selectedAnalysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select an analysis to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Emotion Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Emotion Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.emotion_distribution).map(([emotion, count]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getEmotionColor(emotion)}`}></div>
                          <span className="font-medium">{emotion}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>{count}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getEmotionColor(emotion)}`}
                              style={{ width: `${(count / statistics.total_analyses) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Modality Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Modality Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.modality_distribution).map(([modality, count]) => (
                      <div key={modality} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getModalityIcon(modality)}
                          <span className="font-medium capitalize">{modality}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>{count}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(count / statistics.total_analyses) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Severity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Severity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.severity_distribution).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <span className="font-medium">{severity}</span>
                        <div className="flex items-center space-x-2">
                          <span>{count}</span>
                          <Badge className={getSeverityColor(severity)}>
                            {severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.recent_activity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getEmotionColor(activity.emotion)}`}></div>
                          <span>{activity.emotion}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
