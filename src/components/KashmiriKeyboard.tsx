import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Delete,
  CornerDownLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Smartphone
} from 'lucide-react';
import {
  KASHMIRI_KEYBOARD_LAYOUTS,
  QUICK_KASHMIRI_BAR
} from '../lib/kashmiriData';
import { playKeyClickSound } from '../lib/soundEffects';
import { trackRecentCharacter } from '../lib/storage';

interface KashmiriKeyboardProps {
  onInsertText: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  onMoveCursor: (direction: 'left' | 'right') => void;
  onCloseKeyboard?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  recentChars?: string[];
  onSwitchToPhoneKeyboard?: () => void;
}

type TabType = 'main' | 'vowels' | 'diacritics' | 'numbers';

export const KashmiriKeyboard: React.FC<KashmiriKeyboardProps> = ({
  onInsertText,
  onBackspace,
  onEnter,
  onMoveCursor,
  onCloseKeyboard,
  soundEnabled = true,
  onSwitchToPhoneKeyboard,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [longPressActiveKey, setLongPressActiveKey] = useState<{
    char: string;
    options: string[];
    rect: DOMRect | null;
  } | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const backspaceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backspaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (backspaceTimeoutRef.current) clearTimeout(backspaceTimeoutRef.current);
      if (backspaceIntervalRef.current) clearInterval(backspaceIntervalRef.current);
    };
  }, []);

  // Handle touch / mouse press for key with long-press support
  const handleKeyPointerDown = (
    keyObj: { char: string; longPress?: string[] },
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    isLongPressTriggeredRef.current = false;
    const target = e.currentTarget;

    if (keyObj.longPress && keyObj.longPress.length > 0) {
      const rect = target.getBoundingClientRect();
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      longPressTimerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        setLongPressActiveKey({
          char: keyObj.char,
          options: keyObj.longPress || [],
          rect,
        });
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(25);
          } catch {}
        }
      }, 320); // Responsive 320ms long-press
    }
  };

  const handleKeyClick = (char: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }

    playKeyClickSound(soundEnabled);
    onInsertText(char);
    trackRecentCharacter(char);
  };

  const handleKeyPointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Continuous backspace on long press
  const startContinuousBackspace = useCallback(() => {
    playKeyClickSound(soundEnabled);
    onBackspace();

    if (backspaceTimeoutRef.current) clearTimeout(backspaceTimeoutRef.current);
    if (backspaceIntervalRef.current) clearInterval(backspaceIntervalRef.current);

    backspaceTimeoutRef.current = setTimeout(() => {
      backspaceIntervalRef.current = setInterval(() => {
        playKeyClickSound(soundEnabled);
        onBackspace();
      }, 80);
    }, 350);
  }, [soundEnabled, onBackspace]);

  const stopContinuousBackspace = useCallback(() => {
    if (backspaceTimeoutRef.current) {
      clearTimeout(backspaceTimeoutRef.current);
      backspaceTimeoutRef.current = null;
    }
    if (backspaceIntervalRef.current) {
      clearInterval(backspaceIntervalRef.current);
      backspaceIntervalRef.current = null;
    }
  }, []);

  // Close long press menu on release or outside click
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      stopContinuousBackspace();
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [stopContinuousBackspace]);

  const selectLongPressChar = (char: string) => {
    playKeyClickSound(soundEnabled);
    onInsertText(char);
    trackRecentCharacter(char);
    setLongPressActiveKey(null);
    isLongPressTriggeredRef.current = false;
  };

  const tabLabels: { id: TabType; label: string; sub?: string }[] = [
    { id: 'main', label: 'حروف' },
    { id: 'vowels', label: 'واول' },
    { id: 'diacritics', label: 'اِعراب' },
    { id: 'numbers', label: '۱۲۳' },
  ];

  return (
    <div
      id="kashmiri-virtual-keyboard"
      className="w-full bg-white border-t border-stone-200 select-none transition-colors z-40 touch-none flex flex-col shadow-lg"
    >
      {/* Long Press Popup Floating Modal */}
      {longPressActiveKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setLongPressActiveKey(null)}
        >
          <div
            className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-stone-200 flex flex-col items-center gap-2.5 animate-in zoom-in-95 duration-100 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between w-full border-b border-stone-100 pb-2 px-1">
              <span className="text-xs font-nastaliq text-stone-500 font-normal">
                متبادِل اَکھَر (Alternate Letters)
              </span>
              <span className="text-xs font-nastaliq px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                بنیادی: {longPressActiveKey.char}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center pt-1 w-full">
              {longPressActiveKey.options.map((optionChar, idx) => (
                <button
                  key={idx}
                  id={`longpress-key-${idx}`}
                  type="button"
                  onClick={() => selectLongPressChar(optionChar)}
                  className="min-w-[48px] h-13 px-3.5 bg-stone-50 hover:bg-emerald-600 hover:text-white text-stone-900 font-nastaliq text-2xl rounded-xl flex items-center justify-center transition-all active:scale-95 border border-stone-200 shadow-xs cursor-pointer"
                >
                  {optionChar}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Quick Bar: Recent & Essential Kashmiri Vowels/Marks */}
      <div className="w-full py-1 px-1.5 sm:px-3 bg-white border-b border-stone-200 flex items-center justify-between gap-1.5">
        {/* Kashmiri Quick Characters (Horizontally Scrollable) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 overflow-x-auto no-scrollbar py-0.5 touch-pan-x" dir="rtl">
          <span className="text-[10px] font-bold text-emerald-800 px-1.5 sm:px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md shrink-0 select-none">
            کٲشُر
          </span>
          {QUICK_KASHMIRI_BAR.map((item, i) => (
            <button
              key={`quick-${i}`}
              id={`quick-bar-btn-${i}`}
              type="button"
              onClick={() => {
                playKeyClickSound(soundEnabled);
                onInsertText(item.char);
                trackRecentCharacter(item.char);
              }}
              className="h-7 sm:h-8 min-w-[28px] sm:min-w-[34px] px-1 sm:px-2 bg-stone-50 hover:bg-emerald-50 text-stone-900 font-nastaliq text-sm sm:text-base rounded-md border border-stone-200 hover:border-emerald-300 active:bg-emerald-600 active:text-white transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Action icons right */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-stone-200">
          {/* Phone Keyboard Switcher - Decreased visual weight */}
          {onSwitchToPhoneKeyboard && (
            <button
              id="switch-to-phone-keyboard-btn"
              type="button"
              onClick={onSwitchToPhoneKeyboard}
              className="h-7 sm:h-7.5 px-2 rounded-md text-[11px] font-nastaliq font-normal flex items-center gap-1 text-stone-600 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Switch to Phone System Keyboard"
            >
              <Smartphone size={11} className="shrink-0 text-emerald-600" />
              <span className="hidden xs:inline">فون کیبورڈ</span>
            </button>
          )}

          {/* Minimize / Close */}
          {onCloseKeyboard && (
            <button
              id="keyboard-close-toggle"
              type="button"
              onClick={onCloseKeyboard}
              className="p-1 sm:p-1.5 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
              title="Minimize Keyboard"
            >
              <ChevronDown size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Keys Container */}
      <div className="p-1 sm:p-2.5 max-w-3xl mx-auto w-full flex flex-col gap-1 sm:gap-1.5" dir="rtl">
        {/* Render Layout based on activeTab */}
        {activeTab === 'main' && (
          <>
            {KASHMIRI_KEYBOARD_LAYOUTS.main.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-0.5 sm:gap-1.5 w-full">
                {row.map((keyObj, keyIdx) => (
                  <button
                    key={keyIdx}
                    id={`kash-key-main-${rowIdx}-${keyIdx}`}
                    type="button"
                    onClick={() => handleKeyClick(keyObj.char)}
                    onPointerDown={(e) => handleKeyPointerDown(keyObj, e)}
                    onPointerLeave={handleKeyPointerLeave}
                    className={`flex-1 min-w-0 h-11 xs:h-12 sm:h-14 md:h-15 rounded-md sm:rounded-lg font-nastaliq text-lg xs:text-xl sm:text-2xl md:text-3xl flex items-center justify-center transition-all active:scale-95 active:bg-emerald-600 active:text-white relative select-none touch-manipulation cursor-pointer border shadow-2xs ${
                      keyObj.isKashmiriSpecial
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-200 font-bold'
                        : 'bg-white text-stone-900 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>{keyObj.char}</span>
                    {keyObj.longPress && keyObj.longPress.length > 0 && (
                      <span className="absolute bottom-0.5 left-1 text-[7px] font-sans text-stone-400 leading-none pointer-events-none">
                        •
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        {activeTab === 'vowels' && (
          <>
            {KASHMIRI_KEYBOARD_LAYOUTS.kashmiriVowels.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-0.5 sm:gap-1.5 w-full">
                {row.map((keyObj, keyIdx) => (
                  <button
                    key={keyIdx}
                    id={`kash-key-vowel-${rowIdx}-${keyIdx}`}
                    type="button"
                    onClick={() => handleKeyClick(keyObj.char)}
                    onPointerDown={(e) => handleKeyPointerDown(keyObj, e)}
                    onPointerLeave={handleKeyPointerLeave}
                    className={`flex-1 min-w-0 h-11 xs:h-12 sm:h-14 md:h-15 rounded-md sm:rounded-lg font-nastaliq text-lg xs:text-xl sm:text-2xl md:text-3xl flex items-center justify-center transition-all active:scale-95 active:bg-emerald-600 active:text-white relative border cursor-pointer select-none touch-manipulation shadow-2xs ${
                      keyObj.isKashmiriSpecial
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-200 font-bold'
                        : 'bg-white text-stone-900 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>{keyObj.char}</span>
                    {'longPress' in keyObj && (keyObj as any).longPress && (keyObj as any).longPress.length > 0 && (
                      <span className="absolute bottom-0.5 left-1 text-[7px] font-sans text-stone-400 leading-none pointer-events-none">
                        •
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        {activeTab === 'diacritics' && (
          <>
            {KASHMIRI_KEYBOARD_LAYOUTS.diacritics.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-0.5 sm:gap-1.5 w-full">
                {row.map((keyObj, keyIdx) => (
                  <button
                    key={keyIdx}
                    id={`kash-key-diacritic-${rowIdx}-${keyIdx}`}
                    type="button"
                    onClick={() => {
                      playKeyClickSound(soundEnabled);
                      onInsertText(keyObj.char);
                      trackRecentCharacter(keyObj.char);
                    }}
                    className={`flex-1 min-w-0 h-11 xs:h-12 sm:h-14 md:h-15 rounded-md sm:rounded-lg font-nastaliq ${
                      keyObj.char.length > 1 ? 'text-xs sm:text-sm md:text-base' : 'text-lg xs:text-xl sm:text-2xl md:text-3xl'
                    } flex flex-col items-center justify-center transition-all active:scale-95 active:bg-emerald-600 active:text-white relative border shadow-2xs ${
                      keyObj.isKashmiriSpecial
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-200 font-bold'
                        : 'bg-white text-stone-900 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>{keyObj.displayChar || keyObj.char}</span>
                    {keyObj.label && (
                      <span className="text-[8px] sm:text-[9px] font-sans text-stone-500 leading-tight truncate max-w-full px-0.5">
                        {keyObj.label.slice(0, 10)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        {activeTab === 'numbers' && (
          <>
            {KASHMIRI_KEYBOARD_LAYOUTS.numbers.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-0.5 sm:gap-1.5 w-full">
                {row.map((keyObj, keyIdx) => (
                  <button
                    key={keyIdx}
                    id={`kash-key-num-${rowIdx}-${keyIdx}`}
                    type="button"
                    onClick={() => handleKeyClick(keyObj.char)}
                    onPointerDown={(e) => handleKeyPointerDown(keyObj, e)}
                    onPointerLeave={handleKeyPointerLeave}
                    className="flex-1 min-w-0 h-11 xs:h-12 sm:h-14 md:h-15 rounded-md sm:rounded-lg bg-white text-stone-900 border border-stone-200 font-nastaliq text-lg xs:text-xl sm:text-2xl md:text-3xl flex items-center justify-center transition-all active:scale-95 active:bg-emerald-600 active:text-white hover:bg-stone-50 relative shadow-2xs"
                  >
                    <span>{keyObj.char}</span>
                    {keyObj.longPress && keyObj.longPress.length > 0 && (
                      <span className="absolute bottom-0.5 left-1 text-[7px] font-sans text-stone-400 leading-none pointer-events-none">
                        •
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        {/* Bottom Control & Spacebar Row */}
        <div className="flex items-center gap-1 sm:gap-1.5 w-full pt-0.5">
          {/* Tab Switcher: Segmented Buttons */}
          <div className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
            {tabLabels.map((tab) => (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                type="button"
                onClick={() => {
                  playKeyClickSound(soundEnabled);
                  setActiveTab(tab.id);
                }}
                className={`h-9 sm:h-11 px-1.5 xs:px-2 sm:px-2.5 rounded-md text-[11px] sm:text-xs font-nastaliq transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-stone-700 hover:text-emerald-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cursor Navigation (Left / Right) */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              id="cursor-btn-right"
              type="button"
              onClick={() => {
                playKeyClickSound(soundEnabled);
                onMoveCursor('right');
              }}
              className="h-9 sm:h-11 w-7 sm:w-9 rounded-md sm:rounded-lg bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
              title="Move cursor right"
            >
              <ChevronRight size={14} />
            </button>
            <button
              id="cursor-btn-left"
              type="button"
              onClick={() => {
                playKeyClickSound(soundEnabled);
                onMoveCursor('left');
              }}
              className="h-9 sm:h-11 w-7 sm:w-9 rounded-md sm:rounded-lg bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
              title="Move cursor left"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Spacebar */}
          <button
            id="kash-spacebar-btn"
            type="button"
            onClick={() => {
              playKeyClickSound(soundEnabled);
              onInsertText(' ');
            }}
            className="flex-1 min-w-[50px] xs:min-w-[70px] sm:min-w-[120px] h-9 sm:h-11 rounded-md sm:rounded-lg bg-white border border-stone-200 text-stone-800 font-nastaliq text-xs sm:text-sm flex items-center justify-center hover:bg-stone-50 active:bg-emerald-600 active:text-white transition-colors shadow-2xs cursor-pointer"
          >
            <span className="hidden xs:inline">خٲلی جاے (Space)</span>
            <span className="xs:hidden">خٲلی جاے</span>
          </button>

          {/* Backspace Button */}
          <button
            id="kash-backspace-btn"
            type="button"
            onPointerDown={startContinuousBackspace}
            onPointerUp={stopContinuousBackspace}
            onPointerLeave={stopContinuousBackspace}
            className="h-9 sm:h-11 w-8 sm:w-11 rounded-md sm:rounded-lg bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 flex items-center justify-center active:scale-95 transition-colors shrink-0 shadow-2xs cursor-pointer"
            title="Backspace"
          >
            <Delete size={15} />
          </button>

          {/* Enter / Line Break Button */}
          <button
            id="kash-enter-btn"
            type="button"
            onClick={() => {
              playKeyClickSound(soundEnabled);
              onEnter();
            }}
            className="h-9 sm:h-11 px-2.5 sm:px-3.5 rounded-md sm:rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-nastaliq flex items-center justify-center gap-1 active:scale-95 transition-colors font-bold shrink-0 shadow-xs cursor-pointer"
            title="Enter (نٔو لٲن)"
          >
            <CornerDownLeft size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
