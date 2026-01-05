'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  onDownload?: () => void;
}

export function MarkdownModal({ isOpen, onClose, content, title, onDownload }: MarkdownModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required for SSR hydration with createPortal
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="bg-white dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span className="hidden sm:inline">Скачать</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
            <span className="hidden sm:inline">Закрыть</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          <article className="prose prose-sm sm:prose-base prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-table:text-sm prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-3 prose-td:p-3 prose-table:border prose-th:border prose-td:border prose-table:border-gray-200 dark:prose-table:border-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
