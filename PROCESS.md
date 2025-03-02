# Data Processing Documentation - JSON-CSV Converter

## Current Features

### 1. Convert CSV/Excel to JSON
- **Description**: Convert data from CSV or Excel files to JSON format
- **Detailed Features**:
  - Upload CSV or Excel files through drag and drop interface
  - Parse CSV files using PapaParse library
  - Parse Excel files using XLSX library
  - Process and preserve data types (especially strings with leading zeros)
  - Preview converted data
  - Download converted JSON file

### 2. Convert JSON to CSV/Excel
- **Description**: Convert data from JSON files to CSV or Excel format
- **Detailed Features**:
  - Upload JSON files through drag and drop interface
  - Parse JSON files
  - Handle complex JSON structures (nested objects, arrays)
  - Preserve data types (especially strings with leading zeros)
  - Choose output format (CSV or Excel)
  - Preview converted data
  - Download converted CSV or Excel file

### 3. Data Mapping
- **Description**: Map data between multiple JSON files
- **Detailed Features**:
  - Upload multiple JSON files
  - Define mapping relationships between files
  - Generate a combined dataset based on specified mappings
  - Preview combined data
  - Download results as a single JSON file

### 4. Advanced Data Mapper (V2)
- **Description**: Visual drag-and-drop interface for mapping and merging data from multiple files
- **Detailed Features**:
  - Upload multiple JSON files simultaneously
  - Automatic detection and visualization of file structure
  - Interactive drag-and-drop interface to create relationships between fields
  - Visual connections between related fields
  - Support for dot notation to access nested object properties
  - Checkbox selection to include/exclude specific fields in output
  - Preview of merged data
  - Ability to create complex relationships between multiple files
  - Download merged data as JSON
  - Support for different data types
  - Visual feedback with success and error messages

### 5. File Comparison Tool
- **Description**: Compare two JSON files to identify differences in token data
- **Detailed Features**:
  - Upload two JSON files for comparison
  - Automatically detect and extract token data from complex JSON structures
  - Compare multiple fields including `tokenId`, `reward`, `address`, `nftId`, and `atherId`
  - Filter differences by specific field types
  - Highlight discrepancies with color coding
  - Visual presentation of differences in a structured table format
  - Display numerical difference between reward values
  - Address truncation with tooltip for improved readability
  - Export comparison results to CSV
  - Support for nested objects and arrays in JSON structure
  - Debug information to assist with troubleshooting

### 6. Data Processing Utilities
- **Description**: Separated data processing utilities in the `processing.ts` module
- **Detailed Features**:
  - `shouldPreserveAsString`: Check if a value should be preserved as a string
  - `parseCSVToJSON`: Parse CSV file and convert to JSON
  - `parseExcelToJSON`: Parse Excel file and convert to JSON
  - `preserveDataTypes`: Preserve data types when converting from JSON to CSV/Excel
  - `convertJSONToCSV`: Convert JSON data to CSV format and download
  - `convertJSONToExcel`: Convert JSON data to Excel format and download
  - `downloadJSON`: Convert JSON data to downloadable JSON file
  - `findTokensInNestedStructure`: Recursively find token data in complex nested JSON structures
  - `compareFields`: Compare fields between two token objects to identify differences
  - `extractStructure`: Extract and flatten the structure of complex objects
  - `getNestedValue`: Access nested object properties using dot notation

## Planned Features

### 1. Advanced Data Processing
- **Description**: Add advanced data processing options
- **Detailed Features**:
  - Filter data by conditions before conversion
  - Sort data by specified fields
  - Select specific fields to include in conversion output
  - Rename fields during conversion
  - Add calculated fields based on existing fields

### 2. Additional Data Format Support
- **Description**: Extend support for other data formats
- **Detailed Features**:
  - Support conversion from/to XML format
  - Support conversion from/to YAML format
  - Support conversion from/to TSV (Tab-Separated Values) format

### 3. Large File Processing
- **Description**: Improve performance when processing large data files
- **Detailed Features**:
  - Streaming processing for large files
  - Progress bar display when processing large files
  - Memory optimization when processing large files

### 4. Output Format Customization
- **Description**: Add options to customize output format
- **Detailed Features**:
  - Customize separators for CSV files (comma, tab, semicolon)
  - Customize date format
  - Customize number format (decimal, thousands)
  - Customize character encoding (UTF-8, UTF-16, etc.)

### 5. Conversion History Storage and Management
- **Description**: Add ability to store and manage conversion history
- **Detailed Features**:
  - Save history of converted files
  - Reload previous conversions
  - Export/import conversion configurations

### 6. Integration API
- **Description**: Provide API for integrating conversion functionality into other applications
- **Detailed Features**:
  - RESTful API for data conversion
  - API documentation
  - Authentication and rate limiting for API

### 7. Multi-file Batch Processing
- **Description**: Process multiple files in a single operation
- **Detailed Features**:
  - Upload multiple files for batch processing
  - Apply the same conversion settings to all files
  - Generate batch output with organized file structure
  - Preview batch processing results
  - Download batch results as a zip archive

## Implementation Plan

1. **Phase 1**: Complete data processing module and file comparison tool
   - Refactor existing code to use the `processing.ts` module
   - Add unit tests for processing functions
   - Optimize file comparison algorithms

2. **Phase 2**: Enhanced data mapping and advanced data processing
   - Improve visual data mapper interface
   - Implement data structure visualization
   - Add support for complex mapping relationships
   - Develop UI for advanced options
   - Update processing module to support new options

3. **Phase 3**: Support additional data formats
   - Add necessary libraries for new formats
   - Develop conversion functions for new formats

4. **Phase 4**: Large file processing and history storage
   - Improve performance for large file processing
   - Develop conversion history storage system

5. **Phase 5**: Develop API and batch processing
   - Design and develop API
   - Create API documentation
   - Implement authentication and rate limiting
   - Build batch processing interface and functionality 