import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

export const ImageUploader = ({ onFileSelected, previewUrl, onClear }) => {
  const [dragActive, setDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState(previewUrl || null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result);
    };
    reader.readAsDataURL(file);
    if (onFileSelected) onFileSelected(file);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    if (onClear) onClear();
  };

  return (
    <div>
      {localPreview ? (
        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155', maxHeight: '240px' }}>
          <img src={localPreview} alt="Upload Preview" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
          <button
            type="button"
            onClick={handleRemove}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#3b82f6' : '#334155'}`,
            borderRadius: '12px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            background: dragActive ? 'rgba(59, 130, 246, 0.08)' : '#0f172a',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('file-upload-input').click()}
        >
          <UploadCloud size={40} color={dragActive ? '#3b82f6' : '#94a3b8'} style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc' }}>
            Click or drag & drop photo here
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Supports JPG, PNG, WEBP (Max 5MB)
          </div>
          <input
            id="file-upload-input"
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
};
