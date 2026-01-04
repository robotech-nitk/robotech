import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function ErrorLayout({
  code,
  title,
  description,
  primaryAction,
   onRetry,
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDiagnostics(true);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-slate-900 to-black text-gray-300 overflow-hidden">

      {/* Subtle animated grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.06),transparent_60%)] animate-pulse" />

      {/* Logo */}
     <Link
        to="/"
        className="absolute top-6"
        >
        <img
            src="/robotech_nitk_logo.jpeg"
            alt="RoboTech Logo"
            className="w-full h-36 rounded-full hover:scale-105 transition-transform"
        />
        </Link>
      

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-xl pt-12">

        <h1
        className={`text-7xl font-[Orbitron] animate-pulse drop-shadow-[0_0_25px] ${
            code === "403"
            ? "text-yellow-400 drop-shadow-[0_0_25px_#facc15]"
            : code === "500"
            ? "text-red-400 drop-shadow-[0_0_25px_#f87171]"
            : "text-cyan-400 drop-shadow-[0_0_25px_#00fff2]"
        }`}
        >
        {code}
        </h1>


        <h2 className="mt-6 text-2xl text-gray-100">
          {title}
        </h2>

        <p className="mt-4 text-gray-400">
          {description}
        </p>

        {/* Primary Action */}
       <div className="mt-10 flex justify-center gap-4">
        {onRetry && (
            <button
            onClick={onRetry}
            className="bg-red-500 hover:bg-red-600 text-black px-8 py-3 rounded-md font-semibold transition transform hover:scale-105"
            >
            Retry System
            </button>
        )}

        <Link
            to={primaryAction.href}
            className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-md font-semibold transition transform hover:scale-105"
        >
            {primaryAction.label}
        </Link>
        </div>


        {/* Diagnostics */}
        {showDiagnostics && (
          <div className="mt-10 text-sm text-cyan-400 font-mono">
            <span className="animate-pulse">› Running diagnostics...</span>
            <br />
            <span className="text-gray-500">
              › Path resolution failed. Fallback required_
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
