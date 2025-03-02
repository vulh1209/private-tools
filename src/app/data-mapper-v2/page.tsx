'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { ThemeToggle } from '../components/ThemeToggle';
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';

// Type definitions
interface FileData {
  id: string;
  name: string;
  structure: Record<string, unknown>;
  rawData: unknown[];
}

interface Connection {
  id: string;
  sourceFile: string;
  sourceField: string;
  targetFile: string;
  targetField: string;
}

interface PropertyCheckbox {
  fileId: string;
  fieldName: string;
  isSelected: boolean;
}

// Interface cho dữ liệu item
interface MergedItem {
  [key: string]: unknown;
}

export default function DataMapperV2Page() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    sourceFile?: string;
    sourceField?: string;
  }>({ isDragging: false });
  const [selectedProperties, setSelectedProperties] = useState<PropertyCheckbox[]>([]);
  const [mergedData, setMergedData] = useState<MergedItem[] | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Sử dụng updateXarrow để cập nhật lại vị trí của các mũi tên
  const updateXarrow = useXarrow();
  
  // Tham chiếu đến phần container chứa các file và connection
  const filesContainerRef = useRef<HTMLDivElement>(null);

  // Memoize hàm cập nhật mũi tên để tránh tạo lại mỗi lần render
  const updateArrows = useCallback(() => {
    // Sử dụng setTimeout để đảm bảo DOM đã được cập nhật trước khi cập nhật mũi tên
    setTimeout(() => {
      updateXarrow();
    }, 100);
  }, [updateXarrow]);

  // Helper function to check if a file is expanded
  const isFileExpanded = (fileId: string): boolean => {
    return expandedFiles.has(fileId);
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      processFiles(acceptedFiles);
    },
    accept: { 'application/json': ['.json'] },
    multiple: true
  });

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    try {
      const newFiles: FileData[] = [];
      
      for (const file of files) {
        const fileContent = await readFileAsText(file);
        let parsedData: any[];
        
        try {
          parsedData = JSON.parse(fileContent);
          
          // If not an array, try to extract array from structure
          if (!Array.isArray(parsedData)) {
            // Look for first array property in the object
            const arrayProp = findFirstArrayProperty(parsedData);
            if (arrayProp) {
              parsedData = parsedData[arrayProp];
            } else {
              // If no array found, wrap in array
              parsedData = [parsedData];
            }
          }
          
          // Extract structure from the first item
          const structure = parsedData.length > 0 ? extractStructure(parsedData[0]) : {};
          
          const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          newFiles.push({
            id: fileId,
            name: file.name,
            structure,
            rawData: parsedData
          });
          
          // Add all properties as selected by default
          const properties: PropertyCheckbox[] = Object.keys(structure).map(fieldName => ({
            fileId,
            fieldName,
            isSelected: true
          }));
          
          setSelectedProperties(prev => [...prev, ...properties]);
          
        } catch (error) {
          console.error(`Error parsing file ${file.name}:`, error);
          setErrorMessage(`Error parsing file ${file.name}. Please check file format.`);
        }
      }
      
      setFiles(prev => [...prev, ...newFiles]);
      setSuccessMessage(`Successfully uploaded ${newFiles.length} file(s)`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Cập nhật vị trí mũi tên sau khi thêm file
      updateArrows();
    } catch (error) {
      console.error('Error processing files:', error);
      setErrorMessage('Error processing files. Please try again.');
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // Extract structure from object
  const extractStructure = (obj: any): Record<string, string> => {
    if (!obj || typeof obj !== 'object') return {};
    
    const structure: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip array fields for simplicity
      if (Array.isArray(value)) {
        structure[key] = 'array';
      } 
      // Handle nested objects
      else if (value !== null && typeof value === 'object') {
        const nestedStructure = extractStructure(value);
        
        // Include flatten nested properties
        for (const [nestedKey, nestedType] of Object.entries(nestedStructure)) {
          structure[`${key}.${nestedKey}`] = nestedType;
        }
      } 
      // Handle basic values
      else {
        structure[key] = typeof value;
      }
    }
    
    return structure;
  };

  // Find first array property in object
  const findFirstArrayProperty = (obj: any): string | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        return key;
      }
    }
    
    return null;
  };

  // Handle field drag start
  const handleDragStart = (fileId: string, fieldName: string) => {
    setDragState({
      isDragging: true,
      sourceFile: fileId,
      sourceField: fieldName
    });
  };

  // Handle field drop
  const handleDrop = (fileId: string, fieldName: string) => {
    if (dragState.isDragging && dragState.sourceFile && dragState.sourceField) {
      // Don't connect fields from the same file
      if (dragState.sourceFile === fileId) {
        setDragState({ isDragging: false });
        return;
      }
      
      // Create new connection
      const newConnection: Connection = {
        id: `connection-${Date.now()}`,
        sourceFile: dragState.sourceFile,
        sourceField: dragState.sourceField,
        targetFile: fileId,
        targetField: fieldName
      };
      
      // Add the connection
      setConnections(prev => [...prev, newConnection]);
      
      // Reset drag state
      setDragState({ isDragging: false });
      
      // Cập nhật vị trí mũi tên sau khi thêm kết nối mới
      updateArrows();
    }
  };

  // Toggle property selection
  const togglePropertySelection = (fileId: string, fieldName: string) => {
    setSelectedProperties(prev => 
      prev.map(prop => 
        prop.fileId === fileId && prop.fieldName === fieldName
          ? { ...prop, isSelected: !prop.isSelected }
          : prop
      )
    );
  };

  // Get field element ID for connections
  const getFieldElementId = (fileId: string, fieldName: string) => {
    return `field-${fileId}-${fieldName.replace(/\./g, '-')}`;
  };

  // Handle merging data
  const mergeData = () => {
    if (files.length < 2 || connections.length === 0) {
      setErrorMessage('Bạn cần ít nhất 2 file và 1 kết nối để merge dữ liệu');
      return;
    }
    
    try {
      // Tạo map để lưu trữ kết quả
      const resultMap = new Map<string, MergedItem>();
      
      // Sử dụng Map để lưu trữ dữ liệu của từng file theo ID và giá trị khóa
      const fileDataMaps = new Map<string, Map<string, unknown>>();
      
      // Xác định file gốc làm điểm bắt đầu
      const primaryFile = files[0];
      const primaryData = [...primaryFile.rawData];
      
      // Xây dựng graph kết nối giữa các file
      const fileGraph = buildFileConnectionGraph();
      
      // Tạo lookup maps cho tất cả các file để truy cập nhanh
      for (const file of files) {
        const fileMap = new Map<string, unknown>();
        fileDataMaps.set(file.id, fileMap);
        
        // Xác định các trường kết nối cho file này
        const connectionFields = getConnectionFieldsForFile(file.id);
        
        // Lập index cho dữ liệu trong file
        for (const item of file.rawData) {
          // Lập index theo mỗi trường kết nối
          for (const field of connectionFields) {
            const keyValue = getNestedValue(item, field);
            if (keyValue !== undefined) {
              fileMap.set(`${field}:${String(keyValue)}`, item);
            }
          }
        }
      }
      
      // Khởi tạo kết quả với dữ liệu từ file gốc
      for (const item of primaryData) {
        const resultItem: MergedItem = {};
        
        // Thêm tất cả các trường được chọn từ file gốc
        for (const prop of selectedProperties) {
          if (prop.fileId === primaryFile.id && prop.isSelected) {
            const value = getNestedValue(item, prop.fieldName);
            if (value !== undefined) {
              resultItem[prop.fieldName] = value;
            }
          }
        }
        
        // Lưu vào map kết quả cho mỗi trường liên kết
        const connectionFields = getConnectionFieldsForFile(primaryFile.id);
        for (const field of connectionFields) {
          const keyValue = getNestedValue(item, field);
          if (keyValue !== undefined) {
            resultMap.set(`${field}:${String(keyValue)}`, resultItem);
          }
        }
      }
      
      // Xử lý tất cả các kết nối để hợp nhất dữ liệu
      processConnectionsRecursively(primaryFile.id, new Set([primaryFile.id]), resultMap, fileDataMaps, fileGraph);
      
      // Chuyển map thành mảng kết quả
      const result = Array.from(new Set(resultMap.values()));
      setMergedData(result);
      setSuccessMessage(`Đã hợp nhất dữ liệu thành công với ${result.length} bản ghi`);
      
    } catch (error) {
      console.error('Lỗi khi hợp nhất dữ liệu:', error);
      setErrorMessage('Lỗi khi hợp nhất dữ liệu. Vui lòng kiểm tra lại các kết nối');
    }
  };
  
  // Xây dựng đồ thị kết nối giữa các file
  const buildFileConnectionGraph = () => {
    const graph = new Map<string, Set<string>>();
    
    // Khởi tạo set rỗng cho mỗi file
    for (const file of files) {
      graph.set(file.id, new Set());
    }
    
    // Thêm các kết nối vào đồ thị
    for (const conn of connections) {
      // Kết nối hai chiều để dễ dàng duyệt đồ thị
      const sourceNeighbors = graph.get(conn.sourceFile);
      const targetNeighbors = graph.get(conn.targetFile);
      
      if (sourceNeighbors && targetNeighbors) {
        sourceNeighbors.add(conn.targetFile);
        targetNeighbors.add(conn.sourceFile);
      }
    }
    
    return graph;
  };
  
  // Lấy tất cả các trường kết nối cho một file cụ thể
  const getConnectionFieldsForFile = (fileId: string) => {
    const fields = new Set<string>();
    
    // Thêm các trường là source trong kết nối
    for (const conn of connections) {
      if (conn.sourceFile === fileId) {
        fields.add(conn.sourceField);
      }
    }
    
    // Thêm các trường là target trong kết nối
    for (const conn of connections) {
      if (conn.targetFile === fileId) {
        fields.add(conn.targetField);
      }
    }
    
    return Array.from(fields);
  };
  
  // Lấy kết nối giữa hai file cụ thể
  const getConnectionsBetweenFiles = (file1Id: string, file2Id: string) => {
    return connections.filter(
      conn => (conn.sourceFile === file1Id && conn.targetFile === file2Id) ||
              (conn.sourceFile === file2Id && conn.targetFile === file1Id)
    );
  };
  
  // Xử lý các kết nối một cách đệ quy để hợp nhất dữ liệu
  const processConnectionsRecursively = (
    currentFileId: string,
    visitedFiles: Set<string>,
    resultMap: Map<string, MergedItem>,
    fileDataMaps: Map<string, Map<string, unknown>>,
    fileGraph: Map<string, Set<string>>
  ) => {
    // Lấy các file kết nối với file hiện tại
    const neighborFiles = fileGraph.get(currentFileId);
    if (!neighborFiles) return;
    
    // Duyệt qua mỗi file láng giềng
    for (const neighborFileId of neighborFiles) {
      // Bỏ qua nếu đã xử lý file này
      if (visitedFiles.has(neighborFileId)) continue;
      
      // Đánh dấu file láng giềng đã được xử lý
      visitedFiles.add(neighborFileId);
      
      // Lấy các kết nối giữa file hiện tại và file láng giềng
      const filePairConnections = getConnectionsBetweenFiles(currentFileId, neighborFileId);
      
      // Xử lý mỗi kết nối
      for (const conn of filePairConnections) {
        // Xác định nguồn và đích của kết nối
        let sourceFile, sourceField, targetFile, targetField;
        
        if (conn.sourceFile === currentFileId) {
          sourceFile = currentFileId;
          sourceField = conn.sourceField;
          targetFile = neighborFileId;
          targetField = conn.targetField;
        } else {
          sourceFile = neighborFileId;
          sourceField = conn.sourceField;
          targetFile = currentFileId;
          targetField = conn.targetField;
        }
        
        // Lấy dữ liệu nguồn và đích
        const sourceFileData = fileDataMaps.get(sourceFile);
        const targetFileData = fileDataMaps.get(targetFile);
        
        if (!sourceFileData || !targetFileData) continue;
        
        // Lấy tất cả các mục đã được kết hợp với dữ liệu của file hiện tại
        const sourceEntries = Array.from(resultMap.entries())
          .filter(([key, _]) => key.startsWith(`${sourceField}:`));
        
        // Hợp nhất dữ liệu dựa trên kết nối
        for (const [sourceKey, resultItem] of sourceEntries) {
          const keyValue = sourceKey.split(':')[1];
          const targetKey = `${targetField}:${keyValue}`;
          const targetItem = targetFileData.get(targetKey);
          
          if (targetItem) {
            // Thêm các trường được chọn từ targetFile vào resultItem
            for (const prop of selectedProperties) {
              if (prop.fileId === targetFile && prop.isSelected) {
                const value = getNestedValue(targetItem, prop.fieldName);
                if (value !== undefined) {
                  resultItem[prop.fieldName] = value;
                }
              }
            }
          }
        }
      }
      
      // Xử lý đệ quy cho file láng giềng
      processConnectionsRecursively(neighborFileId, visitedFiles, resultMap, fileDataMaps, fileGraph);
    }
  };

  // Helper to access nested object properties with dot notation
  const getNestedValue = (obj: unknown, path: string): unknown => {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return undefined;
    }
    
    const keys = path.split('.');
    let current: any = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    return current;
  };

  // Download merged data
  const downloadMergedData = () => {
    if (!mergedData || mergedData.length === 0) {
      setErrorMessage('No merged data to download');
      return;
    }
    
    try {
      const json = JSON.stringify(mergedData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMessage('Downloaded merged data as JSON');
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Error downloading data');
    }
  };

  // Remove a file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Remove connections associated with this file
    setConnections(prev => prev.filter(
      c => c.sourceFile !== fileId && c.targetFile !== fileId
    ));
    
    // Remove property selections for this file
    setSelectedProperties(prev => prev.filter(
      p => p.fileId !== fileId
    ));
    
    // Remove from expanded files if present
    if (expandedFiles.has(fileId)) {
      const newExpandedFiles = new Set(expandedFiles);
      newExpandedFiles.delete(fileId);
      setExpandedFiles(newExpandedFiles);
    }
    
    // Reset merged data
    setMergedData(null);
    
    // Cập nhật vị trí mũi tên sau khi xóa file
    updateArrows();
  };

  // Remove a connection
  const removeConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    
    // Reset merged data since connections changed
    setMergedData(null);
  };

  // Reset all data
  const resetAll = () => {
    setFiles([]);
    setConnections([]);
    setSelectedProperties([]);
    setMergedData(null);
    setErrorMessage('');
    setSuccessMessage('');
    setDragState({ isDragging: false });
    setExpandedFiles(new Set());
  };

  // Toggle file expansion - update to add/remove fileId from/out of Set
  const toggleFileExpansion = (fileId: string) => {
    const newExpandedFiles = new Set(expandedFiles);
    if (newExpandedFiles.has(fileId)) {
      newExpandedFiles.delete(fileId);
    } else {
      newExpandedFiles.add(fileId);
    }
    setExpandedFiles(newExpandedFiles);
    
    // Cập nhật vị trí mũi tên sau khi mở rộng/thu gọn file
    updateArrows();
  };
  
  // Expand or collapse all files
  const toggleAllFiles = () => {
    if (expandedFiles.size === files.length) {
      // If all files are already expanded, collapse all
      setExpandedFiles(new Set());
    } else {
      // Expand all
      const allFileIds = files.map(file => file.id);
      setExpandedFiles(new Set(allFileIds));
    }
    
    // Cập nhật vị trí mũi tên sau khi mở rộng/thu gọn tất cả
    updateArrows();
  };
  
  // Sửa lỗi Maximum update depth - loại bỏ updateXarrow khỏi dependencies
  useEffect(() => {
    // Cập nhật mũi tên khi danh sách file hoặc kết nối thay đổi
    updateXarrow();
  }, [files, connections, expandedFiles]); // Không sử dụng updateXarrow làm dependency
  
  // Xử lý sự kiện thay đổi kích thước cửa sổ
  useEffect(() => {
    const handleResize = () => {
      updateXarrow();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Không sử dụng updateXarrow làm dependency
  
  // Danh sách các ID field đã được render - giúp kiểm tra kết nối có hợp lệ không
  const renderedFieldIds = useMemo(() => {
    const ids = new Set<string>();
    
    files.forEach(file => {
      if (isFileExpanded(file.id)) {
        Object.keys(file.structure).forEach(fieldName => {
          ids.add(getFieldElementId(file.id, fieldName));
        });
      }
    });
    
    return ids;
  }, [files, expandedFiles]);

  // Lọc kết nối hợp lệ - chỉ hiển thị các kết nối mà cả source và target đều tồn tại
  const validConnections = useMemo(() => {
    return connections.filter(conn => 
      renderedFieldIds.has(getFieldElementId(conn.sourceFile, conn.sourceField)) && 
      renderedFieldIds.has(getFieldElementId(conn.targetFile, conn.targetField))
    );
  }, [connections, renderedFieldIds]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Data Mapper V2</h1>
        <div className="flex space-x-4">
          <Link href="/" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">
            Back to Home
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* File upload area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed p-6 mb-6 rounded-lg text-center cursor-pointer transition ${
          isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-lg mb-2">Drag & drop JSON files here, or click to select files</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You can upload multiple JSON files to create relationships between them
        </p>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative dark:bg-red-900/30 dark:text-red-300">
          <span className="block sm:inline">{errorMessage}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setErrorMessage('')}
          >
            ×
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative dark:bg-green-900/30 dark:text-green-300">
          <span className="block sm:inline">{successMessage}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setSuccessMessage('')}
          >
            ×
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Uploaded Files</h2>
            <button 
              onClick={toggleAllFiles}
              className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            >
              {expandedFiles.size === files.length ? "Thu gọn tất cả" : "Mở rộng tất cả"}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-6" ref={filesContainerRef}>
            <Xwrapper>
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="border rounded-lg p-4 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <button 
                        onClick={() => toggleFileExpansion(file.id)}
                        className="mr-2 text-gray-500 dark:text-gray-400"
                      >
                        {isFileExpanded(file.id) ? '▼' : '►'}
                      </button>
                      <h3 className="font-medium text-lg">{file.name}</h3>
                    </div>
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {isFileExpanded(file.id) && (
                    <div className="mt-3 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                      <div className="text-sm mb-2 text-gray-500">Fields:</div>
                      {Object.entries(file.structure).map(([fieldName, fieldType]) => (
                        <div 
                          key={`${file.id}-${fieldName}`}
                          id={getFieldElementId(file.id, fieldName)}
                          className="flex items-center mb-2 p-2 border rounded bg-gray-50 dark:bg-gray-900/50 cursor-pointer"
                          draggable
                          onDragStart={() => handleDragStart(file.id, fieldName)}
                          onDrop={() => handleDrop(file.id, fieldName)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProperties.find(
                              p => p.fileId === file.id && p.fieldName === fieldName
                            )?.isSelected ?? false}
                            onChange={() => togglePropertySelection(file.id, fieldName)}
                            className="mr-2"
                          />
                          <span className="font-mono text-sm">{fieldName}</span>
                          <span className="ml-2 text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-1 rounded">
                            {fieldType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Render connections với kiểu smooth, cải thiện hiển thị */}
              {validConnections.map(conn => (
                <div key={conn.id} className="connection-wrapper">
                  <Xarrow
                    start={getFieldElementId(conn.sourceFile, conn.sourceField)}
                    end={getFieldElementId(conn.targetFile, conn.targetField)}
                    color="#4f46e5"
                    strokeWidth={2}
                    curveness={0.8}
                    startAnchor="right"
                    endAnchor="left"
                    path="smooth"
                    zIndex={50}
                    animateDrawing={0.3}
                  />
                  <div 
                    className="absolute bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full cursor-pointer dark:bg-indigo-900 dark:text-indigo-200"
                    style={{ 
                      top: `${Math.random() * 20 + 10}px`, 
                      right: `${Math.random() * 30 + 50}%`,
                      zIndex: 100
                    }}
                    onClick={() => removeConnection(conn.id)}
                  >
                    {conn.sourceField} → {conn.targetField} ✕
                  </div>
                </div>
              ))}
            </Xwrapper>
          </div>

          <div className="flex mt-6 gap-3">
            <button
              onClick={mergeData}
              disabled={files.length < 2 || connections.length === 0}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Merge Data
            </button>
            
            <button
              onClick={downloadMergedData}
              disabled={!mergedData}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download Merged Data
            </button>
            
            <button
              onClick={resetAll}
              className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      {/* Preview merged data */}
      {mergedData && mergedData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Merged Data Preview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {Object.keys(mergedData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {mergedData.slice(0, 10).map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                    {Object.values(item).map((value: unknown, valueIndex) => (
                      <td 
                        key={valueIndex}
                        className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300"
                      >
                        {typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value).length > 30 
                            ? `${String(value).substring(0, 30)}...` 
                            : String(value)
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mergedData.length > 10 && (
            <div className="text-center text-gray-500 mt-2">
              Showing first 10 of {mergedData.length} records
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {files.length > 0 && connections.length === 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mt-6 dark:bg-blue-900/20">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">How to create connections</h3>
          <ol className="list-decimal pl-5 text-blue-700 dark:text-blue-200">
            <li className="mb-1">Expand files using the arrow button</li>
            <li className="mb-1">Drag a field from one file and drop it onto a field in another file</li>
            <li className="mb-1">Use checkboxes to select which fields should appear in the output</li>
            <li className="mb-1">Click "Merge Data" to combine the files based on your connections</li>
          </ol>
        </div>
      )}
    </div>
  );
} 