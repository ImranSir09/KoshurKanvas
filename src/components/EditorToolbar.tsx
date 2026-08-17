import React, { useState } from 'react';
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
  Type,
  Palette,
  Highlighter,
  Sliders,
  RotateCcw,
  Check,
  ChevronDown,
  WrapText,
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
  const [openPicker, setOpenPicker] = useState<
    'none' | 'font' | 'color' | 'highlight' | 'spacing' | 'fx' | 'canvas'
  >('none');

  const fonts: { id: FontChoice; name: string; nameKashmiri: string }[] = [
    { id: 'Noto Nastaliq Urdu', name: 'Noto Nastaliq Urdu (Default)', nameKashmiri: 'نوٹو نستعلیق (Primary)' },
    { id: 'Gulzar', name: 'Gulzar Nastaliq', nameKashmiri: 'گُلزار نستعلیق' },
    { id: 'Amiri', name: 'Amiri Naskh', nameKashmiri: 'امیری نسخ' },
    { id: 'Noto Sans Arabic', name: 'Noto Sans Arabic', nameKashmiri: 'نوٹو سنز عربک' },
  ];

  const quickColors = [
    '#1c1917', // stone-900
    '#b45309', // amber-700
    '#b91c1c', // red-700
    '#047857', // emerald-700
    '#1d4ed8', // blue-700
    '#6d28d9', // purple-700
    '#d97706', // amber-500
    '#f59e0b', // amber-400
    '#fafaf9', // stone-50
  ];

  const quickHighlights = [
    'transparent',
    '#fef3c7', // amber-100
    '#fee2e2', // red-100
    '#dcfce7', // emerald-100
    '#e0e7ff', // indigo-100
    '#fef08a', // yellow-200
  ];

  return (
    <div
      id="editor-formatting-toolbar"
      className="w-full bg-white border-t border-b border-stone-200 px-3 py-2 flex flex-col z-30 transition-colors"
    >
      {/* Horizontally Scrollable Main Bar */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5" dir="rtl">
        {/* Selection Status Badge */}
        {isSelectionActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-semibold text-emerald-900 font-sans">
              {selectionCount} حرف مُنتَخَب
            </span>
          </div>
        )}

        {/* Font Family Dropdown Button */}
        <div className="relative shrink-0">
          <button
            id="toolbar-font-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenPicker(openPicker === 'font' ? 'none' : 'font')}
            className={`h-8 px-2 rounded-lg flex items-center gap-1 text-xs border transition-colors cursor-pointer ${
              openPicker === 'font'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
            }`}
            title="Font Family (فونٹ)"
          >
            <span className="w-5 h-5 rounded flex items-center justify-center bg-stone-100 text-stone-800 font-serif font-bold text-xs border border-stone-300 shadow-2xs">F</span>
            <ChevronDown size={12} />
          </button>
        </div>

        {/* Font Size (+ / -) */}
        <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="font-size-dec-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ fontSize: Math.max(8, currentStyle.fontSize - 2) })}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors cursor-pointer"
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
            title="Bold"
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
            title="Italic"
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
            title="Underline"
          >
            <Underline size={14} />
          </button>
        </div>

        {/* Text Color Picker Trigger */}
        <button
          id="toolbar-color-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpenPicker(openPicker === 'color' ? 'none' : 'color')}
          className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs border transition-colors shrink-0 cursor-pointer ${
            openPicker === 'color'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
          }`}
          title="Text Color"
        >
          <Palette size={14} />
          <span
            className="w-3.5 h-3.5 rounded-full border border-stone-300"
            style={{ backgroundColor: currentStyle.color }}
          />
        </button>

        {/* Highlight Color Picker Trigger */}
        <button
          id="toolbar-highlight-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpenPicker(openPicker === 'highlight' ? 'none' : 'highlight')}
          className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs border transition-colors shrink-0 cursor-pointer ${
            openPicker === 'highlight'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
          }`}
          title="Highlight Background Color"
        >
          <Highlighter size={14} />
          <span
            className="w-3.5 h-3.5 rounded-full border border-stone-300"
            style={{ backgroundColor: currentStyle.highlightColor || 'transparent' }}
          />
        </button>

        {/* Alignment Controls (Right, Center, Left, Justify, Top, Bottom) */}
        <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="align-right-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'right' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'right'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Right Align (سیدھ)"
          >
            <AlignRight size={14} />
          </button>
          <button
            id="align-center-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'center' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'center'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Center Align (مرکز)"
          >
            <AlignCenter size={14} />
          </button>
          <button
            id="align-left-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'left' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'left'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Left Align (کشادہ)"
          >
            <AlignLeft size={14} />
          </button>
          <button
            id="align-justify-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'justify' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'justify'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Justify Align (برابر)"
          >
            <AlignJustify size={14} />
          </button>
          <button
            id="align-top-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ verticalAlign: 'top' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.verticalAlign === 'top'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Top Align (بیٹھک بالایٔی)"
          >
            <ArrowUpToLine size={14} />
          </button>
          <button
            id="align-bottom-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ verticalAlign: 'bottom' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.verticalAlign === 'bottom'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Bottom Align (بیٹھک ترٛیٚی)"
          >
            <ArrowDownToLine size={14} />
          </button>
        </div>



        {/* Line Break (New Line) Quick Action */}
        {onInsertLineBreak && (
          <button
            id="toolbar-linebreak-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onInsertLineBreak}
            className="h-8 px-2 sm:px-2.5 rounded-lg flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 transition-colors shrink-0 font-nastaliq cursor-pointer"
            title="Line Break (نٔو لٲن / Enter)"
          >
            <WrapText size={13} className="shrink-0" />
            <span className="hidden sm:inline">نٔو لٲن</span>
          </button>
        )}

        {/* Spacing & FX Popover Trigger */}
        <button
          id="toolbar-fx-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpenPicker(openPicker === 'fx' ? 'none' : 'fx')}
          className={`h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs border transition-colors shrink-0 cursor-pointer ${
            openPicker === 'fx'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
          }`}
          title="Line Height, Letter Spacing & Shadows"
        >
          <Sliders size={14} />
          <span className="font-nastaliq">اثرات</span>
        </button>

        {/* Clear Formatting Button */}
        <button
          id="toolbar-clear-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClearFormatting}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-rose-50 hover:text-rose-700 border border-stone-200 hover:border-rose-200 transition-colors shrink-0 font-nastaliq cursor-pointer"
          title="Clear Formatting"
        >
          <RotateCcw size={12} />
          <span>صاف</span>
        </button>
      </div>



      {/* Sub-panels for Font, Color, FX */}
      {openPicker === 'font' && (
        <div className="pt-1.5 pb-1 border-t border-stone-200 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2" dir="rtl">
          {fonts.map((f) => (
            <button
              key={f.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onUpdateStyle({ fontFamily: f.id });
                setOpenPicker('none');
              }}
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 border transition-colors cursor-pointer ${
                currentStyle.fontFamily === f.id
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                  : 'bg-white border-stone-200 text-stone-900 hover:bg-emerald-50 hover:border-emerald-200'
              }`}
            >
              <span className="font-nastaliq">{f.nameKashmiri}</span>
              {currentStyle.fontFamily === f.id && <Check size={12} className="text-white shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {openPicker === 'color' && (
        <div className="pt-2 pb-1 border-t border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2">
          <span className="text-xs font-nastaliq text-stone-900 shrink-0">رنگ لَفظ:</span>
          {quickColors.map((col, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onUpdateStyle({ color: col });
                setOpenPicker('none');
              }}
              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer"
              style={{ backgroundColor: col }}
            >
              {currentStyle.color === col && (
                <Check size={14} className={col === '#fafaf9' || col === '#f59e0b' ? 'text-stone-900' : 'text-white'} />
              )}
            </button>
          ))}
          {/* Native Color Input */}
          <input
            type="color"
            value={currentStyle.color.startsWith('#') ? currentStyle.color : '#1c1917'}
            onChange={(e) => onUpdateStyle({ color: e.target.value })}
            className="w-7 h-7 rounded-full cursor-pointer border border-stone-300 shrink-0"
            title="Custom Color"
          />
        </div>
      )}

      {openPicker === 'highlight' && (
        <div className="pt-2 pb-1 border-t border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2">
          <span className="text-xs font-nastaliq text-stone-900 shrink-0">ہائِلائٹ رنگ:</span>
          {quickHighlights.map((hl, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onUpdateStyle({ highlightColor: hl === 'transparent' ? undefined : hl });
                setOpenPicker('none');
              }}
              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer"
              style={{ backgroundColor: hl === 'transparent' ? '#ffffff' : hl }}
            >
              {hl === 'transparent' ? (
                <span className="text-[10px] text-stone-700 font-bold">X</span>
              ) : currentStyle.highlightColor === hl ? (
                <Check size={14} className="text-stone-900" />
              ) : null}
            </button>
          ))}
        </div>
      )}

      {openPicker === 'fx' && (
        <div className="pt-2 pb-1 border-t border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in slide-in-from-top-2" dir="rtl">
          {/* Line Spacing */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-nastaliq text-stone-900">
              لٲنَن مَنٛز فاصِلہ ({currentStyle.lineHeight.toFixed(1)})
            </span>
            <input
              type="range"
              min="0.5"
              max="3.2"
              step="0.1"
              value={currentStyle.lineHeight}
              onChange={(e) => onUpdateStyle({ lineHeight: parseFloat(e.target.value) })}
              className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Letter Spacing */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-nastaliq text-stone-900">
              حُروفَن مَنٛز فاصِلہ ({currentStyle.letterSpacing}px)
            </span>
            <input
              type="range"
              min="-2"
              max="8"
              step="0.5"
              value={currentStyle.letterSpacing}
              onChange={(e) => onUpdateStyle({ letterSpacing: parseFloat(e.target.value) })}
              className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Text Shadow Toggle */}
          <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-stone-200">
            <span className="text-xs font-nastaliq text-stone-900">سایہٕ (Shadow)</span>
            <input
              type="checkbox"
              checked={!!currentStyle.shadowColor}
              onChange={(e) =>
                onUpdateStyle({
                  shadowColor: e.target.checked ? 'rgba(0,0,0,0.5)' : undefined,
                  shadowBlur: e.target.checked ? 6 : 0,
                  shadowOffsetX: 0,
                  shadowOffsetY: e.target.checked ? 2 : 0,
                })
              }
              className="accent-emerald-600 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Text Opacity */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-nastaliq text-stone-900">
              شفافیت ({Math.round(currentStyle.opacity * 100)}%)
            </span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={currentStyle.opacity}
              onChange={(e) => onUpdateStyle({ opacity: parseFloat(e.target.value) })}
              className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
