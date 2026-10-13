import React from 'react';
import { Star, ShieldCheck, Eye, Trash2, FileText, Download, FileType } from 'lucide-react';
import { ScannedDocument } from '../types/document';
import { convertDocumentToPDF } from '../utils/pdfGenerator';

interface DocumentTableProps {
  documents: ScannedDocument[];
  searchQuery: string;
  onOpenInspector: (doc: ScannedDocument) => void;
  onToggleStar: (docId: string, e: React.MouseEvent) => void;
  onDeleteDocument: (docId: string, title: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  searchQuery,
  onOpenInspector,
  onToggleStar,
  onDeleteDocument,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
            <tr>
              <th className="py-3 px-4 w-10 text-center"></th>
              <th className="py-3 px-4 font-semibold">Document Title</th>
              <th className="py-3 px-4 font-semibold">Folder</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold">Ver</th>
              <th className="py-3 px-4 font-semibold">Scanned</th>
              <th className="py-3 px-4 font-semibold">Size</th>
              <th className="py-3 px-4 font-semibold">Cloud Hash (SHA-256)</th>
              <th className="py-3 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => onOpenInspector(doc)}
                className="hover:bg-slate-800/50 transition cursor-pointer group"
              >
                {/* Star */}
                <td
                  className="py-3 px-4 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(doc.id, e);
                  }}
                >
                  <Star
                    className={`w-4 h-4 mx-auto transition ${
                      doc.isStarred
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600 hover:text-amber-400'
                    }`}
                  />
                </td>

                {/* Title */}
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-100 group-hover:text-emerald-300 transition truncate max-w-xs sm:max-w-md">
                    {doc.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                    {doc.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                  </div>
                </td>

                {/* Folder */}
                <td className="py-3 px-4">
                  <span className="text-emerald-400 font-medium">{doc.folderName}</span>
                </td>

                {/* Type */}
                <td className="py-3 px-4 font-mono text-slate-400">
                  {doc.documentType}
                </td>

                {/* Version */}
                <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                  v{doc.currentVersion || 1}
                </td>

                {/* Scanned */}
                <td className="py-3 px-4 font-mono text-slate-400">
                  {formatDate(doc.scannedAt)}
                </td>

                {/* Size */}
                <td className="py-3 px-4 font-mono text-slate-400">
                  {formatSize(doc.fileSizeBytes)}
                </td>

                {/* Cloud Hash */}
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{doc.cloudStorage.checksumSHA256.substring(0, 10)}…</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={async () => {
                        await convertDocumentToPDF(doc);
                      }}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                      title="Convert & Download PDF"
                    >
                      <FileType className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenInspector(doc)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                      title="Inspect"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${doc.title}"?`)) {
                          onDeleteDocument(doc.id, doc.title);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
