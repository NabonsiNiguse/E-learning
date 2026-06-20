import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative h-9 w-16 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors"
      aria-label="Toggle theme"
    >
      {/* Toggle background */}
      <motion.div
        animate={{
          x: theme === "dark" ? 28 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 left-0.5 h-8 w-8 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center"
      >
        {theme === "light" ? (
          <motion.div
            initial={{ rotate: 0, scale: 0 }}
            animate={{ rotate: 360, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Sun className="h-4 w-4 text-orange-500" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ rotate: 0, scale: 0 }}
            animate={{ rotate: 360, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Moon className="h-4 w-4 text-blue-500" />
          </motion.div>
        )}
      </motion.div>

      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <Sun className="h-3.5 w-3.5 text-orange-400 opacity-60" />
        <Moon className="h-3.5 w-3.5 text-blue-400 opacity-60" />
      </div>
    </motion.button>
  );
}
