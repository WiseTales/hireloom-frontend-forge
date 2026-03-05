import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-8xl font-heading font-bold text-foreground mb-2">404</h1>
        <h2 className="text-3xl font-heading font-bold text-foreground/80 mb-4">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist. Please check the URL and try again.
        </p>
        <Link to="/" className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
