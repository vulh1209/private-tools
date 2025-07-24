import { useState, useCallback } from 'react';
import { convertJSONToCSV, convertJSONToExcel, DataArray, DataRecord } from '../utils/processing';

export interface JsonFileData {
  fileName: string;
  data: DataArray | DataRecord | null;
}

export interface UseFileProcessorReturn {
  files: JsonFileData[];
  errorMessage: string;
  addFiles: (newFiles: JsonFileData[]) => void;
  removeFile: (index: number) => void;
  convertSingleFile: (file: JsonFileData, outputFormat: 'csv' | 'excel', preserveTypes: boolean) => void;
  convertAllFiles: (outputFormat: 'csv' | 'excel', preserveTypes: boolean) => void;
  resetFiles: () => void;
  setError: (message: string) => void;
  clearError: () => void;
}

export const useFileProcessor = (): UseFileProcessorReturn => {
  const [files, setFiles] = useState<JsonFileData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const addFiles = useCallback((newFiles: JsonFileData[]) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setErrorMessage('');
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  const setError = useCallback((message: string) => {
    setErrorMessage(message);
    console.error('File processor error:', message);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  const resetFiles = useCallback(() => {
    setFiles([]);
    setErrorMessage('');
  }, []);

  const processFileData = useCallback((fileData: DataArray | DataRecord | null): DataArray => {
    if (!fileData) {
      throw new Error('No data to convert');
    }
    
    let dataToConvert: DataArray = [];
    
    if (!Array.isArray(fileData)) {
      if (typeof fileData === 'object') {
        // Handle nested objects
        if (Object.values(fileData).some(value => Array.isArray(value))) {
          // Find the first array in the object
          for (const key in fileData) {
            if (Array.isArray(fileData[key])) {
              dataToConvert = fileData[key] as DataArray;
              break;
            }
          }
        } else {
          // Wrap single object in array
          dataToConvert = [fileData as DataRecord];
        }
      } else {
        throw new Error('Cannot convert this JSON structure');
      }
    } else {
      dataToConvert = fileData as DataArray;
    }

    return dataToConvert;
  }, []);

  const convertSingleFile = useCallback((
    file: JsonFileData, 
    outputFormat: 'csv' | 'excel', 
    preserveTypes: boolean
  ) => {
    try {
      const processedData = processFileData(file.data);
      
      if (outputFormat === 'csv') {
        convertJSONToCSV(processedData, file.fileName, preserveTypes, setError);
      } else {
        convertJSONToExcel(processedData, file.fileName, preserveTypes, setError);
      }
    } catch (error) {
      setError(`Error converting file ${file.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [processFileData, setError]);

  const convertAllFiles = useCallback((
    outputFormat: 'csv' | 'excel', 
    preserveTypes: boolean
  ) => {
    if (files.length === 0) return;

    files.forEach((file) => {
      convertSingleFile(file, outputFormat, preserveTypes);
    });
  }, [files, convertSingleFile]);

  return {
    files,
    errorMessage,
    addFiles,
    removeFile,
    convertSingleFile,
    convertAllFiles,
    resetFiles,
    setError,
    clearError,
  };
};