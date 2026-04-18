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
    if (!disabled) {
      setIsDragging(true);
    }
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
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const removeFile = useCallback(() => {
    if (!disabled) {
      onFileSelect(null as unknown as File);
    }
  }, [disabled, onFileSelect]);

  if (selectedFile) {
    return (
      <div className="relative rounded-xl border-2 border-green-500/50 bg-green-500/10 p-4 dark:border-green-400/50 dark:bg-green-400/10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 dark:bg-green-400/20">
            <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-700 dark:text-green-300">
              {selectedFile.name}
            </p>
            <p className="text-sm text-green-600/70 dark:text-green-400/70">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
          {!disabled && (
            <button
              onClick={removeFile}
              className="ml-2 rounded-full p-1 hover:bg-green-500/20 dark:hover:bg-green-400/20"
            >
              <X className="h-5 w-5 text-green-600 dark:text-green-400" />
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
      className={`
        relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-blue-400 dark:hover:bg-slate-800'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        id="resume-upload"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className={`
          flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300
          ${isDragging ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}
        `}>
          <Upload className={`h-8 w-8 ${isDragging ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {isDragging ? 'Drop your resume here' : 'Upload your resume'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag and drop or click to browse (PDF only, max 10MB)
          </p>
        </div>

        {error && (
          <p className="text-sm font-medium text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default SkillUploadZone;