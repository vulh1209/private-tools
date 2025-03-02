/**
 * Utility functions for processing data conversions between JSON, CSV, and Excel formats
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Types for data processing
 */
export type DataValue = string | number | boolean | null | undefined;
export type DataRecord = Record<string, DataValue>;
export type DataArray = DataRecord[];

// Extend DataValue to include Excel cell format
export interface ExcelCellFormat {
  t: string;
  v: string;
}

/**
 * Checks if a string value should be preserved as string during conversion
 * @param value - The value to check
 * @param preserveTypes - Whether to preserve types during conversion
 * @returns Boolean indicating if the value should be preserved as string
 */
export const shouldPreserveAsString = (value: string, preserveTypes: boolean): boolean => {
  return preserveTypes || 
         (typeof value === 'string' && 
          /^\d+$/.test(value) && 
          value.startsWith('0'));
};

/**
 * Parses a CSV file and converts it to JSON
 * @param file - The CSV file to parse
 * @param preserveTypes - Whether to preserve data types
 * @param callback - Callback function to handle the parsed data
 * @param errorCallback - Callback function to handle errors
 */
export const parseCSVToJSON = (
  file: File, 
  preserveTypes: boolean,
  callback: (data: DataArray) => void,
  errorCallback: (message: string) => void
): void => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    complete: (results) => {
      if (results.errors && results.errors.length) {
        errorCallback('Error parsing CSV: ' + results.errors[0].message);
        return;
      }
      
      const processedData = (results.data as unknown[]).map((row) => {
        const rowData = row as Record<string, string>;
        const newRow: DataRecord = {};
        
        for (const key in rowData) {
          const value = rowData[key];
          
          if (shouldPreserveAsString(value, preserveTypes)) {
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
      
      callback(processedData);
    },
    error: (error) => {
      errorCallback('Error parsing CSV: ' + error.message);
    }
  });
};

/**
 * Parses an Excel file and converts it to JSON
 * @param file - The Excel file to parse
 * @param preserveTypes - Whether to preserve data types
 * @param callback - Callback function to handle the parsed data
 * @param errorCallback - Callback function to handle errors
 */
export const parseExcelToJSON = (
  file: File,
  preserveTypes: boolean,
  callback: (data: DataArray) => void,
  errorCallback: (message: string) => void
): void => {
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
      
      const aoaData = XLSX.utils.sheet_to_json(worksheet, excelOptions);
      
      if (aoaData.length < 2) {
        throw new Error('File does not contain enough data');
      }
      
      const headers = aoaData[0] as string[];
      
      const json: DataArray = [];
      for (let i = 1; i < aoaData.length; i++) {
        const row = aoaData[i] as Array<string | number | boolean>;
        const obj: DataRecord = {};
        
        for (let j = 0; j < headers.length; j++) {
          if (j < row.length) {
            const value = row[j];
            
            if (value !== null && value !== undefined) {
              const stringValue = String(value);
              
              if (shouldPreserveAsString(stringValue, preserveTypes)) {
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
      
      callback(json);
    } catch (error) {
      errorCallback('Error parsing Excel file. Please check your file and try again.');
      console.error('Error parsing Excel:', error);
    }
  };
  reader.onerror = () => {
    errorCallback('Error reading file. Please try again.');
  };
  reader.readAsBinaryString(file);
};

/**
 * Preserves data types when converting from JSON to CSV/Excel
 * @param data - The JSON data to process
 * @returns Processed data with preserved types
 */
export const preserveDataTypes = (data: DataArray): DataArray => {
  if (!Array.isArray(data) || data.length === 0) return data;
  
  return data.map(item => {
    const newItem: DataRecord = {};
    
    for (const key in item) {
      // Convert all numeric data to strings to preserve leading zeros
      if (typeof item[key] === 'number') {
        newItem[key] = String(item[key]);
      } 
      // Handle string numbers with leading zeros
      else if (typeof item[key] === 'string' && /^\d+$/.test(item[key] as string) && (item[key] as string).startsWith('0')) {
        newItem[key] = `'${item[key]}`; // Add single quote to prevent XLSX from converting
      } 
      else {
        newItem[key] = item[key];
      }
    }
    
    return newItem;
  });
};

/**
 * Converts JSON data to CSV format and triggers download
 * @param jsonData - The JSON data to convert
 * @param fileName - The name for the output file
 * @param preserveTypes - Whether to preserve data types
 * @param errorCallback - Callback function to handle errors
 */
export const convertJSONToCSV = (
  jsonData: DataArray | Record<string, unknown>,
  fileName: string,
  preserveTypes: boolean,
  errorCallback: (message: string) => void
): void => {
  try {
    let dataToConvert: DataArray = [];
    
    // If the JSON is not an array, try to convert it to an array
    if (!Array.isArray(jsonData)) {
      if (typeof jsonData === 'object' && jsonData !== null) {
        // Handle nested objects
        if (Object.values(jsonData).some(value => Array.isArray(value))) {
          // Find the first array in the object
          for (const key in jsonData) {
            const value = jsonData[key];
            if (Array.isArray(value)) {
              dataToConvert = value as DataArray;
              break;
            }
          }
        } else {
          // Wrap single object in array
          dataToConvert = [jsonData as unknown as DataRecord];
        }
      } else {
        throw new Error('Cannot convert this JSON structure to CSV');
      }
    } else {
      dataToConvert = jsonData;
    }

    // Preserve data types if requested
    if (preserveTypes) {
      dataToConvert = preserveDataTypes(dataToConvert);
    }

    // Convert to CSV
    const csv = Papa.unparse(dataToConvert, {
      quotes: true
    });
    
    // Process to preserve leading zeros
    const processedCsv = csv.replace(/,(\d+),/g, ',"$1",').replace(/^(\d+),/, '"$1",').replace(/,(\d+)$/, ',"$1"');
    
    const blob = new Blob([processedCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName || 'converted'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    errorCallback('Error converting file. The JSON structure might be too complex.');
    console.error('Conversion error:', error);
  }
};

/**
 * Converts JSON data to Excel format and triggers download
 * @param jsonData - The JSON data to convert
 * @param fileName - The name for the output file
 * @param preserveTypes - Whether to preserve data types
 * @param errorCallback - Callback function to handle errors
 */
export const convertJSONToExcel = (
  jsonData: DataArray | Record<string, unknown>,
  fileName: string,
  preserveTypes: boolean,
  errorCallback: (message: string) => void
): void => {
  try {
    let dataToConvert: DataArray = [];
    
    // If the JSON is not an array, try to convert it to an array
    if (!Array.isArray(jsonData)) {
      if (typeof jsonData === 'object' && jsonData !== null) {
        // Handle nested objects
        if (Object.values(jsonData).some(value => Array.isArray(value))) {
          // Find the first array in the object
          for (const key in jsonData) {
            const value = jsonData[key];
            if (Array.isArray(value)) {
              dataToConvert = value as DataArray;
              break;
            }
          }
        } else {
          // Wrap single object in array
          dataToConvert = [jsonData as unknown as DataRecord];
        }
      } else {
        throw new Error('Cannot convert this JSON structure to Excel');
      }
    } else {
      dataToConvert = jsonData;
    }

    // Preserve data types if requested
    if (preserveTypes) {
      dataToConvert = preserveDataTypes(dataToConvert);
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Use array of arrays instead of json_to_sheet for better control
    const headers = Object.keys(dataToConvert[0]);
    const aoa: Array<Array<string | number | boolean | ExcelCellFormat>> = [headers as string[]];
    
    // Convert data to array and ensure leading zeros are preserved
    dataToConvert.forEach((row: DataRecord) => {
      const rowData: Array<string | number | boolean | ExcelCellFormat> = [];
      headers.forEach(header => {
        const value = row[header];
        
        // Check if value is a number or string number with leading zeros
        if (typeof value === 'string' && /^\d+$/.test(value) && value.startsWith('0')) {
          // Mark as text to prevent Excel from converting
          const cellFormat: ExcelCellFormat = { t: 's', v: value };
          rowData.push(cellFormat);
        } else if (value !== undefined && value !== null) {
          rowData.push(value as string | number | boolean);
        } else {
          rowData.push('');
        }
      });
      aoa.push(rowData);
    });
    
    // Create worksheet with additional options to preserve string format
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    
    // Configure cell format to ensure string numbers display correctly
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        
        if (cell && typeof cell.v === 'string' && /^\d+$/.test(cell.v) && cell.v.startsWith('0')) {
          cell.t = 's';  // mark as string
          cell.z = '@';  // display format as text
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Configure write options to preserve strings
    const excelOptions = {
      bookType: 'xlsx',
      type: 'binary',
      cellText: true,
      cellStyles: true,
      raw: false
    };
    
    XLSX.writeFile(workbook, `${fileName || 'converted'}.xlsx`, excelOptions as XLSX.WritingOptions);
  } catch (error) {
    errorCallback('Error converting file. The JSON structure might be too complex.');
    console.error('Conversion error:', error);
  }
};

/**
 * Converts JSON data to downloadable JSON file
 * @param jsonData - The JSON data to convert
 * @param fileName - The name for the output file
 * @param errorCallback - Callback function to handle errors
 */
export const downloadJSON = (
  jsonData: DataArray | Record<string, unknown>,
  fileName: string,
  errorCallback: (message: string) => void
): void => {
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
    errorCallback('Error generating JSON file.');
    console.error('Download error:', error);
  }
}; 