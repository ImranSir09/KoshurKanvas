import React, { useState, useEffect, useCallback } from 'react';
import {
  KashurDocument
} from './types';
import {
  getAllDocuments,
  saveDocument,
  deleteDocument,
  INITIAL_DOCUMENT
} from './lib/storage';
import { DEFAULT_TEXT_STYLE } from './lib/kashmiriData';
import { Header } from './components/Header';
import { KashmiriEditor } from './components/KashmiriEditor';
import { CharacterPickerModal } from './components/CharacterPickerModal';
import { ExportModal } from './components/ExportModal';
import { ProjectsDrawer } from './components/ProjectsDrawer';

export default function App() {
  // Data State
  const [documents, setDocuments] = useState<KashurDocument[]>([INITIAL_DOCUMENT]);
  const [currentDoc, setCurrentDoc] = useState<KashurDocument>(INITIAL_DOCUMENT);

  // Modals state
  const [isCharPickerOpen, setIsCharPickerOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFocusedWritingMode, setIsFocusedWritingMode] = useState<boolean>(true);

  // Enforce pure white light mode independently of device OS/phone theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Load IndexedDB documents on mount
  useEffect(() => {
    async function loadData() {
      try {
        const docs = await getAllDocuments();
        if (docs.length > 0) {
          setDocuments(docs);
          setCurrentDoc(docs[0]);
        }
      } catch (err) {
        console.error('Error initializing storage:', err);
      }
    }
    loadData();
  }, []);

  // Update Document handler with auto-save
  const handleUpdateDocument = useCallback(
    (updatedFields: Partial<KashurDocument>) => {
      setCurrentDoc((prev) => {
        const nextDoc = {
          ...prev,
          ...updatedFields,
          updatedAt: Date.now(),
        };
        saveDocument(nextDoc);
        setDocuments((prevDocs) =>
          prevDocs.map((d) => (d.id === nextDoc.id ? nextDoc : d))
        );
        return nextDoc;
      });
    },
    []
  );

  // Create New Document
  const handleNewDocument = () => {
    const newDoc: KashurDocument = {
      id: `doc-${Date.now()}`,
      title: 'نواں کٲشُر مسودہ',
      content: '',
      spans: [],
      defaultStyle: DEFAULT_TEXT_STYLE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveDocument(newDoc);
    setDocuments((prev) => [newDoc, ...prev]);
    setCurrentDoc(newDoc);
  };

  // Delete Handlers
  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);
    if (currentDoc.id === id && remaining.length > 0) {
      setCurrentDoc(remaining[0]);
    }
  };

  // Insert character from picker into editor
  const handleInsertCharFromPicker = (char: string) => {
    // Trigger editor event for cursor-accurate insertion with undo history
    window.dispatchEvent(new CustomEvent('app-insert-char', { detail: { char } }));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-stone-900 overflow-hidden font-sans relative selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Application Header */}
      <Header
        currentDocTitle={currentDoc.title}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onNewDocument={handleNewDocument}
        onOpenCharacterPicker={() => setIsCharPickerOpen(true)}
      />

      {/* Main Kashmiri Writing & Typography Workspace */}
      <main className="flex-1 w-full flex flex-col overflow-hidden bg-white">
        <KashmiriEditor
          document={currentDoc}
          onUpdateDocument={handleUpdateDocument}
          onOpenCharacterPicker={() => setIsCharPickerOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          isFocusedWritingMode={isFocusedWritingMode}
          setIsFocusedWritingMode={setIsFocusedWritingMode}
        />
      </main>

      {/* Kashmiri Character & Glyph Guide Modal */}
      <CharacterPickerModal
        isOpen={isCharPickerOpen}
        onClose={() => setIsCharPickerOpen(false)}
        onInsertChar={handleInsertCharFromPicker}
      />

      {/* Writing Export Modal (PNG, PDF, SVG, TXT, DOC) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        targetElementId="kashmiri-canvas-document-sheet"
        projectTitle={currentDoc.title || 'کٲشُر مسودہ'}
        rawUnicodeText={currentDoc.content}
        aspectRatio={currentDoc.canvasConfig?.aspectRatio || 'auto'}
      />

      {/* Documents & Drafts Drawer */}
      <ProjectsDrawer
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        documents={documents}
        currentDocId={currentDoc.id}
        onSelectDocument={(doc) => setCurrentDoc(doc)}
        onNewDocument={handleNewDocument}
        onDeleteDocument={handleDeleteDocument}
      />
    </div>
  );
}

