import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface SkillUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export const SkillUploadZone: React.FC<SkillUploadZoneProps> = ({
  onFileSelect,
  selectedFile,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) onFileSelect(file);
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) onFileSelect(file);
    }
  }, [onFileSelect]);

  const removeFile = useCallback(() => {
    if (!disabled) onFileSelect(null as unknown as File);
  }, [disabled, onFileSelect]);

  if (selectedFile) {
    return (
      <div
        style={{
          borderRadius: '0.75rem',
          background: 'rgba(9, 76, 178, 0.06)',
          border: '1px solid rgba(9, 76, 178, 0.2)',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.625rem',
              background: 'rgba(9, 76, 178, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={22} color="#094cb2" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: '#094cb2',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedFile.name}
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#737784',
                marginTop: '0.125rem',
              }}
            >
              {(selectedFile.size / 1024).toFixed(1)} KB · PDF
            </p>
          </div>
          <CheckCircle size={20} color="#094cb2" style={{ flexShrink: 0 }} />
          {!disabled && (
            <button
              onClick={removeFile}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.375rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(9,76,178,0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
              aria-label="Remove file"
            >
              <X size={18} color="#094cb2" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: '0.75rem',
        border: isDragging
          ? '2px dashed #094cb2'
          : '2px dashed rgba(115, 119, 132, 0.35)',
        background: isDragging
          ? 'rgba(9, 76, 178, 0.04)'
          : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
        padding: '3rem 2rem',
        textAlign: 'center',
        transition: 'all 0.25s ease',
        opacity: disabled ? 0.55 : 1,
        transform: isDragging ? 'scale(1.015)' : 'scale(1)',
      }}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        disabled={disabled}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        id="resume-upload"
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        {/* Icon */}
        <div
          style={{
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: '50%',
            background: isDragging ? '#094cb2' : '#efedee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.25s ease',
          }}
        >
          <Upload size={26} color={isDragging ? '#fff' : '#434653'} />
        </div>

        {/* Text */}
        <div style={{ maxWidth: '28rem' }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#1b1c1d',
              marginBottom: '0.5rem',
              lineHeight: 1.35,
            }}
          >
            {isDragging ? 'Drop your resume here' : 'Drag and drop your resume'}
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#434653',
              lineHeight: 1.6,
            }}
          >
            Support for PDF files (Max 10MB)
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: '#737784',
              marginTop: '0.375rem',
              letterSpacing: '0.02em',
            }}
          >
            OR CLICK TO BROWSE FILES
          </p>
        </div>

        {error && (
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#ba1a1a',
              background: '#ffdad6',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default SkillUploadZone;