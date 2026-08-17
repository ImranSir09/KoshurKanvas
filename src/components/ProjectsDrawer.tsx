import React from 'react';
import { KashurDocument } from '../types';
import {
  X,
  FileText,
  Trash2,
  Plus,
  Calendar,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';

interface ProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: KashurDocument[];
  currentDocId: string;
  onSelectDocument: (doc: KashurDocument) => void;
  onNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
}

export const ProjectsDrawer: React.FC<ProjectsDrawerProps> = ({
  isOpen,
  onClose,
  documents,
  currentDocId,
  onSelectDocument,
  onNewDocument,
  onDeleteDocument,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
              <FolderOpen size={16} />
            </div>
            <div>
              <h3 className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 leading-tight">
                محفوظ مسودات
              </h3>
              <p className="text-[11px] text-stone-500 font-sans leading-none mt-0.5">
                Saved Documents & Drafts
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

        {/* Action / Count Bar */}
        <div className="px-4 py-2.5 sm:px-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2">
          <span className="text-xs font-nastaliq font-bold text-stone-600">
            کُل مسودات: {documents.length}
          </span>

          <button
            type="button"
            onClick={() => {
              onNewDocument();
              onClose();
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-nastaliq font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>نواں مسودہ (New)</span>
          </button>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 flex flex-col gap-2">
          {documents.length === 0 ? (
            <div className="py-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
              <FileText size={32} className="opacity-40" />
              <p className="font-nastaliq text-sm">کانٛہہ تہِ مسودہ مَحفوظ چھُنہٕ</p>
            </div>
          ) : (
            documents.map((doc) => {
              const isCurrent = doc.id === currentDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDocument(doc);
                    onClose();
                  }}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isCurrent
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                      : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  {/* Document Details */}
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                      )}
                      <h4 className="font-nastaliq text-sm sm:text-base font-bold text-stone-900 truncate">
                        {doc.title || 'بلا عنوان مسودہ'}
                      </h4>
                    </div>

                    <p className="font-nastaliq text-xs text-stone-500 truncate mt-1">
                      {doc.content.trim() || 'خٲلی مسودہ'}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-sans text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{doc.content.length} حروف</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {documents.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
                      title="مسودہ مٹاوِو (Delete)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
