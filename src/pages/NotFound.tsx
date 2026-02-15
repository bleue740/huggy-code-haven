import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Zap, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Blink</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link to="/auth" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Sign in</Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-[120px] sm:text-[180px] font-black leading-none text-white/5 select-none">404</div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight -mt-6 sm:-mt-10">Page introuvable</h1>
        <p className="mt-3 text-gray-400 text-sm sm:text-base max-w-md leading-relaxed">
          La page que vous cherchez n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez à l'accueil.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors text-sm"
          >
            <Home size={16} />
            Retour à l'accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Page précédente
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Blink. All rights reserved.
      </footer>
    </main>
  );
};

export default NotFound;
