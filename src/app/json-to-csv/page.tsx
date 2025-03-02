'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ThemeToggle } from '../components/ThemeToggle';
import { DataArray, DataRecord } from '../utils/processing';

export default function JsonToCsvPage() {
  const [jsonData, setJsonData] = useState<DataArray | DataRecord | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'csv' | 'excel'>('csv');
  const [preserveTypes, setPreserveTypes] = useState<boolean>(true);

  const resetData = () => {
    setJsonData(null);
    setFileName('');
    setErrorMessage('');
  };

  const onDrop = (acceptedFiles: File[]) => {
    // Xóa dữ liệu cũ khi thả file mới vào
    resetData();
    
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name.replace('.json', ''));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileContent = reader.result as string;
          const parsedData = JSON.parse(fileContent);
          setJsonData(parsedData);
        } catch (error) {
          setErrorMessage('Invalid JSON file. Please check your file and try again.');
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  // Hàm để bảo toàn kiểu dữ liệu của các trường
  const preserveDataTypes = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return data;
    
    return data.map(item => {
      const newItem: Record<string, any> = {};
      
      for (const key in item) {
        // Chuyển tất cả dữ liệu số thành chuỗi để bảo toàn số 0 đầu tiên
        if (typeof item[key] === 'number') {
          newItem[key] = String(item[key]);
        } 
        // Xử lý trường hợp chuỗi số có số 0 đầu tiên
        else if (typeof item[key] === 'string' && /^\d+$/.test(item[key]) && item[key].startsWith('0')) {
          newItem[key] = `'${item[key]}`; // Thêm dấu nháy đơn để XLSX không chuyển đổi
        } 
        else {
          newItem[key] = item[key];
        }
      }
      
      return newItem;
    });
  };

  const convertToCSV = () => {
    if (!jsonData) return;

    try {
      let dataToConvert = jsonData;
      
      // If the JSON is not an array, try to convert it to an array
      if (!Array.isArray(dataToConvert)) {
        if (typeof dataToConvert === 'object') {
          // Handle nested objects
          if (Object.values(dataToConvert).some(value => Array.isArray(value))) {
            // Find the first array in the object
            for (const key in dataToConvert) {
              if (Array.isArray(dataToConvert[key])) {
                dataToConvert = dataToConvert[key];
                break;
              }
            }
          } else {
            // Wrap single object in array
            dataToConvert = [dataToConvert];
          }
        } else {
          throw new Error('Cannot convert this JSON structure to CSV/Excel');
        }
      }

      // Bảo toàn kiểu dữ liệu nếu được yêu cầu
      if (preserveTypes) {
        dataToConvert = preserveDataTypes(dataToConvert);
      }

      if (outputFormat === 'csv') {
        // Convert to CSV
        const csv = Papa.unparse(dataToConvert, {
          // Thêm tùy chọn để không tự động chuyển đổi kiểu dữ liệu
          dynamicTyping: false,
          // Đảm bảo tất cả số được bao quanh bởi dấu ngoặc kép
          quotes: true
        });
        
        // Xử lý thêm để bảo toàn số 0 đầu tiên
        // Đổi ,'123', thành ,"123", để Excel không chuyển thành số
        const processedCsv = csv.replace(/,(\d+),/g, ',"$1",').replace(/^(\d+),/, '"$1",').replace(/,(\d+)$/, ',"$1"');
        
        const blob = new Blob([processedCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName || 'converted'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Convert to Excel
        // Tạo workbook và worksheet
        const workbook = XLSX.utils.book_new();
        
        // Sử dụng aoa (array of arrays) thay vì json_to_sheet để có thể kiểm soát tốt hơn
        const headers = Object.keys(dataToConvert[0]);
        const aoa = [headers];
        
        // Chuyển đổi dữ liệu thành mảng và đảm bảo các số 0 đầu tiên được giữ lại
        dataToConvert.forEach((row: any) => {
          const rowData: any[] = [];
          headers.forEach(header => {
            let value = row[header];
            
            // Kiểm tra nếu giá trị là số hoặc chuỗi số có số 0 đầu tiên
            if (typeof value === 'string' && /^\d+$/.test(value) && value.startsWith('0')) {
              // Đánh dấu là text để Excel không chuyển đổi
              value = { t: 's', v: value };
            }
            
            rowData.push(value);
          });
          aoa.push(rowData);
        });
        
        // Tạo worksheet với các tùy chọn bổ sung để giữ định dạng chuỗi
        const worksheet = XLSX.utils.aoa_to_sheet(aoa);
        
        // Cấu hình định dạng ô để đảm bảo chuỗi số được hiển thị đúng
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress];
            
            if (cell && typeof cell.v === 'string' && /^\d+$/.test(cell.v) && cell.v.startsWith('0')) {
              cell.t = 's';  // đánh dấu là chuỗi
              cell.z = '@';  // định dạng hiển thị là text
            }
          }
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        
        // Cấu hình tùy chọn ghi để giữ nguyên chuỗi
        const excelOptions = {
          bookType: 'xlsx',
          type: 'binary',
          cellText: true,
          cellStyles: true,
          raw: false
        };
        
        XLSX.writeFile(workbook, `${fileName || 'converted'}.xlsx`, excelOptions as XLSX.WritingOptions);
      }
    } catch (error) {
      setErrorMessage('Error converting file. The JSON structure might be too complex.');
      console.error('Conversion error:', error);
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
            Convert JSON to CSV/Excel
          </h1>
        </div>

        <div className="mb-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 dark:bg-gray-700/30'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-500 dark:text-blue-400">Drop the JSON file here...</p>
            ) : (
              <div>
                <p className="mb-2 dark:text-gray-200">Drag & drop a JSON file here, or click to select</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Only .json files are accepted</p>
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
              ✓ JSON file loaded successfully: <span className="font-medium">{fileName}.json</span>
            </p>
            <div className="text-sm dark:text-gray-300">
              {Array.isArray(jsonData) ? (
                <p>Contains an array with {jsonData.length} items</p>
              ) : (
                <p>Contains a JSON object</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Output Format:</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600 dark:text-blue-500"
                  name="outputFormat"
                  value="csv"
                  checked={outputFormat === 'csv'}
                  onChange={() => setOutputFormat('csv')}
                />
                <span className="ml-2 dark:text-gray-300">CSV</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600 dark:text-blue-500"
                  name="outputFormat"
                  value="excel"
                  checked={outputFormat === 'excel'}
                  onChange={() => setOutputFormat('excel')}
                />
                <span className="ml-2 dark:text-gray-300">Excel</span>
              </label>
            </div>
          </div>

          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-500"
                checked={preserveTypes}
                onChange={() => setPreserveTypes(!preserveTypes)}
              />
              <span className="ml-2 dark:text-gray-300">Không tự động chuyển string thành number</span>
            </label>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={convertToCSV}
            disabled={!jsonData}
            className={`flex-1 py-2 px-4 rounded-lg ${
              jsonData
                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            } transition duration-200`}
          >
            Convert and Download
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