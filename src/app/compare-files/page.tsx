"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "../components/ThemeToggle";

interface TokenData {
  tokenId: string;
  reward?: number;
  address?: string;
  nftId?: string | number;
  atherId?: string | number;
  [key: string]: any;
}

interface DifferenceItem {
  tokenId: string;
  file1: {
    reward: number | null;
    address: string | null;
    nftId: string | null;
    atherId: string | null;
  };
  file2: {
    reward: number | null;
    address: string | null;
    nftId: string | null;
    atherId: string | null;
  };
  differences: string[];
}

export default function CompareFiles() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [differences, setDifferences] = useState<DifferenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [activeDiffField, setActiveDiffField] = useState<string>("all");

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile1(e.target.files[0]);
      setError(null);
      setDebug(null);
    }
  };

  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile2(e.target.files[0]);
      setError(null);
      setDebug(null);
    }
  };

  const readFileAsJson = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          resolve(json);
        } catch (error) {
          reject(new Error(`Invalid JSON file: ${file.name}`));
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    });
  };

  const findTokensInNestedStructure = (data: any, map: Map<string, TokenData>) => {
    const processObject = (obj: any, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      // Check if this object has tokenId property
      if (obj.tokenId !== undefined) {
        const tokenIdStr = String(obj.tokenId);
        
        // Create a token data object with all relevant fields
        const tokenData: TokenData = { 
          tokenId: tokenIdStr,
          reward: typeof obj.reward === 'number' ? obj.reward : undefined,
          address: obj.address !== undefined ? String(obj.address) : undefined,
          nftId: obj.nftId !== undefined ? String(obj.nftId) : undefined,
          atherId: obj.atherId !== undefined ? String(obj.atherId) : undefined,
        };
        
        // Add any other fields that might be present
        Object.keys(obj).forEach(key => {
          if (key !== 'tokenId' && !tokenData[key]) {
            tokenData[key] = obj[key];
          }
        });
        
        map.set(tokenIdStr, tokenData);
        return;
      }
      
      // Recursively process objects and arrays
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const newPath = path ? `${path}.${key}` : key;
          
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (item && typeof item === 'object') {
                processObject(item, `${newPath}[${index}]`);
              }
            });
          } else if (value && typeof value === 'object') {
            processObject(value, newPath);
          }
        }
      }
    };
    
    processObject(data);
  };

  const compareFields = (
    tokenId: string, 
    item1: TokenData | undefined, 
    item2: TokenData | undefined
  ): DifferenceItem => {
    const differences: string[] = [];
    
    const result: DifferenceItem = {
      tokenId,
      file1: {
        reward: item1?.reward !== undefined ? Number(item1.reward) : null,
        address: item1?.address || null,
        nftId: item1?.nftId ? String(item1.nftId) : null,
        atherId: item1?.atherId ? String(item1.atherId) : null,
      },
      file2: {
        reward: item2?.reward !== undefined ? Number(item2.reward) : null,
        address: item2?.address || null,
        nftId: item2?.nftId ? String(item2.nftId) : null,
        atherId: item2?.atherId ? String(item2.atherId) : null,
      },
      differences: []
    };
    
    // Compare rewards
    if (item1?.reward !== undefined && item2?.reward !== undefined) {
      if (item1.reward !== item2.reward) {
        differences.push("reward");
      }
    } else if ((item1?.reward !== undefined) !== (item2?.reward !== undefined)) {
      differences.push("reward");
    }
    
    // Compare addresses
    if (item1?.address !== undefined && item2?.address !== undefined) {
      if (item1.address !== item2.address) {
        differences.push("address");
      }
    } else if ((item1?.address !== undefined) !== (item2?.address !== undefined)) {
      differences.push("address");
    }
    
    // Compare nftId
    if (item1?.nftId !== undefined && item2?.nftId !== undefined) {
      if (String(item1.nftId) !== String(item2.nftId)) {
        differences.push("nftId");
      }
    } else if ((item1?.nftId !== undefined) !== (item2?.nftId !== undefined)) {
      differences.push("nftId");
    }
    
    // Compare atherId
    if (item1?.atherId !== undefined && item2?.atherId !== undefined) {
      if (String(item1.atherId) !== String(item2.atherId)) {
        differences.push("atherId");
      }
    } else if ((item1?.atherId !== undefined) !== (item2?.atherId !== undefined)) {
      differences.push("atherId");
    }
    
    result.differences = differences;
    return result;
  };

  const compareFiles = async () => {
    if (!file1 || !file2) {
      setError("Vui lòng tải lên cả hai file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebug(null);
    setDifferences([]);

    try {
      // Read files
      const fileContent1 = await readFileAsJson(file1);
      const fileContent2 = await readFileAsJson(file2);
      
      // Debug info
      setDebug(`File 1: ${file1.name}, File 2: ${file2.name}`);
      
      // Create maps for quicker lookup
      const tokenMap1 = new Map<string, TokenData>();
      const tokenMap2 = new Map<string, TokenData>();
      
      // Process files using the recursive function to find tokens anywhere in the structure
      findTokensInNestedStructure(fileContent1, tokenMap1);
      findTokensInNestedStructure(fileContent2, tokenMap2);
      
      // Update debug info
      setDebug(prev => `${prev}\nTokens found in file 1: ${tokenMap1.size}, in file 2: ${tokenMap2.size}`);
      
      if (tokenMap1.size === 0 && tokenMap2.size === 0) {
        setError("Không tìm thấy dữ liệu tokenId trong cả hai file. Vui lòng kiểm tra cấu trúc file JSON.");
        setIsLoading(false);
        return;
      }
      
      // Find all unique tokenIds across both files
      const allTokenIds = new Set<string>([
        ...Array.from(tokenMap1.keys()),
        ...Array.from(tokenMap2.keys())
      ]);
      
      // Compare all tokens
      const diffs: DifferenceItem[] = [];
      
      allTokenIds.forEach(tokenId => {
        const item1 = tokenMap1.get(tokenId);
        const item2 = tokenMap2.get(tokenId);
        
        // Compare the two items and collect differences
        const diffItem = compareFields(tokenId, item1, item2);
        
        // Only add if there are differences or if one file is missing the token
        if (diffItem.differences.length > 0 || !item1 || !item2) {
          diffs.push(diffItem);
        }
      });
      
      // Sort differences by tokenId for better readability
      const sortedDiffs = diffs.sort((a, b) => {
        const idA = parseInt(a.tokenId) || 0;
        const idB = parseInt(b.tokenId) || 0;
        return idA - idB;
      });
      
      setDifferences(sortedDiffs);
      
      // Update debug info
      setDebug(prev => `${prev}\nSo sánh hoàn tất. Tìm thấy ${sortedDiffs.length} sự khác biệt.`);
      
      if (sortedDiffs.length === 0) {
        setDebug(prev => `${prev}\nKhông có sự khác biệt nào giữa các tokenId.`);
      }
    } catch (error) {
      console.error("Compare error:", error);
      setError((error as Error).message || "Đã xảy ra lỗi khi so sánh file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string) => {
    setActiveDiffField(field);
  };

  const getFilteredDifferences = () => {
    if (activeDiffField === "all") {
      return differences;
    }
    
    return differences.filter(diff => 
      diff.differences.includes(activeDiffField) || 
      (!diff.file1[activeDiffField as keyof typeof diff.file1] && diff.file2[activeDiffField as keyof typeof diff.file2]) ||
      (diff.file1[activeDiffField as keyof typeof diff.file1] && !diff.file2[activeDiffField as keyof typeof diff.file2])
    );
  };

  const downloadResults = () => {
    if (differences.length === 0) return;
    
    const csvContent = 
      "TokenID,File1_Reward,File2_Reward,File1_Address,File2_Address,File1_NftId,File2_NftId,File1_AtherId,File2_AtherId,DifferentFields\n" +
      differences.map(diff => {
        return [
          diff.tokenId,
          diff.file1.reward ?? "N/A",
          diff.file2.reward ?? "N/A",
          diff.file1.address ?? "N/A",
          diff.file2.address ?? "N/A",
          diff.file1.nftId ?? "N/A",
          diff.file2.nftId ?? "N/A",
          diff.file1.atherId ?? "N/A",
          diff.file2.atherId ?? "N/A",
          diff.differences.join(", ")
        ].join(",");
      }).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "token_differences.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDifferences = getFilteredDifferences();

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-6xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg relative">
        <div className="absolute top-4 right-4 flex gap-4">
          <Link 
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
          >
            Home
          </Link>
          <ThemeToggle />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          So sánh chi tiết thông tin theo TokenID
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">File 1</h2>
            <input
              type="file"
              accept=".json"
              onChange={handleFile1Change}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/20 dark:file:text-amber-400 dark:hover:file:bg-amber-800/30"
            />
            {file1 && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Đã chọn: {file1.name}
              </p>
            )}
          </div>
          
          <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">File 2</h2>
            <input
              type="file"
              accept=".json"
              onChange={handleFile2Change}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/20 dark:file:text-amber-400 dark:hover:file:bg-amber-800/30"
            />
            {file2 && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Đã chọn: {file2.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-center mb-8">
          <button
            onClick={compareFiles}
            disabled={isLoading || !file1 || !file2}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Đang so sánh..." : "So sánh files"}
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        
        {debug && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md whitespace-pre-line">
            <h3 className="font-medium mb-2">Thông tin debug:</h3>
            {debug}
          </div>
        )}
        
        {differences.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Đã tìm thấy {differences.length} sự khác biệt
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleFilterChange("all")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeDiffField === "all" 
                      ? "bg-amber-600 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Tất cả ({differences.length})
                </button>
                <button 
                  onClick={() => handleFilterChange("reward")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeDiffField === "reward" 
                      ? "bg-amber-600 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Reward ({differences.filter(d => d.differences.includes("reward")).length})
                </button>
                <button 
                  onClick={() => handleFilterChange("address")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeDiffField === "address" 
                      ? "bg-amber-600 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Address ({differences.filter(d => d.differences.includes("address")).length})
                </button>
                <button 
                  onClick={() => handleFilterChange("nftId")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeDiffField === "nftId" 
                      ? "bg-amber-600 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  NftId ({differences.filter(d => d.differences.includes("nftId")).length})
                </button>
                <button 
                  onClick={() => handleFilterChange("atherId")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeDiffField === "atherId" 
                      ? "bg-amber-600 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  AtherId ({differences.filter(d => d.differences.includes("atherId")).length})
                </button>
                <button
                  onClick={downloadResults}
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors ml-auto"
                >
                  Tải về CSV
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Token ID
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Khác biệt
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reward
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      NFT ID
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ather ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredDifferences.map((diff, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : ""}>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {diff.tokenId}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap gap-1">
                          {diff.differences.map((field, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              {field}
                            </span>
                          ))}
                          {diff.differences.length === 0 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              {!diff.file1.reward ? "Chỉ File 2" : "Chỉ File 1"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <div className={`flex flex-col ${diff.differences.includes("reward") ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                          <div className="mb-1">F1: {diff.file1.reward !== null ? diff.file1.reward : "—"}</div>
                          <div>F2: {diff.file2.reward !== null ? diff.file2.reward : "—"}</div>
                          {diff.file1.reward !== null && diff.file2.reward !== null && (
                            <div className={`text-xs mt-1 ${
                              (diff.file2.reward - diff.file1.reward) > 0 
                                ? "text-green-600 dark:text-green-400" 
                                : (diff.file2.reward - diff.file1.reward) < 0 
                                  ? "text-red-600 dark:text-red-400" 
                                  : ""
                            }`}>
                              Δ: {(diff.file2.reward - diff.file1.reward) > 0 ? "+" : ""}
                              {diff.file2.reward - diff.file1.reward}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <div className={`flex flex-col ${diff.differences.includes("address") ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                          <div className="mb-1 truncate max-w-[150px]" title={diff.file1.address || ""}>F1: {diff.file1.address || "—"}</div>
                          <div className="truncate max-w-[150px]" title={diff.file2.address || ""}>F2: {diff.file2.address || "—"}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <div className={`flex flex-col ${diff.differences.includes("nftId") ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                          <div className="mb-1">F1: {diff.file1.nftId || "—"}</div>
                          <div>F2: {diff.file2.nftId || "—"}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <div className={`flex flex-col ${diff.differences.includes("atherId") ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                          <div className="mb-1">F1: {diff.file1.atherId || "—"}</div>
                          <div>F2: {diff.file2.atherId || "—"}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 