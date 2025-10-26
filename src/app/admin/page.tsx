'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { monitoring } from '@/lib/monitoring';

interface ContentStats {
  database: {
    totalLessons: number;
    totalLearningPaths: number;
    lessonsByDifficulty: Record<string, number>;
    lessonsByTool: Record<string, number>;
  };
  files: {
    totalFiles: number;
    categories: Record<string, number>;
  };
}


interface ValidationResult {
  totalLessons: number;
  issues: Array<{
    lessonNumber: number;
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

interface PreviewData {
  totalLessons: number;
  categories: Record<string, {
    count: number;
    lessons: Array<{
      lessonNumber: number;
      title: string;
      difficulty: string;
      tools: string[];
    }>;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/content');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      monitoring.logError('admin_stats_load_error', error);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import' }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: `Import successful! Imported ${result.stats.totalLessons} lessons and ${result.stats.totalLearningPaths} learning paths.` });
        await loadStats();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Import failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview' }),
      });

      if (response.ok) {
        const result = await response.json();
        setPreviewData(result);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Preview failed: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Master AI Content Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and import your educational content from markdown files
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Content Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleImport} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Importing...' : 'Import All Content'}
            </Button>
            <Button 
              onClick={handlePreview} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Preview Import'}
            </Button>
            <Button 
              onClick={handleValidate} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Validating...' : 'Validate Files'}
            </Button>
            <Button 
              onClick={loadStats}
              variant="outline"
            >
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Current Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Database Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Database Content</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Lessons:</span>
                  <span className="font-bold">{stats.database.totalLessons}</span>
                </div>
                <div className="flex justify-between">
                  <span>Learning Paths:</span>
                  <span className="font-bold">{stats.database.totalLearningPaths}</span>
                </div>
              </div>
              
              <h4 className="font-semibold mt-4 mb-2">By Difficulty:</h4>
              <div className="space-y-1">
                {Object.entries(stats.database.lessonsByDifficulty).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex justify-between text-sm">
                    <span className="capitalize">{difficulty}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* File Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Markdown Files</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Files:</span>
                  <span className="font-bold">{stats.files.totalFiles}</span>
                </div>
              </div>
              
              <h4 className="font-semibold mt-4 mb-2">By Category:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(stats.files.categories).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{category}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top AI Tools */}
        {stats && Object.keys(stats.database.lessonsByTool).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Top AI Tools Covered</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.database.lessonsByTool)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([tool, count]) => (
                  <div key={tool} className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-semibold">{tool}</div>
                    <div className="text-sm text-gray-600">{count} lessons</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Preview Data */}
        {previewData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Import Preview</h3>
            <p className="mb-4">Found {previewData.totalLessons} lessons to import</p>
            
            <div className="space-y-4">
              {Object.entries(previewData.categories).map(([category, data]) => (
                <div key={category} className="border rounded p-3">
                  <h4 className="font-semibold">{category} ({data.count} lessons)</h4>
                  <div className="mt-2 space-y-1">
                    {data.lessons.map((lesson) => (
                      <div key={lesson.lessonNumber} className="text-sm text-gray-600">
                        Lesson {lesson.lessonNumber}: {lesson.title} ({lesson.difficulty})
                      </div>
                    ))}
                    {data.count > 5 && (
                      <div className="text-sm text-gray-500">
                        ... and {data.count - 5} more lessons
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Results */}
        {validationResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
            <div className="mb-4">
              <div className="flex space-x-6">
                <span className="text-red-600">
                  Errors: {validationResult.summary.errors}
                </span>
                <span className="text-yellow-600">
                  Warnings: {validationResult.summary.warnings}
                </span>
                <span className="text-blue-600">
                  Info: {validationResult.summary.info}
                </span>
              </div>
            </div>

            {validationResult.issues.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {validationResult.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      issue.type === 'error' ? 'bg-red-50 text-red-800' :
                      issue.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                      'bg-blue-50 text-blue-800'
                    }`}
                  >
                    <span className="font-semibold">Lesson {issue.lessonNumber}:</span> {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}