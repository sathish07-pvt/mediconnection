import { Outlet, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface shadow-soft py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="flex items-center space-x-2 text-primary-600">
          <Activity size={32} strokeWidth={2.5} />
          <span className="text-2xl font-bold tracking-tight">MediGuard</span>
        </Link>
        <nav className="hidden md:flex space-x-6">
          <a href="#features" className="text-gray-600 hover:text-primary-600 font-medium">Features</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 font-medium">How It Works</a>
          <a href="#about" className="text-gray-600 hover:text-primary-600 font-medium">About</a>
        </nav>
        <div className="flex space-x-3">
          <Link to="/role-selection" className="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition">
            Login
          </Link>
          <Link to="/role-selection" className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg shadow-soft hover:bg-primary-600 transition">
            Get Started
          </Link>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-surface py-8 text-center text-gray-500 border-t border-gray-100">
        <p>&copy; {new Date().getFullYear()} MediGuard. All rights reserved.</p>
        <p className="text-sm mt-1">Monitor Today. Protect Tomorrow.</p>
      </footer>
    </div>
  );
}
