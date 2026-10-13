import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  FileText,
  RotateCw,
  Sun,
  Check,
  X,
  AlertCircle,
  Loader2,
  Folder as FolderIcon,
  Tag,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  GitBranch,
  Layers,
  FileType
} from 'lucide-react';
import { Folder, OCRResult, ScannedDocument } from '../types/document';
import { SAMPLE_PRESET_DOCUMENTS, PresetDocument } from '../utils/sampleDocuments';
import { convertDocumentToPDF } from '../utils/pdfGenerator';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  existingDocuments: ScannedDocument[];
  targetDocumentForVersion?: ScannedDocument | null;
  onDocumentSaved: (doc: ScannedDocument) => void;
  onOpenNewFolderModal: () => void;
}

type ScanTab = 'camera' | 'upload' | 'samples';
type FilterMode = 'original' | 'document-bw' | 'grayscale';
type SaveMode = 'new_document' | 'new_version';

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  folders,
  existingDocuments,
  targetDocumentForVersion,
  onDocumentSaved,
  onOpenNewFolderModal,
}) => {
  const [activeTab, setActiveTab] = useState<ScanTab>('samples');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('Scanned_Document.jpg');
  const [fileSize, setFileSize] = useState<number>(240000);

  // Versioning save mode
  const [saveMode, setSaveMode] = useState<SaveMode>('new_document');
  const [selectedParentDocId, setSelectedParentDocId] = useState<string>('');
  const [versionChangeNote, setVersionChangeNote] = useState<string>('');

  // Enhancement controls
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<FilterMode>('original');

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // OCR Processing State
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [ocrStep, setOcrStep] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Review Form state
  const [title, setTitle] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Set up initial state when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetScanState();
    } else {
      if (targetDocumentForVersion) {
        setSaveMode('new_version');
        setSelectedParentDocId(targetDocumentForVersion.id);
        setVersionChangeNote(`Updated revision of ${targetDocumentForVersion.title}`);
      } else {
        setSaveMode('new_document');
        if (existingDocuments.length > 0) {
          setSelectedParentDocId(existingDocuments[0].id);
        }
      }

      if (folders.length > 0 && !selectedFolderId) {
        setSelectedFolderId(folders[0].id);
      }
    }
  }, [isOpen, targetDocumentForVersion, existingDocuments, folders]);

  const resetScanState = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setIsProcessingOcr(false);
    setOcrStep('');
    setOcrError(null);
    setTitle('');
    setTags([]);
    setRotation(0);
    setFilterMode('original');
    setVersionChangeNote('');
  };

  // Camera handling
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStream(stream);
    } catch (err: any) {
      console.warn('Camera access unavailable:', err);
      setCameraError('Camera access unavailable. You can upload an image file or choose a preset document.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setMimeType('image/jpeg');
    setFileName(`Camera_Scan_${new Date().toISOString().slice(0, 10)}.jpg`);
    setFileSize(Math.round(dataUrl.length * 0.75));
    stopCamera();

    processDocumentOCR(dataUrl, 'image/jpeg', `Camera_Scan_${new Date().toISOString().slice(0, 10)}.jpg`);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCapturedImage(dataUrl);
      setMimeType(file.type);
      setFileName(file.name);
      setFileSize(file.size);
      processDocumentOCR(dataUrl, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: PresetDocument) => {
    setCapturedImage(sample.imageBase64);
    setMimeType(sample.mimeType);
    setFileName(`${sample.name.replace(/\s+/g, '_')}.jpg`);
    setFileSize(260000);
    processDocumentOCR(sample.imageBase64, sample.mimeType, sample.name);
  };

  const processDocumentOCR = async (imageSrc: string, fileMime: string, docName: string) => {
    setIsProcessingOcr(true);
    setOcrError(null);
    setOcrStep('Encrypting scan stream & initiating secure cloud ingest...');

    try {
      await new Promise((r) => setTimeout(r, 450));
      setOcrStep('Gemini 3.8 Flash Vision analyzing document layout & text...');

      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          mimeType: fileMime,
          fileName: docName,
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR processing failed with status ${response.status}`);
      }

      setOcrStep('Extracting key entity fields and folder taxonomy...');
      await new Promise((r) => setTimeout(r, 350));

      const result: OCRResult = await response.json();
      setOcrResult(result);
      setTitle(result.title || docName.replace(/\.[^/.]+$/, ''));

      const matchedFolder = folders.find(
        (f) => f.name.toLowerCase() === (result.suggestedFolder || '').toLowerCase()
      );
      if (matchedFolder) {
        setSelectedFolderId(matchedFolder.id);
      } else if (folders.length > 0) {
        setSelectedFolderId(folders[0].id);
      }

      setTags(result.tags || ['Scanned', 'Cloud Archive']);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setOcrError(err.message || 'Failed to extract text. You can still save manually.');
      setTitle(docName.replace(/\.[^/.]+$/, ''));
      setTags(['Scanned', 'Document']);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const addTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleExportPdfFromScanner = async () => {
    if (!capturedImage) return;
    const tempDoc: ScannedDocument = {
      id: `temp-${Date.now()}`,
      userId: 'user',
      title: title || fileName || 'Scanned Document',
      fileName,
      documentType: ocrResult?.documentType || 'Scanned Document',
      folderId: selectedFolderId,
      folderName: folders.find((f) => f.id === selectedFolderId)?.name || 'General',
      tags,
      scannedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSizeBytes: fileSize,
      mimeType,
      imageUrl: capturedImage,
      fullText: ocrResult?.fullText || '',
      summary: ocrResult?.summary || '',
      extractedFields: ocrResult?.extractedFields || [],
      confidenceScore: ocrResult?.confidenceScore || 0.95,
      language: ocrResult?.language || 'English',
      isStarred: false,
      isArchived: false,
      cloudStorage: {
        provider: 'DocuVault',
        bucket: 'docuvault-secure-vault',
        storageKey: 'scan.enc',
        encryptionCipher: 'AES-256-GCM',
        checksumSHA256: 'pending-cloud-seal',
        syncStatus: 'synced',
        replicaRegions: ['asia-east1'],
        version: saveMode === 'new_version' ? nextVersionNumber : 1,
      },
      currentVersion: saveMode === 'new_version' ? nextVersionNumber : 1,
      versions: [],
      auditTrail: [],
    };
    await convertDocumentToPDF(tempDoc);
  };

  // Find target parent doc if in new_version mode
  const parentDocument = existingDocuments.find((d) => d.id === selectedParentDocId);
  const nextVersionNumber = parentDocument ? (parentDocument.currentVersion || 1) + 1 : 2;

  // Save Document (Either new doc or new version of existing)
  const handleSaveToCloud = async () => {
    if (!capturedImage) return;
    setIsSaving(true);

    try {
      if (saveMode === 'new_version' && parentDocument) {
        // Post new version to existing document
        const versionPayload = {
          imageUrl: capturedImage,
          fullText: ocrResult?.fullText || '',
          summary: ocrResult?.summary || 'Updated version scanned and saved to cloud archive.',
          extractedFields: ocrResult?.extractedFields || [],
          changeNote: versionChangeNote.trim() || `Updated scan revision ${nextVersionNumber}`,
          fileName,
          fileSizeBytes: fileSize,
          confidenceScore: ocrResult?.confidenceScore || 0.95,
        };

        const response = await fetch(`/api/documents/${parentDocument.id}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(versionPayload),
        });

        if (!response.ok) {
          throw new Error('Failed to save document version');
        }

        const updatedDoc: ScannedDocument = await response.json();
        onDocumentSaved(updatedDoc);
        onClose();
      } else {
        // Save as brand new document
        if (!title.trim()) return;

        const payload = {
          title: title.trim(),
          fileName,
          documentType: ocrResult?.documentType || 'Scanned Document',
          folderId: selectedFolderId,
          tags,
          imageUrl: capturedImage,
          fullText: ocrResult?.fullText || '',
          summary: ocrResult?.summary || 'Scanned document archived in DocuVault cloud storage.',
          extractedFields: ocrResult?.extractedFields || [],
          confidenceScore: ocrResult?.confidenceScore || 0.95,
          language: ocrResult?.language || 'English',
          fileSizeBytes: fileSize,
          mimeType,
        };

        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to save document to cloud storage');
        }

        const savedDoc: ScannedDocument = await response.json();
        onDocumentSaved(savedDoc);
        onClose();
      }
    } catch (err: any) {
      alert(`Error saving document: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Smart Document Scanner</h2>
              <p className="text-xs text-slate-400">
                {saveMode === 'new_version' && parentDocument
                  ? `Scanning updated Version ${nextVersionNumber} for "${parentDocument.title}"`
                  : 'Capture, extract searchable OCR text, and archive to cloud'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {!capturedImage ? (
            <div>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 mb-6 gap-2">
                <button
                  onClick={() => { setActiveTab('samples'); stopCamera(); }}
                  className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium transition border-b-2 cursor-pointer ${
                    activeTab === 'samples' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Preset Test Samples (Instant)</span>
                </button>

                <button
                  onClick={() => { setActiveTab('upload'); stopCamera(); }}
                  className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium transition border-b-2 cursor-pointer ${
                    activeTab === 'upload' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File / PDF</span>
                </button>

                <button
                  onClick={() => { setActiveTab('camera'); startCamera(); }}
                  className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium transition border-b-2 cursor-pointer ${
                    activeTab === 'camera' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera Scan</span>
                </button>
              </div>

              {/* Sample presets */}
              {activeTab === 'samples' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-xs text-emerald-200">
                    💡 <strong>Test Mode:</strong> Select any realistic document to test OCR text extraction and version tracking.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SAMPLE_PRESET_DOCUMENTS.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className="flex flex-col text-left p-4 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/60 transition group cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition">
                            {sample.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{sample.category}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">{sample.description}</p>
                        <div className="flex items-center justify-between text-xs text-emerald-400 mt-auto pt-2 border-t border-slate-700/50">
                          <span className="font-medium">Scan & Run OCR</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload file */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    isDragging ? 'border-emerald-500 bg-emerald-950/20 text-emerald-200' : 'border-slate-700 bg-slate-800/30 text-slate-400'
                  }`}
                  onClick={() => document.getElementById('scan-file-input')?.click()}
                >
                  <input
                    id="scan-file-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 mb-1">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Drag & drop document here, or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">Supports JPEG, PNG, WEBP, and PDF scans</p>
                  </div>
                </div>
              )}

              {/* Camera */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-4 bg-amber-950/40 border border-amber-800/50 rounded-lg text-amber-200 text-xs flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                      <p>{cameraError}</p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[420px] flex items-center justify-center">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-8 border-2 border-dashed border-emerald-400/60 pointer-events-none rounded-lg flex items-center justify-center">
                        <span className="text-[11px] bg-slate-900/80 px-2 py-1 rounded text-emerald-300">
                          Align document within frame
                        </span>
                      </div>
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <button
                          onClick={capturePhoto}
                          className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capture & Scan</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </div>
          ) : (
            /* Scanned Image Preview & Review Panel */
            <div className="space-y-6">
              
              {/* Top Bar with Re-scan and Version Mode Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs">
                <button
                  onClick={resetScanState}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rescan / Change File</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1.5 rounded bg-slate-800 border border-slate-700 transition cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate</span>
                  </button>
                  <button
                    onClick={() => setFilterMode((m) => m === 'original' ? 'document-bw' : 'original')}
                    className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1.5 rounded bg-slate-800 border border-slate-700 transition cursor-pointer"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>{filterMode === 'original' ? 'Original' : 'Doc B&W'}</span>
                  </button>
                </div>
              </div>

              {/* Versioning Save Option Segmented Control */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  Document Archival Destination
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option 1: New Document */}
                  <button
                    type="button"
                    onClick={() => setSaveMode('new_document')}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      saveMode === 'new_document'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-white">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create New Document</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Save as an independent new document starting at Version 1.
                    </p>
                  </button>

                  {/* Option 2: New Version of Existing Document */}
                  <button
                    type="button"
                    onClick={() => setSaveMode('new_version')}
                    disabled={existingDocuments.length === 0}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer disabled:opacity-40 ${
                      saveMode === 'new_version'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-white">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save as Updated Version</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Update an existing document while preserving complete change history.
                    </p>
                  </button>
                </div>

                {/* If Version Mode is Active -> Show Document Selector & Change Note */}
                {saveMode === 'new_version' && (
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 space-y-3 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Select Existing Document to Update
                      </label>
                      <select
                        value={selectedParentDocId}
                        onChange={(e) => setSelectedParentDocId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {existingDocuments.map((d) => (
                          <option key={d.id} value={d.id}>
                            📄 {d.title} (Currently v{d.currentVersion || 1})
                          </option>
                        ))}
                      </select>
                    </div>

                    {parentDocument && (
                      <div className="text-xs text-emerald-400 font-mono">
                        ➔ This scan will be saved as <span className="font-bold underline">Version {nextVersionNumber}</span> of "{parentDocument.title}".
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Version Change Note / Reason for Update <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={versionChangeNote}
                        onChange={(e) => setVersionChangeNote(e.target.value)}
                        placeholder="e.g. Executed Amendment with updated lease terms, Q4 billing correction"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Side-by-side: Image preview + Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Image Preview Box */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center min-h-[300px] max-h-[420px] overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center overflow-auto">
                    <img
                      src={capturedImage}
                      alt="Scanned Document"
                      className="max-h-[360px] max-w-full object-contain transition-transform duration-200 rounded"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        filter: filterMode === 'document-bw' ? 'contrast(180%) grayscale(100%)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {/* OCR & Review Box */}
                <div className="space-y-4">
                  {isProcessingOcr ? (
                    <div className="p-8 bg-slate-800/40 border border-slate-700 rounded-lg flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white">Extracting Document Text</h4>
                        <p className="text-xs text-emerald-400 font-mono animate-pulse">{ocrStep}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {saveMode === 'new_document' ? (
                        <>
                          {/* Title input */}
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                              Document Title
                            </label>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="e.g. October Cloud Hosting Invoice"
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Folder selector */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-slate-300">Folder Archive</label>
                              <button
                                type="button"
                                onClick={onOpenNewFolderModal}
                                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                              >
                                + New Folder
                              </button>
                            </div>
                            <select
                              value={selectedFolderId}
                              onChange={(e) => setSelectedFolderId(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                            >
                              {folders.map((f) => (
                                <option key={f.id} value={f.id}>📁 {f.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Tags */}
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                              Tags for Retrieval
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-950/80 border border-emerald-700/60 text-emerald-300"
                                >
                                  <span>{t}</span>
                                  <button type="button" onClick={() => removeTag(t)} className="hover:text-white">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag(newTagInput);
                                  }
                                }}
                                placeholder="Add custom tag..."
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => addTag(newTagInput)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* In Version Mode -> Shows parent doc summary */
                        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 space-y-2 text-xs">
                          <div className="text-slate-300 font-semibold">Updating Target Document:</div>
                          <div className="text-white font-medium">{parentDocument?.title}</div>
                          <div className="text-slate-400 text-[11px]">
                            Folder: {parentDocument?.folderName} · Tags: {parentDocument?.tags.join(', ')}
                          </div>
                          <div className="text-emerald-400 font-mono text-[11px] pt-1">
                            Current Version: v{parentDocument?.currentVersion || 1} ➔ New Version: v{nextVersionNumber}
                          </div>
                        </div>
                      )}

                      {/* OCR Summary */}
                      {ocrResult && (
                        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-semibold text-slate-200">OCR Summary:</span>
                            <span className="text-emerald-400 font-mono text-[11px]">
                              {Math.round((ocrResult.confidenceScore || 0.98) * 100)}% Confidence
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{ocrResult.summary}</p>
                        </div>
                      )}

                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted with SHA-256 integrity seal</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            {capturedImage && (
              <>
                <button
                  type="button"
                  onClick={handleExportPdfFromScanner}
                  disabled={isProcessingOcr}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                  title="Export current scan to PDF"
                >
                  <FileType className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={handleSaveToCloud}
                  disabled={isSaving || isProcessingOcr || (saveMode === 'new_document' && !title.trim())}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Archiving to Cloud...</span>
                  </>
                ) : saveMode === 'new_version' ? (
                  <>
                    <GitBranch className="w-4 h-4" />
                    <span>Save as Version {nextVersionNumber}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save to Cloud Storage</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
        </div>

      </div>
    </div>
  );
};
