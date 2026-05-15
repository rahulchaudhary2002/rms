import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    uploading?: boolean;
    onFiles: (files: File[]) => void;
    className?: string;
    preview?: React.ReactNode;
};

export function DropzoneUploader({
    accept = 'image/*',
    multiple = true,
    disabled = false,
    uploading = false,
    onFiles,
    className,
    preview,
}: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            onFiles(Array.from(files));
        },
        [onFiles],
    );

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
    };

    const onClick = () => {
        if (!disabled) inputRef.current?.click();
    };

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={onClick}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer select-none',
                isDragging
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-muted/40',
                (disabled || uploading) && 'pointer-events-none opacity-60',
                className,
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                disabled={disabled || uploading}
                onChange={(e) => handleFiles(e.target.files)}
            />

            {preview ? (
                preview
            ) : uploading ? (
                <>
                    <span className="material-symbols-outlined animate-spin text-[40px]">progress_activity</span>
                    <p className="text-sm font-semibold">Uploading…</p>
                </>
            ) : (
                <>
                    <span className={cn('material-symbols-outlined text-[40px]', isDragging && 'text-primary')}>
                        {isDragging ? 'download' : 'cloud_upload'}
                    </span>
                    <div>
                        <p className="text-sm font-semibold">
                            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="mt-1 text-xs">or click to browse</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                        {accept === 'image/*' ? 'PNG, JPG, WEBP up to 4 MB' : accept}
                    </p>
                </>
            )}
        </div>
    );
}
