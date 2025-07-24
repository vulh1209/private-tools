interface ConversionOptionsProps {
  outputFormat: 'csv' | 'excel';
  preserveTypes: boolean;
  onOutputFormatChange: (format: 'csv' | 'excel') => void;
  onPreserveTypesChange: (preserve: boolean) => void;
}

export const ConversionOptions: React.FC<ConversionOptionsProps> = ({
  outputFormat,
  preserveTypes,
  onOutputFormatChange,
  onPreserveTypesChange
}) => {
  return (
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
              onChange={() => onOutputFormatChange('csv')}
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
              onChange={() => onOutputFormatChange('excel')}
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
            onChange={() => onPreserveTypesChange(!preserveTypes)}
          />
          <span className="ml-2 dark:text-gray-300">Preserve string format (don't auto-convert to numbers)</span>
        </label>
      </div>
    </div>
  );
};