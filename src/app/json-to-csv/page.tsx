'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import { FileDropzone } from '../components/FileDropzone';
import { FileList } from '../components/FileList';
import { ConversionOptions } from '../components/ConversionOptions';
import { ErrorMessage } from '../components/ErrorMessage';
import { useFileProcessor } from '../hooks/useFileProcessor';
import { useJsonFileUpload } from '../hooks/useJsonFileUpload';

export default function JsonToCsvPage() {
  const [outputFormat, setOutputFormat] = useState<'csv' | 'excel'>('csv');
  const [preserveTypes, setPreserveTypes] = useState<boolean>(true);

  const {
    files,
    errorMessage,
    addFiles,
    removeFile,
    convertSingleFile,
    convertAllFiles,
    resetFiles,
    clearError
  } = useFileProcessor();

  const { processFiles } = useJsonFileUpload(addFiles, (error) => {
    console.error('Upload error:', error);
  });

  const handleConvertSingle = (file: any) => {
    convertSingleFile(file, outputFormat, preserveTypes);
  };

  const handleConvertAll = () => {
    convertAllFiles(outputFormat, preserveTypes);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-4xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex items-center mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Convert JSON to CSV/Excel
          </h1>
        </div>

        <div className="mb-6">
          <FileDropzone onDrop={processFiles}>
            {(isDragActive) => (
              isDragActive ? (
                <p className="text-blue-500 dark:text-blue-400">Drop the JSON files here...</p>
              ) : (
                <div>
                  <p className="mb-2 dark:text-gray-200">Drag & drop JSON files here, or click to select</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Only .json files are accepted</p>
                </div>
              )
            )}
          </FileDropzone>
        </div>

        <ErrorMessage message={errorMessage} onDismiss={clearError} />

        <FileList
          files={files}
          outputFormat={outputFormat}
          onConvertSingle={handleConvertSingle}
          onRemoveFile={removeFile}
        />

        <ConversionOptions
          outputFormat={outputFormat}
          preserveTypes={preserveTypes}
          onOutputFormatChange={setOutputFormat}
          onPreserveTypesChange={setPreserveTypes}
        />

        <div className="flex space-x-4 mb-6">
          <button
            onClick={handleConvertAll}
            disabled={files.length === 0}
            className={`flex-1 py-2 px-4 rounded-lg ${
              files.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            } transition duration-200`}
          >
            Convert and Download All {files.length > 0 ? `(${files.length} files)` : ''}
          </button>
          
          <button
            onClick={resetFiles}
            className="py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition duration-200"
          >
            Reset
          </button>
        </div>
      </div>
    </main>
  );
} 