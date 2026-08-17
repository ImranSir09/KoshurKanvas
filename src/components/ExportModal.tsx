import React, { useState } from 'react';
import {
  exportElement,
  shareCanvasImage,
  copyTextToClipboard,
  downloadTextFile,
  downloadDocFile,
} from '../lib/exportEngine';
import { CanvasAspectRatio } from '../types';
import {
  X,
  Download,
  Share2,
  Copy,
  FileImage,
  FileText,
  Check,
  Sparkles,
  Loader2,
  FileCode,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId: string;
  projectTitle: string;
  rawUnicodeText: string;
  aspectRatio?: CanvasAspectRatio;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  targetElementId,
  projectTitle,
  rawUnicodeText,
  aspectRatio,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedTextSuccess, setCopiedTextSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (
    format: 'png' | 'jpeg' | 'pdf' | 'transparent_png',
    scale = 2
  ) => {
    const el = document.getElementById(targetElementId);
    if (!el) {
      setStatusMessage('Target writing container not found');
      return;
    }

    setIsExporting(true);
    setStatusMessage('فائل تیار گژھان چھِ...');

    try {
      await exportElement(el, {
        fileName: projectTitle
          ? `kashur-${projectTitle.replace(/\s+/g, '-')}`
          : 'kashur-writing',
        format,
        pixelRatio: scale,
        aspectRatio,
      });
      setStatusMessage('مَحفوظ سپُد (Export Successful)');
      setTimeout(() => {
        setIsExporting(false);
        setStatusMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatusMessage('ایکسپورٹ مَنٛز رکاوٹ (Export Failed)');
      setIsExporting(false);
    }
  };

  const handleDownloadTxt = () => {
    const fileName = projectTitle
      ? `kashur-${projectTitle.replace(/\s+/g, '-')}`
      : 'kashur-document';
    downloadTextFile(rawUnicodeText, fileName);
    setStatusMessage('ٹیکسٹ فائل ڈاؤنلوڈ سپٕژ (TXT downloaded)');
    setTimeout(() => setStatusMessage(null), 1500);
  };

  const handleDownloadDoc = () => {
    const fileName = projectTitle
      ? `kashur-${projectTitle.replace(/\s+/g, '-')}`
      : 'kashur-document';
    downloadDocFile(projectTitle, rawUnicodeText, fileName);
    setStatusMessage('ورڈ دستاویز ڈاؤنلوڈ سپُد (DOC downloaded)');
    setTimeout(() => setStatusMessage(null), 1500);
  };

  const handleShare = async () => {
    const el = document.getElementById(targetElementId);
    if (!el) return;
    setIsExporting(true);
    setStatusMessage('شیئرنگ خٲطرٕ تصویر تیار گژھان چھِ...');
    await shareCanvasImage(el, projectTitle, aspectRatio);
    setIsExporting(false);
    setStatusMessage(null);
  };

  const handleCopyText = async () => {
    const success = await copyTextToClipboard(rawUnicodeText);
    if (success) {
      setCopiedTextSuccess(true);
      setTimeout(() => setCopiedTextSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg max-h-[92vh] bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div>
              <h3 className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 leading-tight">
                ایکسپورٹ کٔرِو
              </h3>
              <p className="text-[11px] text-stone-500 font-sans leading-none mt-0.5">
                Export & Share Document
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="بَنٛد کٔرِو (Close)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {statusMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-nastaliq text-emerald-900 flex items-center justify-center gap-2">
              {isExporting && <Loader2 size={14} className="animate-spin text-emerald-700" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Image & PDF Formats */}
          <div>
            <span className="text-xs font-nastaliq font-bold text-stone-900 mb-2 block">
              تصویری و پی ڈی ایف فارمیٹس
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* PNG HD */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('png', 2)}
                className="p-3 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer active:scale-95 group shadow-2xs"
              >
                <FileImage size={20} className="text-emerald-700 group-hover:scale-105 transition-transform" />
                <span className="font-nastaliq text-xs font-bold text-stone-900">
                  پی این جی
                </span>
                <span className="text-[9px] text-stone-500 font-sans">HD Image</span>
              </button>

              {/* JPG Standard */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('jpeg', 2)}
                className="p-3 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer active:scale-95 group shadow-2xs"
              >
                <FileImage size={20} className="text-emerald-700 group-hover:scale-105 transition-transform" />
                <span className="font-nastaliq text-xs font-bold text-stone-900">
                  جے پی جی
                </span>
                <span className="text-[9px] text-stone-500 font-sans">JPG Photo</span>
              </button>

              {/* PDF Document */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('pdf', 2)}
                className="p-3 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer active:scale-95 group shadow-2xs"
              >
                <FileText size={20} className="text-emerald-700 group-hover:scale-105 transition-transform" />
                <span className="font-nastaliq text-xs font-bold text-stone-900">
                  پی ڈی ایف
                </span>
                <span className="text-[9px] text-stone-500 font-sans">PDF File</span>
              </button>

              {/* Transparent PNG */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('transparent_png', 2)}
                className="p-3 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer active:scale-95 group shadow-2xs"
              >
                <Sparkles size={20} className="text-emerald-700 group-hover:scale-105 transition-transform" />
                <span className="font-nastaliq text-xs font-bold text-stone-900">
                  شفاف پی این جی
                </span>
                <span className="text-[9px] text-stone-500 font-sans">Transparent</span>
              </button>
            </div>
          </div>

          {/* Text Files (.txt, .doc) */}
          <div>
            <span className="text-xs font-nastaliq font-bold text-stone-900 mb-2 block">
              ٹیکسٹ و دستاویز فائلز
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="p-3 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode size={18} className="text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-nastaliq text-xs sm:text-sm font-bold text-stone-900 block">
                      ٹیکسٹ فائل (.txt)
                    </span>
                    <span className="text-[9px] text-stone-500 font-sans">Plain UTF-8</span>
                  </div>
                </div>
                <Download size={14} className="text-stone-400" />
              </button>

              <button
                type="button"
                onClick={handleDownloadDoc}
                className="p-3 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className="text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-nastaliq text-xs sm:text-sm font-bold text-stone-900 block">
                      ورڈ فائل (.doc)
                    </span>
                    <span className="text-[9px] text-stone-500 font-sans">MS Word Doc</span>
                  </div>
                </div>
                <Download size={14} className="text-stone-400" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={isExporting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-nastaliq text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs"
            >
              <Share2 size={15} />
              <span>شیئر کٔرِو (Share Writing)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="w-full py-2 px-4 bg-white hover:bg-emerald-50 text-stone-800 border border-stone-200 hover:border-emerald-300 rounded-xl font-nastaliq text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              {copiedTextSuccess ? (
                <Check size={14} className="text-emerald-700" />
              ) : (
                <Copy size={14} />
              )}
              <span>
                {copiedTextSuccess
                  ? 'یُونیکوڈ کاپی سپُد (Copied to Clipboard!)'
                  : 'یُونیکوڈ لَفظ کاپی کٔرِو (Copy Unicode Text)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
