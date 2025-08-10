import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { Upload, Copy, Check, FileText, AlertCircle } from 'lucide-react';
import { Router } from '@/components/Router';
import { NotificationManager } from '@/components/Notification';
import type { UploadCountResponse, FileInfoResponse } from '../../server/src/schema';
import './App.css';

function MainPage() {
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>>([]);

  // Add notification helper
  const addNotification = (message: string, type: 'success' | 'error' | 'info', duration?: number) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  // Get base URL for generating shareable links
  const getBaseUrl = () => {
    return `${window.location.protocol}//${window.location.host}`;
  };

  // Load upload count on mount
  const loadUploadCount = useCallback(async () => {
    try {
      const result: UploadCountResponse = await trpc.getUploadCount.query();
      setUploadCount(result.total_count);
    } catch (error) {
      console.error('Failed to load upload count:', error);
    }
  }, []);

  useEffect(() => {
    loadUploadCount();
  }, [loadUploadCount]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Check file size (200MB limit)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeFormatted = formatFileSize(file.size);
      setError(`File size (${fileSizeFormatted}) exceeds 200MB limit`);
      addNotification(`File size (${fileSizeFormatted}) exceeds 200MB limit`, 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setGeneratedLink('');
    setLinkCopied(false);

    try {
      // Step 1: Request signed upload URL
      const uploadUrlResponse = await trpc.requestUploadUrl.mutate({
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        size_bytes: file.size
      });

      setUploadProgress(25);

      // Step 2: Upload file directly to object storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(uploadUrlResponse.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadProgress(75);

      // Step 3: Finalize upload by storing metadata
      await trpc.finalizeUpload.mutate({
        slug: uploadUrlResponse.slug,
        object_name: uploadUrlResponse.object_name,
        size_bytes: file.size,
        content_type: file.type || 'application/octet-stream'
      });

      setUploadProgress(100);

      // Generate shareable link
      const shareableLink = `${getBaseUrl()}/f/${uploadUrlResponse.slug}`;
      setGeneratedLink(shareableLink);
      addNotification('File uploaded successfully!', 'success');

      // Refresh upload count
      await loadUploadCount();

    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
      addNotification('Upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      addNotification('Link copied to clipboard!', 'success', 2000);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      addNotification('Failed to copy link', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <NotificationManager 
        notifications={notifications}
        onRemove={removeNotification}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-3 tracking-tight">
            📦 Earl Box
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Share files up to 200MB instantly with secure links
          </p>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            📊 {uploadCount.toLocaleString()} files uploaded
          </Badge>
        </div>

        {/* Upload Area */}
        <div className="max-w-md mx-auto mb-8">
          <Card 
            className={`transition-all duration-200 ${
              dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            } ${isUploading ? 'opacity-75' : 'hover:shadow-lg'}`}
          >
            <CardContent className="p-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && document.getElementById('fileInput')?.click()}
              >
                <Upload className={`mx-auto h-16 w-16 mb-4 transition-colors ${
                  dragOver ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {isUploading ? 'Uploading...' : dragOver ? 'Drop your file here' : 'Choose or drop a file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Maximum file size: 200MB • All file types supported
                </p>
                
                <Input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                />
              </div>
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-6">
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>
                        {uploadProgress < 25 && 'Requesting upload URL...'}
                        {uploadProgress >= 25 && uploadProgress < 75 && 'Uploading to storage...'}
                        {uploadProgress >= 75 && uploadProgress < 100 && 'Finalizing...'}
                        {uploadProgress === 100 && 'Complete!'}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Generated Link */}
        {generatedLink && (
          <div className="max-w-lg mx-auto mb-8">
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-800">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Upload Complete! 🎉
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your file is ready to share
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="flex-1 bg-white dark:bg-gray-800 border-green-300 dark:border-green-700 font-mono text-sm"
                      onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                        const target = e.target as HTMLInputElement;
                        target.select();
                      }}
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant={linkCopied ? "default" : "outline"}
                      size="sm"
                      className={`shrink-0 transition-all duration-200 ${
                        linkCopied 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-800'
                      }`}
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 text-center">
                    Anyone with this link can download your file
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created by Earl Store❤️
          </p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainPage />
    </Router>
  );
}

export default App;