import { useCallback } from 'react';
import { JsonFileData } from './useFileProcessor';

export interface UseJsonFileUploadReturn {
  processFiles: (acceptedFiles: File[]) => Promise<void>;
}

export const useJsonFileUpload = (
  onSuccess: (files: JsonFileData[]) => void,
  onError: (message: string) => void
): UseJsonFileUploadReturn => {
  
  const processFiles = useCallback(async (acceptedFiles: File[]) => {
    try {
      const filePromises = acceptedFiles.map((file) => {
        return new Promise<JsonFileData>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            try {
              const fileContent = reader.result as string;
              const parsedData = JSON.parse(fileContent);
              resolve({
                fileName: file.name.replace('.json', ''),
                data: parsedData
              });
            } catch (error) {
              reject(`Error parsing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          };
          
          reader.onerror = () => reject(`Error reading ${file.name}`);
          reader.readAsText(file);
        });
      });

      const newFiles = await Promise.all(filePromises);
      onSuccess(newFiles);
    } catch (error) {
      onError(`Invalid JSON file: ${error}`);
    }
  }, [onSuccess, onError]);

  return { processFiles };
};