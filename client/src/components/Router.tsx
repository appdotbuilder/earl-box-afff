import { useState, useEffect } from 'react';
import { FileViewer } from './FileViewer';

interface RouterProps {
  children: React.ReactNode;
}

export function Router({ children }: RouterProps) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle file sharing routes
  const fileRouteMatch = currentPath.match(/^\/f\/(.+)$/);
  if (fileRouteMatch) {
    const slug = fileRouteMatch[1];
    return <FileViewer slug={slug} />;
  }

  // Default route (home)
  if (currentPath === '/' || currentPath === '') {
    return <>{children}</>;
  }

  // 404 or unknown routes - redirect to home
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/');
    setCurrentPath('/');
  }

  return <>{children}</>;
}