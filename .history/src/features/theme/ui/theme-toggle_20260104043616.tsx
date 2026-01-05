"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/shared/lib/utils"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={cn(
                "relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300",
                "bg-gray-200 dark:bg-gray-700 shadow-inner"
            )}
            aria-label="Toggle theme"
        >
            <div
                className={cn(
                    "absolute h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center",
                    theme === "dark" ? "translate-x-6" : "translate-x-0"
                )}
            >
                {theme === "dark" ? (
                    <Moon className="h-3 w-3 text-gray-800" />
                ) : (
                    <Sun className="h-3 w-3 text-yellow-500" />
                )}
            </div>
        </button>
    )
}
