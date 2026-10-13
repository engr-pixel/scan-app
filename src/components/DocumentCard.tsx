import React, { useState } from 'react';
import { Star, ShieldCheck, Eye, FileText, ChevronRight, Hash, FileType } from 'lucide-react';
import { ScannedDocument } from '../types/document';
import { convertDocumentToPDF } from '../utils/pdfGenerator';

interface DocumentCardProps {
  document: ScannedDocument;
  searchQuery: string;
  onOpenInspector: (doc: ScannedDocument) => void;
  onToggleStar: (docId: string, e: React.MouseEvent) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  searchQuery,
  onOpenInspector,
  onToggleStar,
}) => {
  // Format bytes
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Highlight matches
  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-emerald-500/30 text-emerald-300 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Find a snippet of text matching search query, or first 120 chars
  const getSnippet = () => {
    if (!doc.fullText) return '';
    if (searchQuery.trim()) {
      const idx = doc.fullText.toLowerCase().indexOf(searchQuery.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(doc.fullText.length, idx + searchQuery.length + 60);
        return (start > 0 ? '…' : '') + doc.fullText.slice(start, end).replace(/\n/g, ' ') + '…';
      }
    }
    return doc.summary || doc.fullText.slice(0, 110).replace(/\n/g, ' ') + '…';
  };

  return (
    <div
      onClick={() => onOpenInspector(doc)}
      className="group relative flex flex-col bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/20 cursor-pointer"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/80">
        <img
          src={doc.imageUrl}
          alt={doc.title}
          className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
          loading="lazy"
        />

        {/* Quick star button */}
        <button
          onClick={(e) => onToggleStar(doc.id, e)}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-amber-400 backdrop-blur-sm transition z-10"
          title={doc.isStarred ? 'Unstar' : 'Star document'}
          aria-label="Star document"
        >
          <Star className={`w-3.5 h-3.5 ${doc.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>

        {/* Quiet overlay on hover */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/90 text-xs font-medium text-emerald-300 shadow">
            <Eye className="w-3.5 h-3.5" />
            <span>Open Inspector</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Quiet Unboxed Metadata Line (Zero-Pill Rule) */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5 font-mono">
            <span className="text-emerald-400 font-medium">{doc.folderName}</span>
            <span>·</span>
            <span>{doc.documentType}</span>
            <span>·</span>
            <span>{formatDate(doc.scannedAt)}</span>
            {(doc.currentVersion || 1) > 1 && (
              <>
                <span>·</span>
                <span className="text-emerald-300 font-semibold">v{doc.currentVersion}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
            {highlightMatches(doc.title, searchQuery)}
          </h3>

          {/* Snippet from OCR */}
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {highlightMatches(getSnippet(), searchQuery)}
          </p>
        </div>

        {/* Bottom Metadata & Quiet Tags */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="truncate text-slate-400">
              {doc.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
            </span>
            {doc.tags.length > 3 && (
              <span className="text-slate-500 font-mono">+{doc.tags.length - 3}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 font-mono text-[10px]">
            <span>{formatSize(doc.fileSizeBytes)}</span>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await convertDocumentToPDF(doc);
              }}
              className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
              title="Export as Searchable PDF"
            >
              <FileType className="w-3.5 h-3.5" />
            </button>
            <span title="Cloud Verified">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
