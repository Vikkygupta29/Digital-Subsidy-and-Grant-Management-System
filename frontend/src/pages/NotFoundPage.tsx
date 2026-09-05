import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 text-center">
      <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-full mb-4">
        <AlertCircle className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-white">404 - Page Not Found</h1>
      <p className="text-slate-400 mt-2 max-w-md text-sm">
        The page you are looking for doesn't exist or you don't have authorization to access it.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
      >
        <Home className="h-4 w-4 mr-2" /> Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
