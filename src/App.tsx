import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  Plus,
  Camera,
  X,
  ArrowUpDown,
  Sparkles,
  Files,
  Tag,
  Folder as FolderIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  User as UserIcon,
  LogIn
} from 'lucide-react';
import { ScannedDocument, Folder, CloudStats, User } from './types/document';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DocumentCard } from './components/DocumentCard';
import { DocumentTable } from './components/DocumentTable';
import { ScannerModal } from './components/ScannerModal';
import { DocumentInspector } from './components/DocumentInspector';
import { NewFolderModal } from './components/NewFolderModal';
import { CloudAuditModal } from './components/CloudAuditModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  // Authentication State
  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('docuvault_token') || 'demo-session-token-jordan-hayes';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // App Data State
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<CloudStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isStarredFilter, setIsStarredFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title' | 'size' | 'confidence'>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Inspectors
  const [selectedDocument, setSelectedDocument] = useState<ScannedDocument | null>(null);
  const [targetDocumentForVersion, setTargetDocumentForVersion] = useState<ScannedDocument | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Authenticated fetch wrapper
  const authFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }
      return fetch(url, { ...options, headers });
    },
    [authToken]
  );

  // Fetch current user profile
  const fetchCurrentUser = useCallback(async () => {
    if (!authToken) {
      setCurrentUser(null);
      return;
    }
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        // Token invalid, clear it
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('Failed to fetch auth profile:', err);
    }
  }, [authToken, authFetch]);

  // Fetch Vault Data (Scoped to current user)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docsRes, foldersRes, statsRes] = await Promise.all([
        authFetch('/api/documents'),
        authFetch('/api/folders'),
        authFetch('/api/stats'),
      ]);

      if (docsRes.ok) {
        const docs = await docsRes.json();
        setDocuments(docs);
        // Also update selected document if open
        setSelectedDocument((curr) => {
          if (!curr) return null;
          const fresh = docs.find((d: ScannedDocument) => d.id === curr.id);
          return fresh || curr;
        });
      }
      if (foldersRes.ok) {
        const folds = await foldersRes.json();
        setFolders(folds);
      }
      if (statsRes.ok) {
        const st = await statsRes.json();
        setStats(st);
      }
    } catch (err) {
      console.error('Failed to fetch vault data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  // Load user profile & data
  useEffect(() => {
    fetchCurrentUser();
    fetchData();
  }, [authToken, fetchCurrentUser, fetchData]);

  // Handle successful login or register
  const handleAuthSuccess = (user: User, token: string) => {
    setAuthToken(token);
    localStorage.setItem('docuvault_token', token);
    setCurrentUser(user);
    setSelectedFolderId('all');
    setSelectedTag('');
    showToast(`Signed in as ${user.name}`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('docuvault_token');
    setAuthToken('');
    setCurrentUser(null);
    setDocuments([]);
    setFolders([]);
    showToast('Signed out of cloud vault');
  };

  // Tag taxonomy list with counts
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      if (!d.isArchived) {
        d.tags.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  const starredCount = useMemo(() => {
    return documents.filter((d) => d.isStarred && !d.isArchived).length;
  }, [documents]);

  // Filter & sort documents
  const filteredDocuments = useMemo(() => {
    let result = [...documents].filter((d) => !d.isArchived);

    if (selectedFolderId !== 'all') {
      result = result.filter((d) => d.folderId === selectedFolderId);
    }

    if (selectedTag) {
      result = result.filter((d) =>
        d.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    if (isStarredFilter) {
      result = result.filter((d) => d.isStarred);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchText = (d.fullText || '').toLowerCase().includes(q);
        const matchSummary = (d.summary || '').toLowerCase().includes(q);
        const matchTags = d.tags.some((t) => t.toLowerCase().includes(q));
        const matchFields = d.extractedFields.some(
          (f) => f.key.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)
        );
        return matchTitle || matchText || matchSummary || matchTags || matchFields;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'size') {
        return b.fileSizeBytes - a.fileSizeBytes;
      }
      if (sortBy === 'confidence') {
        return (b.confidenceScore || 0) - (a.confidenceScore || 0);
      }
      return 0;
    });

    return result;
  }, [documents, selectedFolderId, selectedTag, isStarredFilter, searchQuery, sortBy]);

  const currentFolderName = useMemo(() => {
    if (isStarredFilter) return 'Priority & Starred';
    if (selectedFolderId === 'all') return 'All Documents';
    const folder = folders.find((f) => f.id === selectedFolderId);
    return folder ? folder.name : 'Documents';
  }, [selectedFolderId, isStarredFilter, folders]);

  // Document Handlers
  const handleToggleStar = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await authFetch(`/api/documents/${docId}/star`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, isStarred: data.isStarred } : d))
        );
        if (selectedDocument && selectedDocument.id === docId) {
          setSelectedDocument((curr) => (curr ? { ...curr, isStarred: data.isStarred } : null));
        }
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleDocumentSaved = (newOrUpdatedDoc: ScannedDocument) => {
    setDocuments((prev) => {
      const existsIndex = prev.findIndex((d) => d.id === newOrUpdatedDoc.id);
      if (existsIndex !== -1) {
        const updated = [...prev];
        updated[existsIndex] = newOrUpdatedDoc;
        return updated;
      }
      return [newOrUpdatedDoc, ...prev];
    });

    // Update inspector if this document is open
    if (selectedDocument && selectedDocument.id === newOrUpdatedDoc.id) {
      setSelectedDocument(newOrUpdatedDoc);
    }

    if (newOrUpdatedDoc.currentVersion && newOrUpdatedDoc.currentVersion > 1) {
      showToast(`Saved as Version ${newOrUpdatedDoc.currentVersion} of "${newOrUpdatedDoc.title}"!`);
    } else {
      showToast(`"${newOrUpdatedDoc.title}" encrypted & saved to cloud vault!`);
    }

    setTargetDocumentForVersion(null);
    fetchData();
  };

  const handleUpdateDocument = (updatedDoc: ScannedDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    setSelectedDocument(updatedDoc);
    showToast('Document updated successfully');
    fetchData();
  };

  const handleDeleteDocument = async (docId: string, docTitle?: string) => {
    try {
      const response = await authFetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (selectedDocument && selectedDocument.id === docId) {
          setSelectedDocument(null);
        }
        showToast('Document deleted from cloud archive');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleFolderCreated = (newFolder: Folder) => {
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    showToast(`Folder "${newFolder.name}" created`);
    fetchData();
  };

  // Trigger scanning a new version of an existing document
  const handleScanNewVersion = (doc: ScannedDocument) => {
    setTargetDocumentForVersion(doc);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-xs text-white shadow-xl shadow-emerald-950/40 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        stats={stats}
        currentUser={currentUser}
        onOpenScanner={() => {
          setTargetDocumentForVersion(null);
          setIsScannerOpen(true);
        }}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isLoading={isLoading}
        onRefresh={fetchData}
      />

      {/* Body: Sidebar + Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={(id) => {
            setSelectedFolderId(id);
            if (isStarredFilter) setIsStarredFilter(false);
          }}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          allTags={allTags}
          isStarredFilter={isStarredFilter}
          onToggleStarredFilter={() => setIsStarredFilter(!isStarredFilter)}
          totalDocumentsCount={documents.length}
          starredCount={starredCount}
          onOpenNewFolderModal={() => setIsNewFolderOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            
            {/* Global Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search OCR text, vendor, amount, tags, or document title..."
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter and View Controls */}
            <div className="flex items-center gap-3 self-end md:self-auto text-xs">
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-300 text-xs border-0 focus:ring-0 cursor-pointer"
                >
                  <option value="date-desc" className="bg-slate-900">Newest Scanned</option>
                  <option value="date-asc" className="bg-slate-900">Oldest Scanned</option>
                  <option value="title" className="bg-slate-900">Document Title</option>
                  <option value="size" className="bg-slate-900">File Size</option>
                  <option value="confidence" className="bg-slate-900">OCR Confidence</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="List Table View"
                  aria-label="List Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

          {/* Active Filter Indicators */}
          {(searchQuery || selectedTag || selectedFolderId !== 'all' || isStarredFilter) && (
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-slate-300">Active Filters:</span>

              {selectedFolderId !== 'all' && (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  Folder: {currentFolderName}
                  <button onClick={() => setSelectedFolderId('all')} className="hover:text-white ml-0.5">×</button>
                </span>
              )}

              {selectedTag && (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  Tag: #{selectedTag}
                  <button onClick={() => setSelectedTag('')} className="hover:text-white ml-0.5">×</button>
                </span>
              )}

              {isStarredFilter && (
                <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                  Starred Only
                  <button onClick={() => setIsStarredFilter(false)} className="hover:text-white ml-0.5">×</button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 text-slate-200">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-white ml-0.5">×</button>
                </span>
              )}

              <button
                onClick={() => {
                  setSelectedFolderId('all');
                  setSelectedTag('');
                  setIsStarredFilter(false);
                  setSearchQuery('');
                }}
                className="text-xs text-emerald-400 hover:underline ml-auto cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                <span>{currentFolderName}</span>
                <span className="text-xs font-normal text-slate-400 font-sans">
                  ({filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'})
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser ? `Account: ${currentUser.name} (${currentUser.email})` : 'Cloud Vault Archive'} · Multi-version history tracking enabled
              </p>
            </div>

            <button
              onClick={() => {
                setTargetDocumentForVersion(null);
                setIsScannerOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan New</span>
            </button>
          </div>

          {/* Document Content View: Grid or Table */}
          {filteredDocuments.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 my-8">
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mb-3 border border-slate-800">
                <Files className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white">No documents found</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                {searchQuery || selectedTag || selectedFolderId !== 'all'
                  ? 'No documents matched your active filter or search query. Try clearing your filters.'
                  : 'Your cloud storage vault is ready. Scan a paper document or test with our sample presets!'}
              </p>
              
              <div className="mt-5 flex gap-3">
                {searchQuery || selectedTag || selectedFolderId !== 'all' ? (
                  <button
                    onClick={() => {
                      setSelectedFolderId('all');
                      setSelectedTag('');
                      setIsStarredFilter(false);
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setTargetDocumentForVersion(null);
                      setIsScannerOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan First Document</span>
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  searchQuery={searchQuery}
                  onOpenInspector={setSelectedDocument}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </div>
          ) : (
            <DocumentTable
              documents={filteredDocuments}
              searchQuery={searchQuery}
              onOpenInspector={setSelectedDocument}
              onToggleStar={handleToggleStar}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

        </main>
      </div>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setTargetDocumentForVersion(null);
        }}
        folders={folders}
        existingDocuments={documents}
        targetDocumentForVersion={targetDocumentForVersion}
        onDocumentSaved={handleDocumentSaved}
        onOpenNewFolderModal={() => setIsNewFolderOpen(true)}
      />

      {/* Document Inspector Modal */}
      <DocumentInspector
        document={selectedDocument}
        folders={folders}
        onClose={() => setSelectedDocument(null)}
        onUpdateDocument={handleUpdateDocument}
        onDeleteDocument={handleDeleteDocument}
        onToggleStar={handleToggleStar}
        onScanNewVersion={handleScanNewVersion}
      />

      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onFolderCreated={handleFolderCreated}
      />

      {/* Cloud Security & Audit Modal */}
      <CloudAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        stats={stats}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />

    </div>
  );
}
