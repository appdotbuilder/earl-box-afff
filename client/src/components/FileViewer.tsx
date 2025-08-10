import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import { FileText, Download, AlertCircle } from 'lucide-react';
import type { FileInfoResponse } from '../../../server/src/schema';

interface FileViewerProps {
  slug: string;
}

export function FileViewer({ slug }: FileViewerProps) {
  const [fileInfo, setFileInfo] = useState<FileInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchFileInfo = async () => {
      if (!slug) {
        setError('Invalid file link');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result: FileInfoResponse = await trpc.getFileBySlug.query({ slug });
        setFileInfo(result);
        
        // Redirect to the public URL for direct file serving
        window.location.href = result.public_url;
        
      } catch (error) {
        console.error('Failed to fetch file info:', error);
        setError('File not found or has expired');
      } finally {
        setLoading(false);
      }
    };

    fetchFileInfo();
  }, [slug]);

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

  // Get file type icon
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('text/')) return '📝';
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
    return '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Skeleton className="h-16 w-16 rounded mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Loading file...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="text-center mt-6">
              <a 
                href="/" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                ← Back to Earl Box
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This component serves as a loading state since we redirect immediately
  // In case redirect fails, show file info as fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {fileInfo ? getFileIcon(fileInfo.content_type) : '📄'}
                </div>
                
                {fileInfo && (
                  <>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      File Found
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Size: {formatFileSize(fileInfo.size_bytes)}
                    </p>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Redirecting to file...
                    </p>
                    
                    <a
                      href={fileInfo.public_url}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              ← Back to Earl Box
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}