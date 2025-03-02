import Link from "next/link";
import { ThemeToggle } from "./components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-4xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          JSON - CSV/Excel Converter
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Link 
            href="/json-to-csv" 
            className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors duration-200 text-center"
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-400">JSON to CSV/Excel</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Convert your JSON files to CSV or Excel format. Upload a JSON file and download the converted result.
            </p>
          </Link>
          
          <Link 
            href="/csv-to-json" 
            className="flex flex-col items-center p-6 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-800/30 rounded-lg transition-colors duration-200 text-center"
          >
            <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-400">CSV/Excel to JSON</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Convert your CSV or Excel files to JSON format. Upload your file and download the converted JSON.
            </p>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Link 
            href="/data-mapper" 
            className="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg transition-colors duration-200 text-center"
          >
            <h2 className="text-xl font-semibold mb-4 text-purple-800 dark:text-purple-400">Data Mapper</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Map and combine data from multiple JSON files. Upload different data sources and generate a combined dataset.
            </p>
          </Link>

          <Link 
            href="/compare-files" 
            className="flex flex-col items-center p-6 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors duration-200 text-center"
          >
            <h2 className="text-xl font-semibold mb-4 text-amber-800 dark:text-amber-400">Compare Files</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Upload two files and find tokenIds with different reward values. Compare and analyze the differences.
            </p>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-4">
          <Link 
            href="/data-mapper-v2" 
            className="flex flex-col items-center p-6 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 rounded-lg transition-colors duration-200 text-center border-2 border-indigo-200 dark:border-indigo-800"
          >
            <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">New</div>
            <h2 className="text-xl font-semibold mb-4 text-indigo-800 dark:text-indigo-400">Visual Data Mapper</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Interactive drag-and-drop interface for mapping and merging data from multiple files. Create visual connections between fields and customize output data.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
