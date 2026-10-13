export interface ExtractedField {
  key: string;
  value: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  documentCount?: number;
}

export interface CloudStorageMetadata {
  provider: string;
  bucket: string;
  storageKey: string;
  encryptionCipher: string;
  checksumSHA256: string;
  syncStatus: 'synced' | 'syncing' | 'offline_cached';
  replicaRegions: string[];
  version: number;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  details: string;
  operator: string;
}

export interface DocumentVersion {
  versionNumber: number;
  scannedAt: string;
  changeNote: string;
  fileName: string;
  fileSizeBytes: number;
  imageUrl: string;
  fullText: string;
  summary: string;
  extractedFields: ExtractedField[];
  confidenceScore: number;
  checksumSHA256: string;
  operator: string;
}

export interface ScannedDocument {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  documentType: string;
  folderId: string;
  folderName: string;
  tags: string[];
  scannedAt: string;
  updatedAt: string;
  fileSizeBytes: number;
  mimeType: string;
  imageUrl: string;
  fullText: string;
  summary: string;
  extractedFields: ExtractedField[];
  confidenceScore: number;
  language: string;
  isStarred: boolean;
  isArchived: boolean;
  cloudStorage: CloudStorageMetadata;
  auditTrail: AuditLogEntry[];
  currentVersion: number;
  versions: DocumentVersion[];
}

export interface OCRResult {
  title: string;
  documentType: string;
  fullText: string;
  summary: string;
  suggestedFolder: string;
  tags: string[];
  extractedFields: ExtractedField[];
  confidenceScore: number;
  language: string;
}

export interface CloudStats {
  totalDocuments: number;
  totalStorageBytes: number;
  quotaBytes: number;
  foldersCount: number;
  tagsCount: number;
  ocrWordCount: number;
  averageConfidence: number;
  lastBackupTime: string;
  encryptionProtocol: string;
  versionsCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
