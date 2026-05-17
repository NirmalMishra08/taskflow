import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto w-48 h-48">
            <div className="absolute inset-0 rounded-full bg-brand-100 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl font-bold text-brand-600">404</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-surface-900 mb-2">Page Not Found</h1>
        <p className="text-surface-500 mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Link to="/dashboard">
          <Button size="lg">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
