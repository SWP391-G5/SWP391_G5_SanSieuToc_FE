import { Link } from 'react-router-dom';
import '../styles/NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold mb-3">404</h1>
        <p className="text-lg opacity-80 mb-6">Page not found</p>
        <Link className="text-primary font-bold" to="/auth">
          Go to Auth
        </Link>
      </div>
    </div>
  );
}
