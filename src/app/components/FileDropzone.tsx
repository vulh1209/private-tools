import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  children: (isDragActive: boolean) => React.ReactNode;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onDrop,
  accept = { 'application/json': ['.json'] },
  multiple = true,
  children
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 dark:bg-gray-700/30'
      }`}
    >
      <input {...getInputProps()} />
      {children(isDragActive)}
    </div>
  );
};