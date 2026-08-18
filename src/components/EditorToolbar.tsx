import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  ArrowUpToLine,
  ArrowDownToLine,
  Palette,
  Highlighter,
  RotateCcw,
  WrapText,
  Check,
} from 'lucide-react';
import { FontChoice, TextStyleProperties } from '../types';

interface EditorToolbarProps {
  currentStyle: TextStyleProperties;
  onUpdateStyle: (updates: Partial<TextStyleProperties>) => void;
  onClearFormatting: () => void;
  onInsertLineBreak?: () => void;
  selectionCount?: number;
  isSelectionActive?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentStyle,
  onUpdateStyle,
  onClearFormatting,
  onInsertLineBreak,
  selectionCount = 0,
  isSelectionActive = false,
}) => {
  const fonts: { id: FontChoice; nameKashmiri: string }[] = [
    { id: 'Noto Nastaliq Urdu', nameKashmiri: 'نستعلیق' },
    { id: 'Gulzar', nameKashmiri: 'گُلزار' },
    { id: 'Amiri', nameKashmiri: 'امیری' },
    { id: 'Noto Sans Arabic', nameKashmiri: 'عربک' },
  ];

  const quickColors = [
    '#1c1917', // stone-900
    '#b45309', // amber-700
    '#b91c1c', // red-700
    '#047857', // emerald-700
    '#1d4ed8', // blue-700
    '#6d28d9', // purple-700
    '#f59e0b', // amber-400
  ];

  const quickHighlights = [
    'transparent',
    '#fef3c7', // amber-100
    '#fee2e2', // red-100
    '#dcfce7', // emerald-100
    '#fef08a', // yellow-200
  ];

  return (
    <div
      id="editor-formatting-toolbar"
      className="w-full bg-white border-t border-b border-stone-200 px-3 py-2 z-30"
      dir="rtl"
    >
      {/* Single Horizontal Scrolling Line Containing All Formatting Tools */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap select-none">
        {/* Selection Status Badge */}
        {isSelectionActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-semibold text-emerald-900 font-sans">
              {selectionCount} حرف مُنتَخَب
            </span>
          </div>
        )}

        {/* Font Family Selector Chips */}
        <div className="flex items-center bg-stone-100 border border-stone-200 rounded-lg p-0.5 shrink-0 gap-0.5">
          {fonts.map((f) => (
            <button
              key={f.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onUpdateStyle({ fontFamily: f.id })}
              className={`px-2 py-1 rounded-md text-xs font-nastaliq transition-colors cursor-pointer ${
                currentStyle.fontFamily === f.id
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:bg-stone-200'
              }`}
            >
              {f.nameKashmiri}
            </button>
          ))}
        </div>

        {/* Font Size (+ / -) */}
        <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="font-size-dec-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ fontSize: Math.max(8, currentStyle.fontSize - 2) })}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors cursor-pointer"
            title="حجم کم"
          >
            A-
          </button>
          <span className="px-1.5 text-xs font-semibold font-sans text-stone-900 min-w-[24px] text-center">
            {currentStyle.fontSize}
          </span>
          <button
            id="font-size-inc-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ fontSize: Math.min(100, currentStyle.fontSize + 2) })}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors cursor-pointer"
            title="حجم زیٛادٕ"
          >
            A+
          </button>
        </div>

        {/* Bold, Italic, Underline */}
        <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="toolbar-bold-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ bold: !currentStyle.bold })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.bold
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Bold (موټ)"
          >
            <Bold size={14} />
          </button>

          <button
            id="toolbar-italic-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ italic: !currentStyle.italic })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.italic
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Italic (تیٛرٛ)"
          >
            <Italic size={14} />
          </button>

          <button
            id="toolbar-underline-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ underline: !currentStyle.underline })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.underline
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Underline (لَکَر)"
          >
            <Underline size={14} />
          </button>
        </div>

        {/* Text Color Quick Swatches */}
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1 shrink-0">
          <Palette size={13} className="text-stone-600" />
          {quickColors.map((col, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onUpdateStyle({ color: col })}
              className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                currentStyle.color === col ? 'scale-110 ring-2 ring-emerald-600 border-white' : 'border-stone-300'
              }`}
              style={{ backgroundColor: col }}
              title={`رنگ: ${col}`}
            />
          ))}
          <input
            type="color"
            value={currentStyle.color.startsWith('#') ? currentStyle.color : '#1c1917'}
            onChange={(e) => onUpdateStyle({ color: e.target.value })}
            className="w-5 h-5 rounded-full cursor-pointer border border-stone-300 bg-transparent shrink-0"
            title="حَسْبِ زَرورَت رنگ (Custom Color)"
          />
        </div>

        {/* Highlight Color Quick Swatches */}
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1 shrink-0">
          <Highlighter size={13} className="text-stone-600" />
          {quickHighlights.map((hl, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onUpdateStyle({ highlightColor: hl === 'transparent' ? undefined : hl })}
              className={`w-5 h-5 rounded-full border transition-transform flex items-center justify-center cursor-pointer ${
                currentStyle.highlightColor === hl ? 'scale-110 ring-2 ring-emerald-600 border-white' : 'border-stone-300'
              }`}
              style={{ backgroundColor: hl === 'transparent' ? '#ffffff' : hl }}
              title="Highlight"
            >
              {hl === 'transparent' && <span className="text-[9px] text-stone-500 font-bold">X</span>}
            </button>
          ))}
        </div>

        {/* Alignment Controls */}
        <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="align-right-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'right' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'right' ? 'bg-emerald-600 text-white' : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Right Align"
          >
            <AlignRight size={14} />
          </button>
          <button
            id="align-center-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'center' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'center' ? 'bg-emerald-600 text-white' : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Center Align"
          >
            <AlignCenter size={14} />
          </button>
          <button
            id="align-left-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'left' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'left' ? 'bg-emerald-600 text-white' : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Left Align"
          >
            <AlignLeft size={14} />
          </button>
          <button
            id="align-justify-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'justify' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'justify' ? 'bg-emerald-600 text-white' : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Justify"
          >
            <AlignJustify size={14} />
          </button>
          <button
            id="align-top-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ verticalAlign: 'top' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.verticalAlign === 'top' ? 'bg-emerald-600 text-white' : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Top Align"
          >
            <ArrowUpToLine size={14} />
          </button>
          <button
            id="align-bottom-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ verticalAlign: 'bottom' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.verticalAlign === 'bottom' ? 'bg-emerald-600 text-white' : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Bottom Align"
          >
            <ArrowDownToLine size={14} />
          </button>
        </div>

        {/* Spacing Sliders Inline */}
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 shrink-0 text-xs">
          <span className="font-nastaliq text-stone-700">لٲن فاصِلہ:</span>
          <input
            type="range"
            min="0.8"
            max="3.0"
            step="0.1"
            value={currentStyle.lineHeight}
            onChange={(e) => onUpdateStyle({ lineHeight: parseFloat(e.target.value) })}
            className="accent-emerald-600 w-16 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            title="Line Spacing"
          />
        </div>

        {/* Line Break Button */}
        {onInsertLineBreak && (
          <button
            id="toolbar-linebreak-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onInsertLineBreak}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 transition-colors shrink-0 font-nastaliq cursor-pointer"
            title="Line Break"
          >
            <WrapText size={13} />
            <span>نٔو لٲن</span>
          </button>
        )}

        {/* Clear Formatting Button */}
        <button
          id="toolbar-clear-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClearFormatting}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-rose-50 hover:text-rose-700 border border-stone-200 transition-colors shrink-0 font-nastaliq cursor-pointer"
          title="Clear Formatting"
        >
          <RotateCcw size={12} />
          <span>صاف</span>
        </button>
      </div>
    </div>
  );
};
