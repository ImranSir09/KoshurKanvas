import React from 'react';
import {
  FolderOpen,
  Download,
  FilePlus,
  Languages,
} from 'lucide-react';

interface HeaderProps {
  currentDocTitle?: string;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onNewDocument?: () => void;
  onOpenCharacterPicker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDocTitle,
  onOpenProjects,
  onOpenExport,
  onNewDocument,
  onOpenCharacterPicker,
}) => {
  return (
    <header
      id="app-main-header"
      className="w-full bg-white border-b border-stone-200 px-2.5 sm:px-4 py-2 flex items-center justify-between gap-1.5 sm:gap-3 select-none z-30 shrink-0 shadow-xs"
      dir="rtl"
    >
      {/* Brand & Active Document Name */}
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        {/* Compact Logo Mark in Emerald */}
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-nastaliq text-lg font-bold shrink-0 shadow-xs">
          ک
        </div>

        {/* Short App Name */}
        <span className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 leading-none shrink-0">
          کٲشُر لیٚکھُن
        </span>

        {/* Active Document Pill (Visible on wider screens) */}
        {currentDocTitle && (
          <div className="hidden md:flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 max-w-[180px] lg:max-w-[240px]">
            <span className="font-nastaliq text-xs text-stone-700 truncate leading-tight">
              {currentDocTitle}
            </span>
          </div>
        )}
      </div>

      {/* Action Tools & Options */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* New Document */}
        {onNewDocument && (
          <button
            id="header-new-doc-btn"
            type="button"
            onClick={onNewDocument}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg text-stone-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title="نواں مسودہ (New Document)"
          >
            <FilePlus size={15} />
          </button>
        )}

        {/* Saved Documents Drawer */}
        <button
          id="header-projects-btn"
          type="button"
          onClick={onOpenProjects}
          className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg text-stone-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
          title="محفوظ مسودات (Saved Documents)"
        >
          <FolderOpen size={15} />
        </button>

        {/* Character & Glyph Guide */}
        {onOpenCharacterPicker && (
          <button
            id="header-char-picker-btn"
            type="button"
            onClick={onOpenCharacterPicker}
            className="hidden sm:flex w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg text-stone-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title="کٲشُر اکھَر رہنُمٲیی (Kashmiri Glyph Guide)"
          >
            <Languages size={15} />
          </button>
        )}

        {/* Export Action Button in Emerald */}
        <button
          id="header-export-btn"
          type="button"
          onClick={onOpenExport}
          className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs mr-0.5"
          title="ایکسپورٹ کٔرِو (Export Writing - PNG, PDF, SVG, DOC, TXT)"
        >
          <Download size={15} />
        </button>
      </div>
    </header>
  );
};
