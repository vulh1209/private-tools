import { JsonFileData } from '../hooks/useFileProcessor';

interface FileListProps {
  files: JsonFileData[];
  outputFormat: 'csv' | 'excel';
  onConvertSingle: (file: JsonFileData) => void;
  onRemoveFile: (index: number) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  outputFormat,
  onConvertSingle,
  onRemoveFile
}) => {
  if (files.length === 0) return null;

  return (
    <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg mb-6">
      <p className="text-green-700 dark:text-green-400 mb-2">
        ✓ {files.length} JSON file(s) loaded successfully
      </p>
      <div className="text-sm dark:text-gray-300 max-h-40 overflow-y-auto">
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md"
            >
              <span>
                {file.fileName}.json - 
                {Array.isArray(file.data) ? (
                  <span className="ml-1">Contains an array with {file.data.length} items</span>
                ) : (
                  <span className="ml-1">Contains a JSON object</span>
                )}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onConvertSingle(file)}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  title={`Convert and download ${file.fileName}.${outputFormat === 'csv' ? 'csv' : 'xlsx'}`}
                >
                  {outputFormat === 'csv' ? 'CSV' : 'Excel'}
                </button>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};