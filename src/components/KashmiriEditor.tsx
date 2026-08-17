import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CanvasAspectRatio,
  CanvasBackgroundConfig,
  KashurDocument,
  ParagraphFormat,
  SelectionRange,
  TextStyleProperties,
  TextStyleSpan
} from '../types';
import { KashmiriKeyboard } from './KashmiriKeyboard';
import { EditorToolbar } from './EditorToolbar';
import { CanvasSettingsPanel } from './CanvasSettingsPanel';
import { ParagraphToolbar } from './ParagraphToolbar';
import {
  buildRenderedSlices,
  applyStyleToRange,
  clearFormattingInRange,
  shiftSpansOnTextChange,
  getEffectiveStyleAtRange
} from '../lib/textEngine';
import { DEFAULT_TEXT_STYLE } from '../lib/kashmiriData';
import { getFontFamilyCSS } from '../lib/fontUtils';
import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  X,
  Copy,
  Scissors,
  Clipboard,
  BookOpen,
  Keyboard,
  Eye,
  Sliders,
  Check,
  Sparkles,
  Smartphone,
  Download,
  Undo2,
  Redo2,
  Layout,
  Settings
} from 'lucide-react';
import { copyTextToClipboard } from '../lib/exportEngine';

interface KashmiriEditorProps {
  document: KashurDocument;
  onUpdateDocument: (updated: Partial<KashurDocument>) => void;
  onOpenCharacterPicker?: () => void;
  onOpenExport: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFocusedWritingMode: boolean;
  setIsFocusedWritingMode: (val: boolean) => void;
}

export const KashmiriEditor: React.FC<KashmiriEditorProps> = ({
  document: doc,
  onUpdateDocument,
  onOpenCharacterPicker,
  onOpenExport,
  soundEnabled,
  onToggleSound,
  isFocusedWritingMode,
  setIsFocusedWritingMode,
}) => {
  const [cursorPos, setCursorPos] = useState<number>(doc.content.length);
  const [selection, setSelection] = useState<SelectionRange>({
    start: 0,
    end: 0,
    text: '',
  });
  const [activeFormatting, setActiveFormatting] = useState<TextStyleProperties>(doc.defaultStyle || DEFAULT_TEXT_STYLE);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [keyboardMode, setKeyboardMode] = useState<'virtual' | 'phone'>('phone');

  // History for Undo/Redo
  const historyRef = useRef<{ content: string; spans: TextStyleSpan[] }[]>([
    { content: doc.content, spans: doc.spans || [] },
  ]);
  const historyIndexRef = useRef<number>(0);

  // Search & Replace State
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showCanvasPanel, setShowCanvasPanel] = useState<boolean>(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [matchCount, setMatchCount] = useState<number>(0);

  // Canvas Config
  const canvasConfig: CanvasBackgroundConfig = doc.canvasConfig || {
    aspectRatio: 'auto',
    color: '#ffffff',
    imageOpacity: 1,
    overlayOpacity: 0,
  };

  const handleUpdateCanvasConfig = useCallback(
    (updates: Partial<CanvasBackgroundConfig>) => {
      const currentConfig = doc.canvasConfig || {
        aspectRatio: 'auto',
        color: '#ffffff',
        imageOpacity: 1,
        overlayOpacity: 0,
      };
      onUpdateDocument({
        canvasConfig: { ...currentConfig, ...updates },
      });
    },
    [doc.canvasConfig, onUpdateDocument]
  );

  const getRatioClasses = (ratio?: CanvasAspectRatio): string => {
    switch (ratio) {
      case '1:1':
        return 'w-full max-w-[500px] shadow-sm';
      case '4:5':
        return 'w-full max-w-[440px] shadow-sm';
      case '9:16':
        return 'w-full max-w-[360px] shadow-sm';
      case '16:9':
        return 'w-full max-w-[720px] shadow-sm';
      case '3:4':
        return 'w-full max-w-[460px] shadow-sm';
      case 'a4':
        return 'w-full max-w-[520px] shadow-sm';
      case 'auto':
      default:
        return 'w-full max-w-4xl min-h-[500px] shadow-sm';
    }
  };



  // Textarea Ref & Caret position synchronizer
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const livePreviewRef = useRef<HTMLDivElement | null>(null);

  // Push state to Undo History
  const pushHistory = useCallback((content: string, spans: TextStyleSpan[]) => {
    const currentHist = historyRef.current.slice(0, historyIndexRef.current + 1);
    currentHist.push({ content, spans });
    // Limit to 50 states
    if (currentHist.length > 50) currentHist.shift();
    historyRef.current = currentHist;
    historyIndexRef.current = currentHist.length - 1;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      onUpdateDocument({
        content: state.content,
        spans: state.spans,
      });
    }
  }, [onUpdateDocument]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      onUpdateDocument({
        content: state.content,
        spans: state.spans,
      });
    }
  }, [onUpdateDocument]);

  // Arbitrary Native Selection Tracking
  const updateSelectionFromDOM = useCallback(() => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart ?? 0;
    const end = textareaRef.current.selectionEnd ?? 0;

    setCursorPos(start);

    if (start !== end) {
      const selectedSubstr = doc.content.substring(start, end);
      setSelection({
        start,
        end,
        text: selectedSubstr,
      });
      // Sync active formatting to the effective style of the selected text
      const effective = getEffectiveStyleAtRange(
        doc.content.length,
        doc.spans || [],
        doc.defaultStyle || DEFAULT_TEXT_STYLE,
        start,
        end
      );
      setActiveFormatting(effective);
    } else {
      setSelection({
        start,
        end: start,
        text: '',
      });
      const effective = getEffectiveStyleAtRange(
        doc.content.length,
        doc.spans || [],
        doc.defaultStyle || DEFAULT_TEXT_STYLE,
        start,
        start
      );
      setActiveFormatting(effective);
    }
  }, [doc.content, doc.spans, doc.defaultStyle]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    let range: Range | null = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if ((document as any).caretPositionFromPoint) {
      const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    if (range && range.startContainer) {
      let node: Node | null = range.startContainer;
      let sliceStart = -1;
      while (node && node !== livePreviewRef.current) {
        if (node instanceof HTMLElement && node.hasAttribute('data-slice-start')) {
          sliceStart = parseInt(node.getAttribute('data-slice-start') || '0', 10);
          break;
        }
        node = node.parentNode;
      }

      if (sliceStart !== -1) {
        const textOffset = range.startOffset;
        const targetIndex = sliceStart + textOffset;
        const clampedIndex = Math.max(0, Math.min(doc.content.length, targetIndex));
        
        setCursorPos(clampedIndex);
        setSelection({ start: clampedIndex, end: clampedIndex, text: '' });
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(clampedIndex, clampedIndex);
        }
        e.preventDefault();
      }
    }
  };

  // Sync selection on global selectionchange events
  useEffect(() => {
    const handleDocumentSelectionChange = () => {
      if (document.activeElement === textareaRef.current) {
        updateSelectionFromDOM();
      }
    };
    document.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [updateSelectionFromDOM]);

  // Scroll Indicator State & Ref
  const scrollThumbRef = useRef<HTMLDivElement | null>(null);
  const [isScrollable, setIsScrollable] = useState<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const updateScrollIndicator = useCallback(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const scrollable = scrollHeight > clientHeight;
    setIsScrollable(scrollable);
    if (scrollable && scrollThumbRef.current) {
      const thumbH = Math.max(30, (clientHeight / scrollHeight) * (clientHeight - 24));
      const maxScrollTop = scrollHeight - clientHeight;
      const scrollFraction = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
      const maxThumbTop = clientHeight - thumbH - 16;
      const thumbTop = 8 + scrollFraction * maxThumbTop;
      scrollThumbRef.current.style.height = `${thumbH}px`;
      scrollThumbRef.current.style.transform = `translateY(${thumbTop}px)`;
    }
  }, []);

  useEffect(() => {
    updateScrollIndicator();
    window.addEventListener('resize', updateScrollIndicator);
    return () => {
      window.removeEventListener('resize', updateScrollIndicator);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [doc.content, updateScrollIndicator]);

  const handleScroll = () => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const el = editorContainerRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const scrollable = scrollHeight > clientHeight;
      setIsScrollable(scrollable);

      if (scrollable && scrollThumbRef.current) {
        const thumbH = Math.max(30, (clientHeight / scrollHeight) * (clientHeight - 24));
        const maxScrollTop = scrollHeight - clientHeight;
        const scrollFraction = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
        const maxThumbTop = clientHeight - thumbH - 16;
        const thumbTop = 8 + scrollFraction * maxThumbTop;

        scrollThumbRef.current.style.height = `${thumbH}px`;
        scrollThumbRef.current.style.transform = `translateY(${thumbTop}px)`;
        scrollThumbRef.current.classList.remove('opacity-0');
        scrollThumbRef.current.classList.add('opacity-100');

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          if (scrollThumbRef.current) {
            scrollThumbRef.current.classList.remove('opacity-100');
            scrollThumbRef.current.classList.add('opacity-0');
          }
        }, 1000);
      }
    });
  };

  // Insert Text from Kashmiri Virtual Keyboard or Voice
  const handleInsertText = useCallback(
    (textToInsert: string) => {
      const activeStart = textareaRef.current ? textareaRef.current.selectionStart : cursorPos;
      const activeEnd = textareaRef.current ? textareaRef.current.selectionEnd : cursorPos;
      const isReplacingSelection = activeStart !== activeEnd;
      const insertStart = isReplacingSelection ? activeStart : activeStart;
      const insertEnd = isReplacingSelection ? activeEnd : activeStart;

      const before = doc.content.slice(0, insertStart);
      const after = doc.content.slice(insertEnd);
      const newContent = before + textToInsert + after;

      const deltaLength = textToInsert.length - (insertEnd - insertStart);
      const updatedSpans = shiftSpansOnTextChange(doc.spans || [], insertStart, deltaLength);

      const newPos = insertStart + textToInsert.length;
      setCursorPos(newPos);
      setSelection({ start: newPos, end: newPos, text: '' });

      onUpdateDocument({
        content: newContent,
        spans: updatedSpans,
      });
      pushHistory(newContent, updatedSpans);

      // Keep textarea focused and cursor synced without scrolling canvas up
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    },
    [cursorPos, doc.content, doc.spans, onUpdateDocument, pushHistory]
  );

  // Global Undo / Redo & Insert Event Listeners
  useEffect(() => {
    const onUndoEvent = () => handleUndo();
    const onRedoEvent = () => handleRedo();
    const onInsertCharEvent = (e: Event) => {
      const customEv = e as CustomEvent<{ char: string }>;
      if (customEv.detail?.char) {
        handleInsertText(customEv.detail.char);
      }
    };

    window.addEventListener('app-undo', onUndoEvent);
    window.addEventListener('app-redo', onRedoEvent);
    window.addEventListener('app-insert-char', onInsertCharEvent);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('app-undo', onUndoEvent);
      window.removeEventListener('app-redo', onRedoEvent);
      window.removeEventListener('app-insert-char', onInsertCharEvent);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleUndo, handleRedo, handleInsertText]);

  // Backspace key
  const handleBackspace = useCallback(() => {
    const activeStart = textareaRef.current ? textareaRef.current.selectionStart : cursorPos;
    const activeEnd = textareaRef.current ? textareaRef.current.selectionEnd : cursorPos;

    if (activeStart !== activeEnd) {
      // Delete exact selected arbitrary range
      const before = doc.content.slice(0, activeStart);
      const after = doc.content.slice(activeEnd);
      const newContent = before + after;
      const deltaLength = -(activeEnd - activeStart);
      const updatedSpans = shiftSpansOnTextChange(doc.spans || [], activeStart, deltaLength);

      setCursorPos(activeStart);
      setSelection({ start: activeStart, end: activeStart, text: '' });

      onUpdateDocument({
        content: newContent,
        spans: updatedSpans,
      });
      pushHistory(newContent, updatedSpans);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(activeStart, activeStart);
        }
      }, 0);
    } else if (activeStart > 0) {
      // Delete 1 character before cursor
      const deletePos = activeStart - 1;
      const before = doc.content.slice(0, deletePos);
      const after = doc.content.slice(activeStart);
      const newContent = before + after;
      const updatedSpans = shiftSpansOnTextChange(doc.spans || [], deletePos, -1);

      setCursorPos(deletePos);
      setSelection({ start: deletePos, end: deletePos, text: '' });

      onUpdateDocument({
        content: newContent,
        spans: updatedSpans,
      });
      pushHistory(newContent, updatedSpans);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(deletePos, deletePos);
        }
      }, 0);
    }
  }, [cursorPos, doc.content, doc.spans, onUpdateDocument, pushHistory]);

  const getParagraphIndicesForRange = (content: string, start: number, end: number): number[] => {
    const lines = content.split('\n');
    let currentPos = 0;
    const indices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length;
      const lineStart = currentPos;
      const lineEnd = currentPos + lineLen;
      if (start === end) {
        if (start >= lineStart && start <= lineEnd) {
          indices.push(i);
          break;
        }
      } else {
        if (lineEnd >= start && lineStart <= end) {
          indices.push(i);
        }
      }
      currentPos = lineEnd + 1;
    }
    if (indices.length === 0 && lines.length > 0) {
      indices.push(lines.length - 1);
    }
    return indices;
  };

  const getCurrentParagraphFormat = useCallback((): ParagraphFormat => {
    const start = selection.start !== selection.end ? selection.start : cursorPos;
    const paraIndices = getParagraphIndicesForRange(doc.content, start, start);
    const idx = paraIndices[0] || 0;
    return (doc.paragraphFormats && doc.paragraphFormats[idx]) || { direction: 'rtl', type: 'normal', indent: 0 };
  }, [cursorPos, doc.content, doc.paragraphFormats, selection]);

  const handleApplyParagraphFormat = useCallback(
    (updates: Partial<ParagraphFormat>) => {
      const start = selection.start !== selection.end ? selection.start : cursorPos;
      const end = selection.start !== selection.end ? selection.end : cursorPos;
      const paraIndices = getParagraphIndicesForRange(doc.content, start, end);

      const updatedFormats = { ...(doc.paragraphFormats || {}) };
      for (const idx of paraIndices) {
        const existing = updatedFormats[idx] || { direction: 'rtl', type: 'normal', indent: 0 };
        updatedFormats[idx] = {
          ...existing,
          ...updates,
        };
      }

      onUpdateDocument({
        paragraphFormats: updatedFormats,
      });
      pushHistory(doc.content, doc.spans || []);
    },
    [cursorPos, doc.content, doc.paragraphFormats, doc.spans, onUpdateDocument, pushHistory, selection]
  );

  const handleToggleChecklist = useCallback(
    (paraIndex: number, checked: boolean) => {
      const updatedFormats = { ...(doc.paragraphFormats || {}) };
      const existing = updatedFormats[paraIndex] || { direction: 'rtl', type: 'checklist', indent: 0 };
      updatedFormats[paraIndex] = {
        ...existing,
        type: 'checklist',
        checked,
      };
      onUpdateDocument({
        paragraphFormats: updatedFormats,
      });
      pushHistory(doc.content, doc.spans || []);
    },
    [doc.content, doc.paragraphFormats, doc.spans, onUpdateDocument, pushHistory]
  );

  const paragraphsData = useMemo(() => {
    const content = doc.content;
    const lines = content.split('\n');
    let currentPos = 0;
    return lines.map((line, idx) => {
      const start = currentPos;
      const end = currentPos + line.length;
      currentPos = end + 1;
      const format = (doc.paragraphFormats && doc.paragraphFormats[idx]) || {
        direction: 'rtl',
        type: 'normal',
        indent: 0,
      };
      return {
        index: idx,
        text: line,
        start,
        end,
        format,
      };
    });
  }, [doc.content, doc.paragraphFormats]);

  const isMultiPage = canvasConfig.aspectRatio === 'auto' || canvasConfig.aspectRatio === 'a4';
  const pagesData = useMemo(() => {
    if (!isMultiPage) {
      return [paragraphsData];
    }
    const maxCharsPerPage = 850;
    const pages: typeof paragraphsData[] = [];
    let currentPage: typeof paragraphsData = [];
    let currentChars = 0;

    for (const para of paragraphsData) {
      const paraLen = Math.max(1, para.text.length);
      if (currentPage.length > 0 && (currentChars + paraLen > maxCharsPerPage || currentPage.length >= 10)) {
        pages.push(currentPage);
        currentPage = [para];
        currentChars = paraLen;
      } else {
        currentPage.push(para);
        currentChars += paraLen;
      }
    }
    if (currentPage.length > 0 || pages.length === 0) {
      pages.push(currentPage);
    }
    return pages;
  }, [paragraphsData, isMultiPage]);

  const numberedListIndices = useMemo(() => {
    const map: { [paraIdx: number]: number } = {};
    let currentSeq = 0;
    paragraphsData.forEach((p, idx) => {
      if (p.format.type === 'numbered') {
        currentSeq += 1;
        map[idx] = currentSeq;
      } else {
        currentSeq = 0;
      }
    });
    return map;
  }, [paragraphsData]);

  const getSlicesForParagraph = (slices: any[], pStart: number, pEnd: number) => {
    const paraSlices: any[] = [];
    const contentLen = doc.content.length;
    const hasSel = selection && selection.start !== selection.end && selection.start < selection.end;
    const validCursor = !hasSel && cursorPos !== undefined && cursorPos >= 0 && cursorPos <= contentLen ? cursorPos : -1;

    for (const s of slices) {
      if (s.end <= pStart || s.start >= pEnd) continue;
      const sliceStart = Math.max(s.start, pStart);
      const sliceEnd = Math.min(s.end, pEnd);
      if (sliceStart >= sliceEnd) continue;
      const subText = s.text.slice(sliceStart - s.start, sliceEnd - s.start);

      const hasCaretAtStart = !hasSel && validCursor === sliceStart && sliceStart !== contentLen;
      const hasCaretAtEnd = !hasSel && validCursor === sliceEnd && sliceEnd === contentLen;

      paraSlices.push({
        ...s,
        text: subText,
        start: sliceStart,
        end: sliceEnd,
        hasCaretAtStart,
        hasCaretAtEnd,
      });
    }
    return paraSlices;
  };

  // Enter key (Newline with paragraph formatting continuation)
  const handleEnter = useCallback(() => {
    const activeStart = textareaRef.current ? textareaRef.current.selectionStart : cursorPos;
    const activeEnd = textareaRef.current ? textareaRef.current.selectionEnd : cursorPos;
    const start = activeStart !== activeEnd ? activeStart : activeStart;

    const before = doc.content.slice(0, start);
    const after = doc.content.slice(activeEnd);
    const newContent = before + '\n' + after;

    const paraIndices = getParagraphIndicesForRange(doc.content, start, start);
    const currentParaIdx = paraIndices[0] || 0;
    const currentFormat = doc.paragraphFormats?.[currentParaIdx];

    const updatedParagraphFormats = { ...(doc.paragraphFormats || {}) };
    const shiftedFormats: { [key: number]: ParagraphFormat } = {};
    Object.keys(updatedParagraphFormats).forEach((kStr) => {
      const k = parseInt(kStr, 10);
      if (k > currentParaIdx) {
        shiftedFormats[k + 1] = updatedParagraphFormats[k];
      } else {
        shiftedFormats[k] = updatedParagraphFormats[k];
      }
    });

    const lines = doc.content.split('\n');
    const currentLineText = lines[currentParaIdx] || '';

    if (currentLineText.trim() === '' && currentFormat && currentFormat.type && currentFormat.type !== 'normal') {
      shiftedFormats[currentParaIdx] = {
        ...currentFormat,
        type: 'normal',
        indent: 0,
      };
      shiftedFormats[currentParaIdx + 1] = {
        direction: currentFormat.direction || 'rtl',
        type: 'normal',
        indent: 0,
      };
    } else if (currentFormat && currentFormat.type && currentFormat.type !== 'normal') {
      shiftedFormats[currentParaIdx + 1] = {
        ...currentFormat,
        checked: currentFormat.type === 'checklist' ? false : undefined,
      };
    } else {
      if (currentFormat) {
        shiftedFormats[currentParaIdx + 1] = {
          direction: currentFormat.direction,
          indent: currentFormat.indent,
          type: 'normal',
        };
      }
    }

    const deltaLength = 1;
    const updatedSpans = shiftSpansOnTextChange(doc.spans || [], start, deltaLength);
    const newPos = start + 1;

    setCursorPos(newPos);
    setSelection({ start: newPos, end: newPos, text: '' });

    onUpdateDocument({
      content: newContent,
      spans: updatedSpans,
      paragraphFormats: shiftedFormats,
    });
    pushHistory(newContent, updatedSpans);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [cursorPos, doc.content, doc.paragraphFormats, doc.spans, onUpdateDocument, pushHistory]);

  // Cursor Move (Left / Right)
  const handleMoveCursor = useCallback(
    (direction: 'left' | 'right') => {
      const currentPos = textareaRef.current ? textareaRef.current.selectionStart : cursorPos;
      let newPos = currentPos;
      if (direction === 'left') {
        newPos = Math.min(doc.content.length, currentPos + 1);
      } else {
        newPos = Math.max(0, currentPos - 1);
      }
      setCursorPos(newPos);
      setSelection({ start: newPos, end: newPos, text: '' });
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    },
    [cursorPos, doc.content.length]
  );

  // Formatting Application to EXACT Selection Range
  const handleUpdateStyle = (styleDiff: Partial<TextStyleProperties>) => {
    const updatedBase = { ...activeFormatting, ...styleDiff };
    setActiveFormatting(updatedBase);

    if (selection.start !== selection.end) {
      const selStart = selection.start;
      const selEnd = selection.end;
      // User has selected an exact arbitrary range
      const updatedSpans = applyStyleToRange(
        doc.content.length,
        doc.spans || [],
        selStart,
        selEnd,
        styleDiff
      );

      onUpdateDocument({ spans: updatedSpans });
      pushHistory(doc.content, updatedSpans);

      // Re-focus and preserve selection in textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(selStart, selEnd);
          setSelection({
            start: selStart,
            end: selEnd,
            text: doc.content.substring(selStart, selEnd),
          });
        }
      }, 10);
    } else {
      // Update document default style
      onUpdateDocument({
        defaultStyle: updatedBase,
      });
    }
  };

  const handleClearFormatting = () => {
    if (selection.start !== selection.end) {
      const selStart = selection.start;
      const selEnd = selection.end;
      const updatedSpans = clearFormattingInRange(
        doc.content.length,
        doc.spans || [],
        selStart,
        selEnd
      );
      onUpdateDocument({ spans: updatedSpans });
      pushHistory(doc.content, updatedSpans);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(selStart, selEnd);
          setSelection({
            start: selStart,
            end: selEnd,
            text: doc.content.substring(selStart, selEnd),
          });
        }
      }, 10);
    } else {
      onUpdateDocument({
        spans: [],
        defaultStyle: DEFAULT_TEXT_STYLE,
      });
      setActiveFormatting(DEFAULT_TEXT_STYLE);
    }
  };



  // Search & Replace
  const handleSearch = (term: string) => {
    setSearchQuery(term);
    if (!term.trim()) {
      setMatchCount(0);
      return;
    }
    const regex = new RegExp(term, 'gi');
    const matches = doc.content.match(regex);
    setMatchCount(matches ? matches.length : 0);
  };

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;
    const newContent = doc.content.split(searchQuery).join(replaceQuery);
    onUpdateDocument({ content: newContent, spans: [] });
    pushHistory(newContent, []);
    setMatchCount(0);
  };

  // Word & Character count metrics
  const charCount = doc.content.length;
  const wordCount = doc.content.trim() ? doc.content.trim().split(/\s+/).length : 0;
  const lineCount = doc.content ? doc.content.split('\n').length : 1;

  // Rendered slices for rich WYSIWYG preview with live selection highlighting and caret
  const renderedSlices = buildRenderedSlices(
    doc.content,
    doc.spans || [],
    doc.defaultStyle || DEFAULT_TEXT_STYLE,
    selection,
    cursorPos
  );

  return (
    <div
      id="kashmiri-editor-workspace"
      className="flex-1 w-full flex flex-col bg-transparent overflow-hidden relative"
    >
      {/* Search and Replace Floating Bar */}
      {showSearch && (
        <div
          id="editor-search-bar"
          className="w-full bg-white border-b border-stone-200 p-2 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 z-20"
          dir="rtl"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
            <Search size={16} className="text-emerald-700 shrink-0" />
            <input
              type="text"
              placeholder="لَفْظ ژھارِو (Find)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-white border border-stone-200 focus:border-emerald-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-nastaliq flex-1 text-stone-900 focus:outline-hidden"
            />
            <input
              type="text"
              placeholder="بدل لفظ (Replace)..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-white border border-stone-200 focus:border-emerald-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-nastaliq flex-1 text-stone-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {searchQuery && (
              <span className="text-xs font-sans text-stone-500">
                {matchCount} ملنے
              </span>
            )}
            <button
              type="button"
              onClick={handleReplaceAll}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-nastaliq font-bold active:scale-95 transition-colors cursor-pointer shadow-xs"
            >
              سارنی بدلِو
            </button>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Editor Document Subheader & Tools */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-2 bg-white border-b border-stone-200 flex items-center justify-between gap-2 sm:gap-3 z-10 shrink-0">
        {/* Document Title Input */}
        <input
          type="text"
          value={doc.title}
          onChange={(e) => onUpdateDocument({ title: e.target.value })}
          placeholder="عنوان (Title)..."
          className="bg-transparent font-nastaliq text-base sm:text-lg font-bold text-stone-900 focus:outline-hidden max-w-[150px] sm:max-w-[240px] md:max-w-md truncate text-right border-b border-transparent hover:border-stone-300 focus:border-emerald-600 transition-colors"
          dir="rtl"
        />

        {/* Quick Utility Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Metrics Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs font-sans text-stone-600 bg-stone-50 px-3 py-1 rounded-md border border-stone-200">
            <span>{wordCount} الفاظ</span>
            <span>•</span>
            <span>{charCount} حروف</span>
            <span>•</span>
            <span>{lineCount} لٲنہِ</span>
          </div>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 sm:p-2 rounded-lg text-stone-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 transition-colors cursor-pointer"
            title="Undo (واپس / Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="p-1.5 sm:p-2 rounded-lg text-stone-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 transition-colors cursor-pointer"
            title="Redo (دوبارہ / Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>

          {/* Search Toggle */}
          <button
            id="search-toggle-btn"
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showCanvasPanel) setShowCanvasPanel(false);
            }}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
              showSearch
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'text-stone-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 border-stone-200 hover:border-emerald-200'
            }`}
            title="Find and Replace"
          >
            <Search size={15} />
          </button>

          {/* Canvas Ratio, Color & Image Toggle */}
          <button
            id="canvas-quick-toggle-btn"
            type="button"
            onClick={() => {
              setShowCanvasPanel(!showCanvasPanel);
              if (showSearch) setShowSearch(false);
              if (showFormattingToolbar) setShowFormattingToolbar(false);
            }}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-nastaliq cursor-pointer ${
              showCanvasPanel
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'text-stone-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 border-stone-200 hover:border-emerald-200'
            }`}
            title="Canvas Ratio, Background Color & Image (کینوس سیٹنگز)"
          >
            <Layout size={14} />
            <span className="hidden sm:inline">کینوس</span>
          </button>

          {/* Formatting & Paragraph Toolbar Toggle (Setting Icon) */}
          <button
            id="formatting-toolbar-toggle-btn"
            type="button"
            onClick={() => {
              setShowFormattingToolbar(!showFormattingToolbar);
              if (showCanvasPanel) setShowCanvasPanel(false);
              if (showSearch) setShowSearch(false);
            }}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-nastaliq cursor-pointer ${
              showFormattingToolbar
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'text-stone-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 border-stone-200 hover:border-emerald-200'
            }`}
            title="Formatting & Paragraph Tools (ٹیکسٹ و پیراگراف فارمیٹنگ)"
          >
            <Settings size={14} />
            <span className="hidden sm:inline font-sans">ٹولز</span>
          </button>
        </div>
      </div>

      {/* Canvas Settings Sub-panel (when toggled from subheader) */}
      {showCanvasPanel && (
        <div className="w-full border-b border-stone-200 shadow-xs z-10">
          <CanvasSettingsPanel
            canvasConfig={canvasConfig}
            onUpdateCanvasConfig={handleUpdateCanvasConfig}
            onClose={() => setShowCanvasPanel(false)}
          />
        </div>
      )}

      {/* Unified Office-style Paragraph & Text Formatting Toolbar Bar */}
      {showFormattingToolbar && (
        <div className="w-full bg-white border-b border-stone-200 px-3 py-2 flex items-center gap-3 overflow-x-auto custom-scrollbar shrink-0 z-10 animate-in slide-in-from-top-2 shadow-xs" dir="rtl">
          <ParagraphToolbar
            currentFormat={getCurrentParagraphFormat()}
            onApplyFormat={handleApplyParagraphFormat}
          />
          <div className="w-px h-6 bg-stone-200 shrink-0 mx-1" />
          <EditorToolbar
            currentStyle={activeFormatting}
            onUpdateStyle={handleUpdateStyle}
            onClearFormatting={handleClearFormatting}
            onInsertLineBreak={handleEnter}
            selectionCount={selection.end - selection.start}
            isSelectionActive={selection.start !== selection.end}
          />
        </div>
      )}

      {/* Main Focused Text Writing & Reading Area */}
      <div
        ref={editorContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full relative overflow-y-auto custom-scrollbar p-3 sm:p-6 md:p-8 bg-stone-50 flex flex-col items-center justify-start cursor-text"
        onClick={() => {
          setIsFocusedWritingMode(true);
          textareaRef.current?.focus();
        }}
      >
        {/* Auto-appearing Vertical Scroll Indicator on Right Edge */}
        {isScrollable && (
          <div className="absolute right-2 top-3 bottom-3 w-1.5 pointer-events-none z-30 flex flex-col items-center">
            <div
              ref={scrollThumbRef}
              className="w-1.5 rounded-full bg-emerald-600/70 shadow-xs transition-opacity duration-300 opacity-0 absolute top-0"
            />
          </div>
        )}
        <div
          id="kashmiri-canvas-document-sheet"
          className={`w-full mx-auto relative rounded-xl border border-stone-200 transition-all overflow-hidden flex flex-col justify-start shadow-xs box-border ${getRatioClasses(
            canvasConfig.aspectRatio
          )}`}
          style={{
            backgroundColor: canvasConfig.color || '#ffffff',
            aspectRatio: canvasConfig.aspectRatio === '1:1' ? '1 / 1'
              : canvasConfig.aspectRatio === '4:5' ? '4 / 5'
              : canvasConfig.aspectRatio === '9:16' ? '9 / 16'
              : canvasConfig.aspectRatio === '16:9' ? '16 / 9'
              : canvasConfig.aspectRatio === '3:4' ? '3 / 4'
              : canvasConfig.aspectRatio === 'a4' ? '1 / 1.414'
              : undefined,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsFocusedWritingMode(true);
            textareaRef.current?.focus();
          }}
        >
          {/* Permanent Unremovable Watermark at Footer */}
          <div className="absolute bottom-3 inset-x-0 pointer-events-none select-none flex items-center justify-center z-20">
            <div className="font-nastaliq text-stone-400/70 text-xs sm:text-sm tracking-wide whitespace-nowrap">
              عمران مغلو | کٲشُر لیٚکھُن
            </div>
          </div>

          {/* Optional Background Image / Gradient Layer */}
          {canvasConfig.image && (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity"
              style={{
                backgroundImage: canvasConfig.image.startsWith('linear-gradient')
                  ? canvasConfig.image
                  : `url(${canvasConfig.image})`,
                opacity: canvasConfig.imageOpacity ?? 1,
              }}
            />
          )}

          {/* Optional Readability Overlay Layer */}
          {canvasConfig.overlayOpacity && canvasConfig.overlayOpacity > 0 ? (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity"
              style={{
                backgroundColor: canvasConfig.overlayColor || '#000000',
                opacity: canvasConfig.overlayOpacity,
              }}
            />
          ) : null}

          {/* Real-time Rendered Formatted Slices (WYSIWYG View layered seamlessly) */}
          <div className={`relative z-10 w-full h-full flex flex-col p-5 sm:p-8 md:p-10 box-border overflow-y-auto overflow-x-hidden ${
            doc.defaultStyle.verticalAlign === 'center'
              ? 'justify-center'
              : doc.defaultStyle.verticalAlign === 'bottom'
              ? 'justify-end'
              : 'justify-start'
          }`}>
            <div
              ref={livePreviewRef}
              id="kashmiri-rendered-text-preview"
              className="w-full select-text font-nastaliq text-stone-900 transition-all duration-75 whitespace-pre-wrap break-words"
              dir="rtl"
              onPointerDown={handleCanvasPointerDown}
              style={{
                fontSize: `${doc.defaultStyle.fontSize}px`,
                lineHeight: doc.defaultStyle.lineHeight,
                letterSpacing: `${doc.defaultStyle.letterSpacing}px`,
                textAlign: doc.defaultStyle.align,
              }}
            >
              {paragraphsData.map((para) => {
                const fmt = para.format;
                const paraSlices = getSlicesForParagraph(renderedSlices, para.start, para.end);
                const dir = fmt.direction || doc.defaultStyle.direction || 'rtl';
                const indentLevel = fmt.indent || 0;
                const indentStyle = dir === 'rtl' ? { paddingRight: `${indentLevel * 24}px` } : { paddingLeft: `${indentLevel * 24}px` };

                return (
                  <div
                    key={`para-${para.index}`}
                    className={`relative flex items-start gap-2 my-1 ${
                      fmt.type === 'quote'
                        ? 'border-r-4 border-emerald-600 bg-emerald-50/40 px-3 py-2 rounded-l-md'
                        : ''
                    }`}
                    style={{
                      direction: dir,
                      textAlign: doc.defaultStyle.align || (dir === 'ltr' ? 'left' : 'right'),
                      ...indentStyle,
                    }}
                  >
                    {fmt.type === 'bullet' && (
                      <span className="select-none text-emerald-600 font-bold shrink-0 px-1">•</span>
                    )}
                    {fmt.type === 'numbered' && (
                      <span className="select-none text-emerald-600 font-bold shrink-0 text-xs sm:text-sm font-sans">
                        {numberedListIndices[para.index] || 1}.
                      </span>
                    )}
                    {fmt.type === 'checklist' && (
                      <input
                        type="checkbox"
                        checked={!!fmt.checked}
                        onChange={(e) => handleToggleChecklist(para.index, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 text-emerald-600 border-stone-300 rounded-xs focus:ring-emerald-500 cursor-pointer shrink-0 pointer-events-auto"
                      />
                    )}
                    {fmt.type === 'quote' && (
                      <span className="select-none text-emerald-600/70 font-serif text-lg shrink-0 leading-none">“</span>
                    )}

                    <div className="flex-1 whitespace-pre-wrap break-words">
                      {paraSlices.length > 0 ? (
                        paraSlices.map((slice, sIdx) => {
                          const isSel = !!slice.isSelected;
                          const fontFam = getFontFamilyCSS(slice.style.fontFamily);

                          return (
                            <span
                              key={`slice-${slice.start}-${slice.end}-${sIdx}`}
                              data-slice-start={slice.start}
                              className={`transition-all duration-75 inline whitespace-pre-wrap break-words ${
                                isSel ? 'bg-blue-600 text-white rounded-xs shadow-sm ring-1 ring-blue-400/60' : ''
                              }`}
                              style={{
                                fontFamily: fontFam,
                                fontSize: `${slice.style.fontSize}px`,
                                fontWeight: slice.style.bold ? 'bold' : 'normal',
                                fontStyle: slice.style.italic ? 'italic' : 'normal',
                                textDecoration: slice.style.underline ? 'underline' : 'none',
                                color: isSel ? '#ffffff' : slice.style.color,
                                backgroundColor: isSel ? '#2563eb' : slice.style.highlightColor || 'transparent',
                                letterSpacing: `${slice.style.letterSpacing}px`,
                                textShadow: isSel
                                  ? 'none'
                                  : slice.style.shadowColor
                                  ? `${slice.style.shadowOffsetX || 0}px ${slice.style.shadowOffsetY || 2}px ${slice.style.shadowBlur || 4}px ${slice.style.shadowColor}`
                                  : 'none',
                                opacity: isSel ? 1 : slice.style.opacity,
                                padding: isSel ? '0 2px' : '0',
                                margin: isSel ? '0 -1px' : '0',
                              }}
                            >
                              {slice.hasCaretAtStart && (
                                <span className="inline-block w-0.5 bg-blue-600 animate-pulse h-[1.2em] align-middle -mx-px z-20" />
                              )}
                              {slice.text}
                              {slice.hasCaretAtEnd && (
                                <span className="inline-block w-0.5 bg-blue-600 animate-pulse h-[1.2em] align-middle -mx-px z-20" />
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <span className="opacity-0">.</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {doc.content.length === 0 && (
                <span className="flex items-center gap-1.5 text-stone-400 font-nastaliq text-xl">
                  <span className="inline-block w-0.5 bg-blue-600 animate-pulse h-[1.2em] align-middle" />
                  <span>کٲشُر ہیٚچھِو تہٕ لؠکھِو</span>
                </span>
              )}
            </div>

            {/* Native Text Input and Selection Overlay with inputMode control */}
            <textarea
              ref={textareaRef}
              id="kashmiri-native-textarea"
              value={doc.content}
              inputMode={keyboardMode === 'phone' ? 'text' : 'none'}
              onClick={() => {
                updateSelectionFromDOM();
              }}
              onChange={(e) => {
                const newContent = e.target.value;
                const deltaLength = newContent.length - doc.content.length;
                const changePos = e.target.selectionStart - (deltaLength > 0 ? deltaLength : 0);
                const updatedSpans = shiftSpansOnTextChange(doc.spans || [], changePos, deltaLength);

                onUpdateDocument({
                  content: newContent,
                  spans: updatedSpans,
                });
                pushHistory(newContent, updatedSpans);
                updateSelectionFromDOM();
              }}
              onSelect={updateSelectionFromDOM}
              onKeyUp={updateSelectionFromDOM}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keyboardMode === 'virtual') {
                  // Handle Enter on physical keyboard when in virtual mode
                  e.preventDefault();
                  handleEnter();
                  return;
                }
                updateSelectionFromDOM();
              }}
              onPointerDown={() => {
                updateSelectionFromDOM();
              }}
              onPointerUp={updateSelectionFromDOM}
              onMouseDown={updateSelectionFromDOM}
              onMouseUp={updateSelectionFromDOM}
              onTouchStart={() => {
                updateSelectionFromDOM();
              }}
              onTouchEnd={updateSelectionFromDOM}
              onFocus={() => {
                updateSelectionFromDOM();
              }}
              dir="rtl"
              rows={8}
              className="absolute inset-0 w-full h-full opacity-0 text-transparent caret-emerald-600 bg-transparent resize-none border-none outline-hidden p-5 sm:p-8 md:p-10 font-nastaliq cursor-text selection:bg-emerald-600 selection:text-white whitespace-pre-wrap break-words"
              style={{
                fontSize: `${doc.defaultStyle.fontSize}px`,
                lineHeight: doc.defaultStyle.lineHeight,
                letterSpacing: `${doc.defaultStyle.letterSpacing}px`,
                textAlign: doc.defaultStyle.align,
              }}
              placeholder=""
              autoFocus
            />
          </div>
        </div>

        {/* Small Keyboard Icon with KS / ENG below the Canvas */}
        <div className="w-full flex items-center justify-center pt-3.5 pb-1 z-10 shrink-0 select-none">
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-stone-200 shadow-xs rounded-full">
            <button
              id="btn-activate-kashmiri-kb"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowKeyboard(true);
                setKeyboardMode('virtual');
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                showKeyboard && keyboardMode === 'virtual'
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium'
              }`}
              title="کٲشُر کیبورڈ چالو کٔرِو (Activate Kashmiri Virtual Keyboard)"
            >
              <Keyboard size={14} className={showKeyboard && keyboardMode === 'virtual' ? 'text-white' : 'text-emerald-600'} />
              <span className="font-sans font-medium text-xs">KS</span>
            </button>

            <div className="w-px h-3.5 bg-stone-200" />

            <button
              id="btn-activate-eng-kb"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setKeyboardMode('phone');
                setShowKeyboard(false);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                keyboardMode === 'phone' || !showKeyboard
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium'
              }`}
              title="انگریزی / نیٹو کیبورڈ (Switch to English / Native Keyboard)"
            >
              <span className="font-sans font-medium text-xs">ENG</span>
            </button>
          </div>
        </div>
      </div>



      {/* Kashmiri Virtual Keyboard (Only opens virtual keyboard by default) */}
      {showKeyboard && keyboardMode === 'virtual' && (
        <KashmiriKeyboard
          onInsertText={handleInsertText}
          onBackspace={handleBackspace}
          onEnter={handleEnter}
          onMoveCursor={handleMoveCursor}
          onCloseKeyboard={() => setShowKeyboard(false)}
          onSwitchToPhoneKeyboard={() => {
            setKeyboardMode('phone');
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 50);
          }}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
      )}
    </div>
  );
};
