import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Reusable AdminSlideOver component.
 * Slides out smoothly from the right (or left), positioned strictly between header and footer.
 *
 * @param {boolean} isOpen - Whether the slide-over is visible.
 * @param {function} onClose - Callback when close button, backdrop, or Escape is pressed.
 * @param {React.ReactNode} title - Title in the slide-over header.
 * @param {React.ReactNode} [subtitle] - Subtitle or description below the title.
 * @param {React.ComponentType} [icon] - Optional Lucide icon for the header.
 * @param {string} [width="max-w-xl"] - Tailwind width class (e.g. "max-w-xl", "max-w-lg", "max-w-2xl").
 * @param {"right" | "left"} [side="right"] - Direction drawer slides in from.
 * @param {boolean} [docked=false] - Render as a workspace column instead of an overlay.
 * @param {React.ReactNode} children - Form, details, or confirmation content.
 * @param {React.ReactNode} [footer] - Action buttons pinned to bottom of drawer.
 */
export function AdminSlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  width = "max-w-xl",
  customWidth,
  side = "right",
  docked = false,
  bodyClassName,
  children,
  footer,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard accessibility: close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isRight = side === "right";

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div
          style={docked && typeof customWidth === "number" ? { width: `${customWidth}px` } : undefined}
          className={docked
            ? `relative z-20 flex h-full shrink-0 overflow-hidden ${typeof customWidth === "number" ? "" : width}`
            : `absolute inset-0 z-40 overflow-hidden pointer-events-auto flex ${
                isRight ? "justify-end" : "justify-start"
              }`
          }
          role="dialog"
          aria-modal={docked ? undefined : "true"}
          aria-label={typeof title === "string" ? title : "Panel"}
        >
          {!docked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />
          )}

          {/* Slide-over Panel from Right (or Left) */}
          <motion.div
            initial={{ x: isRight ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRight ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={docked && typeof customWidth === "number" ? { width: `${customWidth}px` } : undefined}
            className={`relative z-10 flex h-full w-full ${docked && typeof customWidth === "number" ? "" : width} flex-col bg-white dark:bg-[#18191E] ${
              isRight ? "border-l" : "border-r"
            } border-slate-200/90 dark:border-[#2A2D35] ${docked ? "shadow-xl" : "shadow-2xl"} overflow-hidden`}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-slate-200/90 dark:border-[#2A2D35] bg-white dark:bg-[#18191E] px-6 py-4.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-[#004578]/30 text-blue-700 dark:text-[#50e6ff] border border-blue-200/80 dark:border-[#0078d4]/40 shadow-xs">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8E8E8] truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-[#9A9A9A] mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#252830] transition-colors"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body Content */}
            <div className={bodyClassName || "flex-1 overflow-y-auto p-6 space-y-5"}>
              {children}
            </div>

            {/* Pinned Footer (Optional) */}
            {footer && (
              <div className="shrink-0 border-t border-slate-200/90 dark:border-[#2A2D35] bg-slate-50/90 dark:bg-[#121316] px-6 py-3.5 flex items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  const portalRoot = document.getElementById("admin-slideover-root");
  if (!docked && portalRoot) {
    return createPortal(content, portalRoot);
  }

  return content;
}
