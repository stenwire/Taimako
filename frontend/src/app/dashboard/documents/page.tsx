'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Database, RefreshCw, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { uploadDocuments, listDocuments, processDocuments } from '@/lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setMessage(null);
    try {
      await uploadDocuments(selectedFiles);
      setMessage({ type: 'success', text: `Successfully uploaded ${selectedFiles.length} file(s)` });
      setSelectedFiles([]);
      await fetchDocuments();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload documents' });
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setMessage(null);
    try {
      await processDocuments();
      setMessage({ type: 'success', text: 'Documents processed successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to process documents' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--success)]/10 rounded-[var(--radius-squircle)]">
            <FileText className="w-8 h-8 text-[var(--success)]" />
          </div>
          <div>
            <h1 className="text-h1 text-[var(--text-primary)]">Documents</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Upload and manage your knowledge base
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={fetchDocuments}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Notifications */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-[var(--radius-md)] flex items-start gap-3 ${message.type === 'success'
            ? 'bg-[var(--success-bg)] border border-[var(--success)]'
            : 'bg-[var(--error-bg)] border border-[var(--error)]'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-small ${message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
            {message.text}
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card title="Upload Documents" subtitle="Add files to your knowledge base">
            <label
              htmlFor="file-upload"
              className={`block border-2 border-dashed rounded-[var(--radius-md)] p-8 text-center transition-colors cursor-pointer ${isDragging
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-[var(--bg-secondary)]">
                  <Upload className="w-8 h-8 text-[var(--text-tertiary)]" />
                </div>
                <div>
                  <p className="text-body font-medium text-[var(--text-primary)]">
                    Drop files here or click to upload
                  </p>
                  <p className="text-small text-[var(--text-secondary)] mt-1">
                    PDF, TXT, MD files supported
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button variant="secondary" as="span">
                  Select Files
                </Button>
              </div>
            </label>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-small text-[var(--text-secondary)]">
                  {selectedFiles.length} file(s) selected
                </p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-sm)]"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
                      <span className="text-small text-[var(--text-primary)]">{file.name}</span>
                      <span className="text-[12px] text-[var(--text-tertiary)]">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={handleUpload}
                  loading={uploading}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4" />
                  Upload {selectedFiles.length} File(s)
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Document List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            title="Knowledge Base"
            subtitle={`${documents.length} document(s)`}
            headerAction={
              <Button
                variant="primary"
                size="sm"
                onClick={handleProcess}
                loading={processing}
                disabled={processing || documents.length === 0}
              >
                <Database className="w-4 h-4" />
                Process Documents
              </Button>
            }
          >
            {loading ? (
              <div className="space-y-2">
                <SkeletonLoader variant="text" count={5} />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3 opacity-50" />
                <p className="text-small text-[var(--text-secondary)]">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="table-row flex items-center justify-between p-3 rounded-[var(--radius-sm)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--bg-secondary)] rounded-[var(--radius-sm)]">
                        <FileText className="w-4 h-4 text-[var(--success)]" />
                      </div>
                      <span className="text-small text-[var(--text-primary)]">{doc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
