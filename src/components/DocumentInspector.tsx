import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  Download,
  Printer,
  Trash2,
  Star,
  Shield,
  FileText,
  Tag,
  Folder as FolderIcon,
  Search,
  Edit3,
  Save,
  Clock,
  Sparkles,
  GitBranch,
  ArrowRight,
  Eye,
  CheckCircle2,
  Camera,
  History,
  FileType,
  Loader2
} from 'lucide-react';
import { ScannedDocument, Folder, DocumentVersion } from '../types/document';
import { convertDocumentToPDF } from '../utils/pdfGenerator';

interface DocumentInspectorProps {
  document: ScannedDocument | null;
  folders: Folder[];
  onClose: () => void;
  onUpdateDocument: (doc: ScannedDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onToggleStar: (docId: string) => void;
  onScanNewVersion: (doc: ScannedDocument) => void;
}

type InspectorTab = 'ocr' | 'entities' | 'versions' | 'security';

export const DocumentInspector: React.FC<DocumentInspectorProps> = ({
  document: doc,
  folders,
  onClose,
  onUpdateDocument,
  onDeleteDocument,
  onToggleStar,
  onScanNewVersion,
}) => {
  if (!doc) return null;

  const [activeTab, setActiveTab] = useState<InspectorTab>('ocr');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Inspected Version state: can inspect current or a historical version
  const [inspectedVersionNum, setInspectedVersionNum] = useState<number>(doc.currentVersion || 1);

  // Search inside OCR text
  const [inDocSearch, setInDocSearch] = useState<string>('');

  // Editable OCR text state
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [editableText, setEditableText] = useState<string>(doc.fullText || '');

  // Title and Folder editing
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>(doc.title);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(doc.folderId);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isSavingChanges, setIsSavingChanges] = useState<boolean>(false);

  // Sync state if doc changes
  React.useEffect(() => {
    setEditableText(doc.fullText || '');
    setEditedTitle(doc.title);
    setSelectedFolderId(doc.folderId);
    setInspectedVersionNum(doc.currentVersion || 1);
    setZoomLevel(1);
    setRotation(0);
    setIsEditingText(false);
    setIsEditingTitle(false);
  }, [doc.id, doc.currentVersion]);

  // Determine currently active inspected version object
  const versionsList = doc.versions && doc.versions.length > 0 ? doc.versions : [
    {
      versionNumber: 1,
      scannedAt: doc.scannedAt,
      changeNote: 'Initial scan version',
      fileName: doc.fileName,
      fileSizeBytes: doc.fileSizeBytes,
      imageUrl: doc.imageUrl,
      fullText: doc.fullText,
      summary: doc.summary,
      extractedFields: doc.extractedFields,
      confidenceScore: doc.confidenceScore,
      checksumSHA256: doc.cloudStorage.checksumSHA256,
      operator: 'User',
    } as DocumentVersion
  ];

  const currentViewedVersion = versionsList.find((v) => v.versionNumber === inspectedVersionNum) || versionsList[versionsList.length - 1];

  const handleCopyOCR = () => {
    navigator.clipboard.writeText(editableText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(currentViewedVersion.checksumSHA256 || doc.cloudStorage.checksumSHA256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadPdf = async (targetVer?: DocumentVersion) => {
    setIsGeneratingPdf(true);
    try {
      await convertDocumentToPDF(doc, targetVer || currentViewedVersion);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([editableText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${inspectedVersionNum}_OCR.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(doc, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title} (Version ${inspectedVersionNum}) - DocuVault</title>
          <style>
            body { font-family: monospace, sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-family: sans-serif; font-size: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
            pre { font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <h1>${doc.title} (Version ${inspectedVersionNum})</h1>
          <div class="meta">
            Folder: ${doc.folderName} | Type: ${doc.documentType} | Version: v${inspectedVersionNum}<br>
            Checksum: ${currentViewedVersion.checksumSHA256}
          </div>
          <pre>${editableText}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSaveTextEdits = async () => {
    setIsSavingChanges(true);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullText: editableText }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateDocument(updated);
        setIsEditingText(false);
      }
    } catch (err) {
      console.error('Failed to update text:', err);
    } finally {
      setIsSavingChanges(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateDocument(updated);
        setIsEditingTitle(false);
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const handleChangeFolder = async (newFolderId: string) => {
    setSelectedFolderId(newFolderId);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: newFolderId }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateDocument(updated);
      }
    } catch (err) {
      console.error('Failed to update folder:', err);
    }
  };

  const handleAddTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (doc.tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setNewTagInput('');
      return;
    }
    const updatedTags = [...doc.tags, trimmed];
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateDocument(updated);
        setNewTagInput('');
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = doc.tags.filter((t) => t !== tagToRemove);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateDocument(updated);
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  // Restore a historical version
  const handleRestoreVersion = async (verNum: number) => {
    if (!confirm(`Set Version ${verNum} as the active current version?`)) return;
    try {
      const response = await fetch(`/api/documents/${doc.id}/versions/${verNum}/restore`, {
        method: 'POST',
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateDocument(updated);
        setInspectedVersionNum(verNum);
      }
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  };

  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-emerald-500/30 text-emerald-200 px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-4">
          
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => onToggleStar(doc.id)}
              className="p-1 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
              title={doc.isStarred ? 'Unstar' : 'Star Document'}
            >
              <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-medium cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditedTitle(doc.title); setIsEditingTitle(false); }}
                  className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-white truncate">{doc.title}</h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title="Rename document"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Version Indicator Badge */}
            <button
              onClick={() => setActiveTab('versions')}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono cursor-pointer transition"
              title="Click to view Version History"
            >
              <GitBranch className="w-3 h-3" />
              <span>Version {inspectedVersionNum} of {doc.currentVersion || 1}</span>
            </button>

            {/* Folder selector */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
              <FolderIcon className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedFolderId}
                onChange={(e) => handleChangeFolder(e.target.value)}
                className="bg-transparent text-slate-300 hover:text-white border-0 text-xs focus:ring-0 cursor-pointer underline"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-800 text-white">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            
            {/* Scan New Version Button */}
            <button
              onClick={() => {
                onScanNewVersion(doc);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              title="Scan and upload an updated version of this document"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan New Version</span>
            </button>

            {/* Export / Convert to PDF button */}
            <button
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/60 text-xs font-medium transition cursor-pointer"
              title="Convert scan and OCR text to PDF file"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <FileType className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadTxt}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Download OCR Text (.txt)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${doc.title}" from cloud storage?`)) {
                  onDeleteDocument(doc.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition cursor-pointer"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Document Viewer */}
          <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60">
            
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">Viewing v{currentViewedVersion.versionNumber}</span>
                <span>·</span>
                <span>{(currentViewedVersion.fileSizeBytes / 1024).toFixed(0)} KB</span>
                {currentViewedVersion.versionNumber !== doc.currentVersion && (
                  <span className="text-amber-400">(Historical)</span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-slate-400 w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] text-slate-400"
                >
                  Reset
                </button>
                <div className="w-px h-3.5 bg-slate-800" />
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
                  title="Rotate 90 deg"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Image Canvas */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              <div
                className="transition-transform duration-150 origin-center flex items-center justify-center max-w-full"
                style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
              >
                <img
                  src={currentViewedVersion.imageUrl}
                  alt={`${doc.title} v${currentViewedVersion.versionNumber}`}
                  className="max-h-[620px] max-w-full object-contain rounded shadow-lg border border-slate-800"
                />
              </div>
            </div>

            {/* Tags footer */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 text-xs">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400 font-mono mr-1">Tags:</span>
                {doc.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-200 border border-slate-700/60"
                  >
                    <span>{t}</span>
                    <button onClick={() => handleRemoveTag(t)} className="text-slate-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="+ Tag..."
                  className="w-20 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-900">
            
            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-800 px-4 pt-2 gap-4 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setActiveTab('ocr')}
                className={`pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'ocr'
                    ? 'border-emerald-500 text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Searchable OCR Text</span>
              </button>

              <button
                onClick={() => setActiveTab('versions')}
                className={`pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'versions'
                    ? 'border-emerald-500 text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Version History ({versionsList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('entities')}
                className={`pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'entities'
                    ? 'border-emerald-500 text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extracted Entities</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-emerald-500 text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Cloud Security</span>
              </button>
            </div>

            {/* Tab 1: OCR Text */}
            {activeTab === 'ocr' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-800/80 bg-slate-800/30">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={inDocSearch}
                      onChange={(e) => setInDocSearch(e.target.value)}
                      placeholder="Search text in document..."
                      className="w-full pl-8 pr-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyOCR}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsEditingText(!isEditingText)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition cursor-pointer ${
                        isEditingText ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingText ? 'Editing' : 'Edit Text'}</span>
                    </button>

                    {isEditingText && (
                      <button
                        onClick={handleSaveTextEdits}
                        disabled={isSavingChanges}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-900/60 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
                  {isEditingText ? (
                    <textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="w-full h-full p-3 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                    />
                  ) : (
                    <div>{renderHighlightedText(editableText, inDocSearch)}</div>
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    Version {inspectedVersionNum} · Words: {editableText.split(/\s+/).filter(Boolean).length}
                  </span>
                  <span className="text-emerald-400 font-mono">Gemini Vision OCR Indexed</span>
                </div>
              </div>
            )}

            {/* Tab 2: Document Version History */}
            {activeTab === 'versions' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-400" />
                      <span>Revision & Change History</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All scanned iterations and amendments are preserved with cryptographic integrity hashes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onScanNewVersion(doc);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan Next Version</span>
                  </button>
                </div>

                {/* Vertical Version Timeline */}
                <div className="space-y-4">
                  {versionsList.slice().reverse().map((version) => {
                    const isCurrent = version.versionNumber === (doc.currentVersion || 1);
                    const isViewing = version.versionNumber === inspectedVersionNum;

                    return (
                      <div
                        key={version.versionNumber}
                        className={`p-4 rounded-xl border transition ${
                          isViewing
                            ? 'bg-emerald-950/20 border-emerald-500/70 shadow-sm'
                            : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-emerald-400">
                              Version {version.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ACTIVE REVISION
                              </span>
                            )}
                            {isViewing && !isCurrent && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                VIEWING IN CANVAS
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono">
                            {new Date(version.scannedAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Change note */}
                        <p className="text-xs text-slate-200 mb-3 leading-relaxed">
                          {version.changeNote || 'Standard scan update.'}
                        </p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-700/50 text-[11px] text-slate-400 font-mono">
                          <div>
                            <span>SHA-256: </span>
                            <code className="text-slate-300">
                              {(version.checksumSHA256 || doc.cloudStorage.checksumSHA256).substring(0, 14)}…
                            </code>
                            <span className="mx-2">·</span>
                            <span>Operator: {version.operator}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* View button */}
                            <button
                              onClick={() => {
                                setInspectedVersionNum(version.versionNumber);
                                setEditableText(version.fullText || '');
                              }}
                              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1 ${
                                isViewing
                                  ? 'bg-emerald-600 text-white font-medium'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isViewing ? 'Viewing' : 'Inspect Scan'}</span>
                            </button>

                            {/* Download Version PDF button */}
                            <button
                              onClick={() => handleDownloadPdf(version)}
                              className="px-2 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1"
                              title={`Download Version ${version.versionNumber} as PDF`}
                            >
                              <FileType className="w-3 h-3 text-emerald-400" />
                              <span>PDF</span>
                            </button>

                            {/* Restore as active if not current */}
                            {!isCurrent && (
                              <button
                                onClick={() => handleRestoreVersion(version.versionNumber)}
                                className="px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-600/60 transition cursor-pointer"
                                title="Set this version as the primary active record"
                              >
                                <span>Restore as Active</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* Tab 3: Extracted Entities */}
            {activeTab === 'entities' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Executive Summary (Version {inspectedVersionNum})</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {currentViewedVersion.summary || doc.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-mono">
                    Parsed Key-Value Entities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(currentViewedVersion.extractedFields || doc.extractedFields || []).map((field, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between"
                      >
                        <span className="text-[11px] text-slate-400 font-medium mb-1 truncate">
                          {field.key}
                        </span>
                        <span className="text-xs text-white font-semibold break-words">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Security & Audit */}
            {activeTab === 'security' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-300">
                      AES-256 Cloud Vault Verified
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Every version change is hashed, encrypted, and recorded in the immutable audit log.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Cryptographic Integrity
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs">
                    <div className="text-[11px] text-slate-400 mb-1">Active Version Checksum (SHA-256):</div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-emerald-400 font-mono text-[11px] break-all">
                        {currentViewedVersion.checksumSHA256 || doc.cloudStorage.checksumSHA256}
                      </code>
                      <button onClick={handleCopyHash} className="p-1 rounded text-slate-400 hover:text-white">
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-mono">
                    Audit Trail History
                  </h4>
                  <div className="space-y-2.5">
                    {doc.auditTrail.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white font-mono text-[11px]">{entry.action}</span>
                            <span className="text-slate-500 text-[10px]">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 text-[11px] mt-0.5">{entry.details}</p>
                          <span className="text-[10px] text-slate-500 font-mono">Operator: {entry.operator}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full Version History JSON</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
