'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { ThemeToggle } from '../components/ThemeToggle';
import Papa from 'papaparse';

// Định nghĩa kiểu dữ liệu
interface TokenData {
  tokenId: string;
  address: string;
  nftId: number;
  race: string;
}

interface AtherSessionData {
  ather_id: string;
  total_session_closed_alpha: string;
  total_session_open_alpha: string;
  total_session_open_beta: string;
}

interface AtherAddressData {
  address: string;
  atherId: string;
}

interface MappedData {
  tokenId?: string;
  address?: string;
  nftId?: number;
  race?: string;
  xValue?: number;
  atherId?: string;
  total_session_closed_alpha?: number;
  total_session_open_alpha?: number;
  total_session_open_beta?: number;
  all_session?: number;
  type?: string;
  season?: string;
  reward?: number;
}

export default function DataMapperPage() {
  const [tokenData, setTokenData] = useState<TokenData[] | null>(null);
  const [atherSessionData, setAtherSessionData] = useState<AtherSessionData[] | null>(null);
  const [atherAddressData, setAtherAddressData] = useState<AtherAddressData[] | null>(null);
  const [mappedData, setMappedData] = useState<MappedData[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'json' | 'csv'>('json');
  const [totalReward, setTotalReward] = useState<number>(0);

  // Thêm state để lưu trữ type và season
  const [extractedType, setExtractedType] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [extractedSeason, setExtractedSeason] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [tokenFileName, setTokenFileName] = useState<string>('');

  const X = 1500;

  // Bảng ánh xạ race
  const raceValueMap: Record<string, number> = {
    Canis: X,
    BioZ: 1.5 * X,
    Cyborg: 2 * X,
    Cosmic: 3 * X,
    Felis: X,
    Synthetic: 1.5 * X,
    Phasewalker: 2 * X,
    Crystalis: 3 * X,
  };

  // Cấu hình cho dropzone file 1
  const {
    getRootProps: getTokenRootProps,
    getInputProps: getTokenInputProps,
    isDragActive: isTokenDragActive,
  } = useDropzone({
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (file) {
        // Lưu tên file để phân tích
        const fileName = file.name;
        setTokenFileName(fileName);

        // Phân tích tên file để trích xuất type và season
        let type = null;
        if (fileName.toLowerCase().includes('inu')) {
          type = 'inu';
        } else if (fileName.toLowerCase().includes('neko')) {
          type = 'neko';
        }
        setExtractedType(type);
        setSelectedType(type);

        let season = null;
        if (fileName.includes('CA') || fileName.toLowerCase().includes('closed_alpha')) {
          season = 'CA';
        } else if (fileName.includes('OA') || fileName.toLowerCase().includes('open_alpha')) {
          season = 'OA';
        } else if (fileName.includes('OB') || fileName.toLowerCase().includes('open_beta')) {
          season = 'OB';
        }
        setExtractedSeason(season);
        setSelectedSeason(season);

        const reader = new FileReader();
        reader.onload = e => {
          try {
            const fileContent = e.target?.result as string;
            const parsedData = JSON.parse(fileContent) as TokenData[];
            setTokenData(parsedData);
          } catch (error) {
            setErrorMessage('Lỗi khi đọc file Token Data. Vui lòng kiểm tra định dạng file.');
            console.error('Error parsing Token Data:', error);
          }
        };
        reader.readAsText(file);
      }
    },
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
  });

  // Cấu hình cho dropzone file 2
  const {
    getRootProps: getAtherSessionRootProps,
    getInputProps: getAtherSessionInputProps,
    isDragActive: isAtherSessionDragActive,
  } = useDropzone({
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const fileContent = e.target?.result as string;
            const parsedData = JSON.parse(fileContent) as AtherSessionData[];
            setAtherSessionData(parsedData);
          } catch (error) {
            setErrorMessage(
              'Lỗi khi đọc file Ather Session Data. Vui lòng kiểm tra định dạng file.'
            );
            console.error('Error parsing Ather Session Data:', error);
          }
        };
        reader.readAsText(file);
      }
    },
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
  });

  // Cấu hình cho dropzone file 3
  const {
    getRootProps: getAtherAddressRootProps,
    getInputProps: getAtherAddressInputProps,
    isDragActive: isAtherAddressDragActive,
  } = useDropzone({
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const fileContent = e.target?.result as string;
            const parsedData = JSON.parse(fileContent) as AtherAddressData[];
            setAtherAddressData(parsedData);
          } catch (error) {
            setErrorMessage(
              'Lỗi khi đọc file Ather Address Data. Vui lòng kiểm tra định dạng file.'
            );
            console.error('Error parsing Ather Address Data:', error);
          }
        };
        reader.readAsText(file);
      }
    },
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
  });

  // Hàm kết hợp dữ liệu từ 3 file
  const mapData = () => {
    if (!tokenData || !atherSessionData || !atherAddressData || !selectedType || !selectedSeason) {
      setErrorMessage(
        'Vui lòng upload đủ 3 file và xác định loại (type) và mùa (season) để thực hiện map data.'
      );
      return;
    }

    try {
      // Map dữ liệu từ 3 file
      const result: MappedData[] = [];

      // Đảm bảo rằng type và season không phải null
      const typeValue = selectedType || '';
      const seasonValue = selectedSeason || '';

      // Tạo bảng ánh xạ địa chỉ -> atherId từ file 3
      const addressToAtherId: Record<string, string> = {};
      atherAddressData.forEach(item => {
        // Đảm bảo lưu địa chỉ dưới dạng lowercase để so sánh nhất quán
        addressToAtherId[item.address.toLowerCase()] = item.atherId;
      });

      // Tạo bảng ánh xạ atherId/ather_id -> session data từ file 2
      const atherIdToSessionData: Record<string, AtherSessionData> = {};
      atherSessionData.forEach(item => {
        // Lưu trữ theo ather_id gốc
        atherIdToSessionData[item.ather_id] = item;

        // Lưu thêm dạng lowercase để tăng khả năng map đúng
        // Chỉ lưu nếu dạng lowercase khác với dạng gốc (tránh ghi đè không cần thiết)
        if (item.ather_id.toLowerCase() !== item.ather_id) {
          atherIdToSessionData[item.ather_id.toLowerCase()] = item;
        }
      });

      // Xử lý từ file 1 và kết hợp dữ liệu
      tokenData.forEach(tokenItem => {
        const mappedItem: MappedData = {
          tokenId: tokenItem.tokenId,
          address: tokenItem.address,
          nftId: tokenItem.nftId,
          race: tokenItem.race,
          xValue: raceValueMap[tokenItem.race] || 0,
          atherId: '', // Luôn có giá trị mặc định là chuỗi rỗng
          total_session_closed_alpha: 0,
          total_session_open_alpha: 0,
          total_session_open_beta: 0,
          all_session: 0,
          type: typeValue, // Đảm bảo luôn có giá trị hợp lệ
          season: seasonValue, // Đảm bảo luôn có giá trị hợp lệ
          reward: 0, // Giá trị mặc định của reward là 0
        };

        // Tìm atherId tương ứng với địa chỉ bằng cách sử dụng lowercase để so sánh nhất quán
        const atherId = addressToAtherId[tokenItem.address.toLowerCase()];
        if (atherId) {
          mappedItem.atherId = atherId;

          // Tìm session data tương ứng với atherId
          // Thử tìm theo atherId gốc trước
          let sessionData = atherIdToSessionData[atherId];

          // Nếu không tìm thấy và atherId gốc khác lowercase, thử tìm với lowercase
          if (!sessionData && atherId.toLowerCase() !== atherId) {
            sessionData = atherIdToSessionData[atherId.toLowerCase()];
          }

          // Nếu tìm thấy session data, map các trường dữ liệu
          if (sessionData) {
            // Chuyển đổi dữ liệu session từ chuỗi sang số
            const closed_alpha = parseInt(sessionData.total_session_closed_alpha) || 0;
            const open_alpha = parseInt(sessionData.total_session_open_alpha) || 0;
            const open_beta = parseInt(sessionData.total_session_open_beta) || 0;

            // Gán giá trị đã chuyển đổi
            mappedItem.total_session_closed_alpha = closed_alpha;
            mappedItem.total_session_open_alpha = open_alpha;
            mappedItem.total_session_open_beta = open_beta;

            // Tính tổng session và lưu vào trường all_session
            mappedItem.all_session = closed_alpha + open_alpha + open_beta;
          }
        }

        // Ghi đè lại type và season vào đây để đảm bảo luôn có
        mappedItem.type = typeValue;
        mappedItem.season = seasonValue;

        // Tính lại reward cho trường hợp không có session data
        // Xác định session value dựa trên season hiện tại
        let sessionValue = 0;
        if (seasonValue === 'CA') {
          sessionValue = mappedItem.total_session_closed_alpha || 0;
        } else if (seasonValue === 'OA') {
          sessionValue = mappedItem.total_session_open_alpha || 0;
        } else if (seasonValue === 'OB') {
          sessionValue = mappedItem.total_session_open_beta || 0;
        }

        // Áp dụng quy tắc tính reward
        if (sessionValue < 1) {
          mappedItem.reward = 0;
        } else if (mappedItem.xValue !== undefined) {
          // Tính toán reward dựa trên số session và xValue
          if (sessionValue > 90) {
            mappedItem.reward = mappedItem.xValue; // Max là xValue
          } else {
            // Tính hệ số dựa trên session: 0-10 => 0.1, 11-20 => 0.2, ...
            const factor = Math.min(Math.ceil(sessionValue / 10) / 10, 1.0);
            mappedItem.reward = mappedItem.xValue * factor;
          }
        }

        result.push(mappedItem);
      });

      // Sắp xếp kết quả theo tokenId
      result.sort((a, b) => {
        // Nếu cả hai tokenId đều không tồn tại, giữ nguyên thứ tự
        if (!a.tokenId && !b.tokenId) return 0;

        // Nếu a.tokenId không tồn tại, đưa a xuống cuối
        if (!a.tokenId) return 1;

        // Nếu b.tokenId không tồn tại, đưa b xuống cuối
        if (!b.tokenId) return -1;

        // Nếu tokenId là số, so sánh theo giá trị số
        const aNum = parseInt(a.tokenId);
        const bNum = parseInt(b.tokenId);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }

        // Nếu không phải số, so sánh theo chuỗi
        return a.tokenId.localeCompare(b.tokenId);
      });

      // In debug data
      console.log('Mapped data with type and season:', result.slice(0, 3));

      // Tính tổng reward
      const sumReward = result.reduce((sum, item) => sum + (item.reward || 0), 0);
      setTotalReward(sumReward);

      setMappedData(result);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Lỗi khi thực hiện map data. Vui lòng kiểm tra lại format của các file.');
      console.error('Error mapping data:', error);
    }
  };

  // Hàm tải xuống file kết quả
  const downloadMappedData = () => {
    if (!mappedData || !selectedType || !selectedSeason) return;

    try {
      // Tạo tên file theo định dạng ${type}-${season}-reward
      const downloadFileName = `${selectedType}-${selectedSeason}-reward`;

      if (outputFormat === 'json') {
        const jsonString = JSON.stringify(mappedData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${downloadFileName}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Convert to CSV
        // Bảo toàn kiểu dữ liệu để không mất số 0 đầu tiên
        const processedData = mappedData.map(item => {
          const newItem: Record<string, string | number | boolean | null | undefined> = { ...item };

          // Đảm bảo giữ nguyên các chuỗi số có số 0 đầu tiên
          for (const key in newItem) {
            if (
              typeof newItem[key] === 'string' &&
              /^\d+$/.test(newItem[key]) &&
              newItem[key].startsWith('0')
            ) {
              newItem[key] = `'${newItem[key]}`; // Thêm dấu nháy đơn để đảm bảo giữ nguyên khi xuất CSV
            }
          }

          return newItem;
        });

        const csv = Papa.unparse(processedData, {
          quotes: true, // Đảm bảo tất cả chuỗi được bao quanh bởi dấu ngoặc kép
        });

        // Xử lý thêm để bảo toàn số 0 đầu tiên
        const processedCsv = csv
          .replace(/,(\d+),/g, ',"$1",')
          .replace(/^(\d+),/, '"$1",')
          .replace(/,(\d+)$/, ',"$1"');

        const blob = new Blob([processedCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${downloadFileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      setErrorMessage('Lỗi khi tạo file xuất. Vui lòng thử lại.');
      console.error('Download error:', error);
    }
  };

  const resetData = () => {
    setTokenData(null);
    setAtherSessionData(null);
    setAtherAddressData(null);
    setMappedData(null);
    setErrorMessage('');
    setExtractedType(null);
    setSelectedType(null);
    setExtractedSeason(null);
    setSelectedSeason(null);
    setTokenFileName('');
    setTotalReward(0);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-6xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex items-center mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
          >
            ← Về Trang Chủ
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Map Data từ Nhiều File
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Dropzone cho file 1 */}
          <div className="border rounded-lg p-4 dark:border-gray-700">
            <h3 className="text-md font-medium mb-2 dark:text-gray-200">File 1: Token Data</h3>
            <div
              {...getTokenRootProps()}
              className={`border-2 border-dashed p-4 rounded-lg text-center cursor-pointer h-32 flex items-center justify-center ${
                isTokenDragActive
                  ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 dark:bg-gray-700/30'
              }`}
            >
              <input {...getTokenInputProps()} />
              {tokenData ? (
                <p className="text-green-600 dark:text-green-400">
                  ✓ File đã tải: {tokenData.length} records
                </p>
              ) : isTokenDragActive ? (
                <p className="text-green-500 dark:text-green-400">Thả file vào đây...</p>
              ) : (
                <p className="text-sm dark:text-gray-300">Kéo & thả file JSON hoặc click để chọn</p>
              )}
            </div>
          </div>

          {/* Dropzone cho file 2 */}
          <div className="border rounded-lg p-4 dark:border-gray-700">
            <h3 className="text-md font-medium mb-2 dark:text-gray-200">
              File 2: Ather Session Data
            </h3>
            <div
              {...getAtherSessionRootProps()}
              className={`border-2 border-dashed p-4 rounded-lg text-center cursor-pointer h-32 flex items-center justify-center ${
                isAtherSessionDragActive
                  ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 dark:bg-gray-700/30'
              }`}
            >
              <input {...getAtherSessionInputProps()} />
              {atherSessionData ? (
                <p className="text-green-600 dark:text-green-400">
                  ✓ File đã tải: {atherSessionData.length} records
                </p>
              ) : isAtherSessionDragActive ? (
                <p className="text-green-500 dark:text-green-400">Thả file vào đây...</p>
              ) : (
                <p className="text-sm dark:text-gray-300">Kéo & thả file JSON hoặc click để chọn</p>
              )}
            </div>
          </div>

          {/* Dropzone cho file 3 */}
          <div className="border rounded-lg p-4 dark:border-gray-700">
            <h3 className="text-md font-medium mb-2 dark:text-gray-200">
              File 3: Ather Address Data
            </h3>
            <div
              {...getAtherAddressRootProps()}
              className={`border-2 border-dashed p-4 rounded-lg text-center cursor-pointer h-32 flex items-center justify-center ${
                isAtherAddressDragActive
                  ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 dark:bg-gray-700/30'
              }`}
            >
              <input {...getAtherAddressInputProps()} />
              {atherAddressData ? (
                <p className="text-green-600 dark:text-green-400">
                  ✓ File đã tải: {atherAddressData.length} records
                </p>
              ) : isAtherAddressDragActive ? (
                <p className="text-green-500 dark:text-green-400">Thả file vào đây...</p>
              ) : (
                <p className="text-sm dark:text-gray-300">Kéo & thả file JSON hoặc click để chọn</p>
              )}
            </div>
          </div>
        </div>

        {/* Loại bỏ nút bị trùng lặp khi chưa tải file */}
        {!tokenData && (
          <div className="flex justify-center mb-6">
            <button
              onClick={mapData}
              disabled={
                !tokenData ||
                !atherSessionData ||
                !atherAddressData ||
                !selectedType ||
                !selectedSeason
              }
              className="py-2 px-6 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed transition duration-200"
            >
              Map Data
            </button>
            <button
              onClick={resetData}
              className="py-2 px-6 ml-4 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition duration-200"
            >
              Reset
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}

        {tokenData && (
          <div className="space-y-6 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium mb-4 text-blue-800 dark:text-blue-400">
                File 1 đã tải: {tokenFileName}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type Selection */}
                <div>
                  <h4 className="text-gray-700 dark:text-gray-300 mb-2">Loại (Type):</h4>
                  <div className="space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-5 w-5 text-purple-600 dark:text-purple-500"
                        name="type"
                        value="inu"
                        checked={selectedType === 'inu'}
                        onChange={() => setSelectedType('inu')}
                      />
                      <span className="ml-2 dark:text-gray-300">Inu</span>
                    </label>
                    <br />
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-5 w-5 text-purple-600 dark:text-purple-500"
                        name="type"
                        value="neko"
                        checked={selectedType === 'neko'}
                        onChange={() => setSelectedType('neko')}
                      />
                      <span className="ml-2 dark:text-gray-300">Neko</span>
                    </label>
                    {extractedType && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Đã phát hiện từ tên file: {extractedType.toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Season Selection */}
                <div>
                  <h4 className="text-gray-700 dark:text-gray-300 mb-2">Mùa (Season):</h4>
                  <div className="space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-5 w-5 text-purple-600 dark:text-purple-500"
                        name="season"
                        value="CA"
                        checked={selectedSeason === 'CA'}
                        onChange={() => setSelectedSeason('CA')}
                      />
                      <span className="ml-2 dark:text-gray-300">Closed Alpha (CA)</span>
                    </label>
                    <br />
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-5 w-5 text-purple-600 dark:text-purple-500"
                        name="season"
                        value="OA"
                        checked={selectedSeason === 'OA'}
                        onChange={() => setSelectedSeason('OA')}
                      />
                      <span className="ml-2 dark:text-gray-300">Open Alpha (OA)</span>
                    </label>
                    <br />
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-5 w-5 text-purple-600 dark:text-purple-500"
                        name="season"
                        value="OB"
                        checked={selectedSeason === 'OB'}
                        onChange={() => setSelectedSeason('OB')}
                      />
                      <span className="ml-2 dark:text-gray-300">Open Beta (OB)</span>
                    </label>
                    {extractedSeason && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Đã phát hiện từ tên file: {extractedSeason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chỉ hiển thị nút Map Data & Reset một lần ở đây khi đã tải file */}
            <div className="flex justify-center mt-6">
              <button
                onClick={mapData}
                disabled={
                  !tokenData ||
                  !atherSessionData ||
                  !atherAddressData ||
                  !selectedType ||
                  !selectedSeason
                }
                className={`py-2 px-6 rounded-lg ${
                  tokenData &&
                  atherSessionData &&
                  atherAddressData &&
                  selectedType &&
                  selectedSeason
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                } transition duration-200`}
              >
                Map Data
              </button>
              <button
                onClick={resetData}
                className="py-2 px-6 ml-4 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition duration-200"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {mappedData && (
          <div className="space-y-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
              <p className="text-green-700 dark:text-green-400 mb-2">
                ✓ Map data thành công: {mappedData.length} records
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm">
                Type: <span className="font-medium">{selectedType?.toUpperCase()}</span>, Season:{' '}
                <span className="font-medium">{selectedSeason}</span>
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm font-bold mt-1">
                Tổng Reward: <span className="font-medium">{totalReward.toLocaleString()}</span>
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2 dark:text-gray-200">Xem trước:</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60">
                <pre className="text-xs dark:text-gray-300">
                  {JSON.stringify(mappedData.slice(0, 3), null, 2)}
                  {mappedData.length > 3 && '\n...và ' + (mappedData.length - 3) + ' records khác'}
                </pre>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2 dark:text-gray-200">Thông tin dữ liệu:</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs dark:text-gray-300 mb-1">
                  • Tất cả dữ liệu đều có Type:{' '}
                  <span className="font-medium">
                    {selectedType?.toUpperCase() || 'Chưa xác định'}
                  </span>
                </p>
                <p className="text-xs dark:text-gray-300 mb-1">
                  • Tất cả dữ liệu đều có Season:{' '}
                  <span className="font-medium">{selectedSeason || 'Chưa xác định'}</span>
                </p>
                <p className="text-xs dark:text-gray-300 mb-1">
                  • Tên file tải xuống:{' '}
                  <span className="font-medium">
                    {selectedType}-{selectedSeason}-reward.{outputFormat}
                  </span>
                </p>
                <p className="text-xs dark:text-gray-300 font-bold">
                  • Tổng Reward: <span className="font-medium">{totalReward.toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2">
                  Định dạng xuất:
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-blue-600 dark:text-blue-500"
                      name="outputFormat"
                      value="json"
                      checked={outputFormat === 'json'}
                      onChange={() => setOutputFormat('json')}
                    />
                    <span className="ml-2 dark:text-gray-300">JSON</span>
                  </label>

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
                </div>
              </div>

              <button
                onClick={downloadMappedData}
                className="w-full py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white transition duration-200"
              >
                Tải xuống file {selectedType}-{selectedSeason}-reward.{outputFormat}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
