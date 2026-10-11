import { useRef, useState } from 'react';
import { FileUp, FileText } from 'lucide-react';

const MAX_MB = 5;

export function FileUploader({ file, onSelect, onClear, disabled, error, maxMb = MAX_MB }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList) => {
    const picked = fileList?.[0];
    if (!picked) return;
    onSelect(picked);
  };

  return (
    <div className="stack g10">
      {file ? (
        <div className="file-chip">
          <FileText size={17} strokeWidth={1.75} aria-hidden="true" />
          <span className="file-name">
            {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClear}
            disabled={disabled}
            aria-label={`Remove ${file.name}`}
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          className={`dropzone ${dragging ? 'dragging' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Upload a PDF resume"
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
        >
          <span className="icon-badge" aria-hidden="true">
            <FileUp size={22} strokeWidth={1.75} />
          </span>
          <strong>Drop your PDF resume here</strong>
          <span className="muted small">or click to browse — PDF only, up to {maxMb} MB</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
