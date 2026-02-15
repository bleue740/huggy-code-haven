import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${className}`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={16} className="text-gray-400 hover:text-yellow-400 transition-colors" />
      ) : (
        <Moon size={16} className="text-gray-500 hover:text-gray-800 transition-colors" />
      )}
    </button>
  );
};
