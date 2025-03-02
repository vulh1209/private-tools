'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ThemeToggle } from '../components/ThemeToggle';
import { DataArray, DataRecord } from '../utils/processing';

export default function CsvToJsonPage() {
  const [jsonData, setJsonData] = useState<DataArray | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'excel' | ''>('');
  const [preserveTypes, setPreserveTypes] = useState<boolean>(true);

  const resetData = () => {
    setJsonData(null);
    setFileName('');
    setErrorMessage('');
    setFileType('');
  };

  const onDrop = (acceptedFiles: File[]) => {
    resetData();
    
    const file = acceptedFiles[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      setFileName(file.name.replace(`.${fileExtension}`, ''));
      
      if (fileExtension === 'csv') {
        setFileType('csv');
        parseCSV(file);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        setFileType('excel');
        parseExcel(file);
      } else {
        setErrorMessage('Unsupported file format. Please upload a CSV or Excel file.');
      }
    }
  };

  const shouldPreserveAsString = (value: string): boolean => {
    return preserveTypes || 
           (typeof value === 'string' && 
            /^\d+$/.test(value) && 
            value.startsWith('0'));
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors && results.errors.length) {
          setErrorMessage('Error parsing CSV: ' + results.errors[0].message);
          return;
        }
        
        const processedData = (results.data as Record<string, string>[]).map((row) => {
          const newRow: DataRecord = {};
          
          for (const key in row) {
            const value = row[key];
            
            if (shouldPreserveAsString(value)) {
              newRow[key] = value;
            } else {
              const trimmedValue = value.trim();
              if (trimmedValue === '') {
                newRow[key] = '';
              } else if (!isNaN(Number(trimmedValue)) && !/^0\d+$/.test(trimmedValue)) {
                newRow[key] = trimmedValue;
              } else {
                newRow[key] = value;
              }
            }
          }
          
          return newRow;
        });
        
        setJsonData(processedData);
      },
      error: (error) => {
        setErrorMessage('Error parsing CSV: ' + error.message);
      }
    });
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { 
          type: 'binary',
          raw: true
        });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const excelOptions = { 
          header: 1,
          raw: false,
          defval: '',
          blankrows: false
        };
        
        const aoaData = XLSX.utils.sheet_to_json(worksheet, excelOptions) as Array<Array<string | number | boolean>>;
        
        if (aoaData.length < 2) {
          throw new Error('File không chứa đủ dữ liệu');
        }
        
        const headers = aoaData[0] as string[];
        
        const json = [];
        for (let i = 1; i < aoaData.length; i++) {
          const row = aoaData[i] as Array<string | number | boolean>;
          const obj: DataRecord = {};
          
          for (let j = 0; j < headers.length; j++) {
            if (j < row.length) {
              const value = row[j];
              
              if (value !== null && value !== undefined) {
                const stringValue = String(value);
                
                if (shouldPreserveAsString(stringValue)) {
                  obj[headers[j]] = stringValue;
                } else {
                  const trimmedValue = stringValue.trim();
                  if (trimmedValue === '') {
                    obj[headers[j]] = '';
                  } else if (!isNaN(Number(trimmedValue)) && !/^0\d+$/.test(trimmedValue)) {
                    obj[headers[j]] = trimmedValue;
                  } else {
                    obj[headers[j]] = stringValue;
                  }
                }
              } else {
                obj[headers[j]] = '';
              }
            } else {
              obj[headers[j]] = '';
            }
          }
          
          json.push(obj);
        }
        
        setJsonData(json);
      } catch (error) {
        setErrorMessage('Error parsing Excel file. Please check your file and try again.');
        console.error('Error parsing Excel:', error);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error reading file. Please try again.');
    };
    reader.readAsBinaryString(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const downloadJson = () => {
    if (!jsonData) return;

    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName || 'converted'}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setErrorMessage('Error generating JSON file.');
      console.error('Download error:', error);
    }
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
            Convert CSV/Excel to JSON
          </h1>
        </div>

        <div className="mb-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer ${
              isDragActive 
                ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 dark:bg-gray-700/30'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-green-500 dark:text-green-400">Drop the file here...</p>
            ) : (
              <div>
                <p className="mb-2 dark:text-gray-200">Drag & drop a CSV or Excel file here, or click to select</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Supported formats: CSV, XLS, XLSX</p>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}

        {jsonData && (
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg mb-6">
            <p className="text-green-700 dark:text-green-400 mb-2">
              ✓ {fileType === 'csv' ? 'CSV' : 'Excel'} file loaded successfully: <span className="font-medium">{fileName}.{fileType === 'csv' ? 'csv' : 'xlsx'}</span>
            </p>
            <div className="text-sm dark:text-gray-300">
              <p>Converted to JSON with {jsonData.length} records</p>
            </div>
          </div>
        )}

        {jsonData && (
          <div className="mb-6">
            <h3 className="font-medium mb-2 dark:text-gray-200">Preview:</h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60">
              <pre className="text-xs dark:text-gray-300">
                {JSON.stringify(jsonData.slice(0, 3), null, 2)}
                {jsonData.length > 3 && '\n...and ' + (jsonData.length - 3) + ' more records'}
              </pre>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-green-600 dark:text-green-500"
              checked={preserveTypes}
              onChange={() => setPreserveTypes(!preserveTypes)}
            />
            <span className="ml-2 dark:text-gray-300">Không tự động chuyển string thành number</span>
          </label>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={downloadJson}
            disabled={!jsonData}
            className={`flex-1 py-2 px-4 rounded-lg ${
              jsonData
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            } transition duration-200`}
          >
            Convert and Download JSON
          </button>
          
          <button
            onClick={resetData}
            className="py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition duration-200"
          >
            Reset
          </button>
        </div>
      </div>
    </main>
  );
} 