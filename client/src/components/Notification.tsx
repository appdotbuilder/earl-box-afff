import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Copy, AlertCircle, Info } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Notification({ message, type, duration = 3000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (): "default" | "destructive" => {
    return type === 'error' ? 'destructive' : 'default';
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <Alert variant={getVariant()} className="min-w-72 shadow-lg border">
        {getIcon()}
        <AlertDescription className="ml-2">
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface NotificationManagerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export function NotificationManager({ notifications, onRemove }: NotificationManagerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id}
          className="pointer-events-auto"
          style={{ 
            transform: `translateY(${index * 70}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          <Notification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}