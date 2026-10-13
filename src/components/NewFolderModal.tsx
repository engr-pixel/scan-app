import React, { useState } from 'react';
import { X, Folder as FolderIcon, DollarSign, Scale, Heart, Receipt, User, Briefcase, FileText } from 'lucide-react';
import { Folder } from '../types/document';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: (folder: Folder) => void;
}

const ICONS = [
  { id: 'folder', label: 'Default', icon: <FolderIcon className="w-4 h-4" /> },
  { id: 'dollar-sign', label: 'Finance', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'scale', label: 'Legal', icon: <Scale className="w-4 h-4" /> },
  { id: 'heart', label: 'Health', icon: <Heart className="w-4 h-4" /> },
  { id: 'receipt', label: 'Receipts', icon: <Receipt className="w-4 h-4" /> },
  { id: 'user', label: 'Personal', icon: <User className="w-4 h-4" /> },
  { id: 'briefcase', label: 'Business', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'file-text', label: 'Archive', icon: <FileText className="w-4 h-4" /> },
];

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  onFolderCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          icon: selectedIcon,
          color: 'emerald',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      const created: Folder = await response.json();
      onFolderCreated(created);
      setName('');
      setDescription('');
      setSelectedIcon('folder');
      onClose();
    } catch (err: any) {
      alert(`Error creating folder: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Create Organization Folder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Folder Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Real Estate & Escrow, Insurance, 2026 Taxes"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Invoices, settlements, and signed closing disclosures"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Folder Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedIcon(item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition cursor-pointer ${
                    selectedIcon === item.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-medium'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
