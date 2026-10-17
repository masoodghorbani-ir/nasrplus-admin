export interface IExcelColumnInfo {
  key: string; // e.g. "A", "B", "AA"
  index: number; // 0-based index
  headerSample?: string; // Text from header row
}

export interface IExcelColumnMapping {
  memberCode: string; // Required
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
  membershipDate?: string;
  expiryDate?: string;
  mobilePhone?: string;
  email?: string;
}

export interface IFixedImportData {
  natureOfMembership: string; // Required (ObjectId, key 'REAL'/'LEGAL', or title)
  membershipTypeId: string; // Required (ObjectId, code, or title)
  specializationId?: string; // Optional
  status?: 'ACTIVE' | 'PENDING';
}

export interface IImportPreviewResponse {
  fileId: string;
  originalFilename: string;
  sheets: string[];
  selectedSheet: string;
  totalRows: number;
  columns: IExcelColumnInfo[];
  previewRows: Array<Record<string, unknown>>;
  suggestedMapping: IExcelColumnMapping;
}

export interface IImportConfirmPayload {
  fileId: string;
  sheetName?: string;
  startRow?: number;
  fixedData: IFixedImportData;
  columnMapping: IExcelColumnMapping;
}

export interface IImportRowError {
  rowNumber: number;
  memberCode?: string;
  nationalCode?: string;
  fullName?: string;
  reason: string;
}

export interface IImportExecutionResponse {
  summary: {
    totalRows: number;
    processedCount: number;
    importedCount: number;
    skippedCount: number;
  };
  failedRows: IImportRowError[];
  importedMembers: Array<{
    id: string;
    memberCode: string;
    fullName: string;
  }>;
}

export interface IImportValidateRow {
  rowNumber: number;
  isValid: boolean;
  memberCode?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
  mobilePhone?: string;
  email?: string;
  membershipDate?: string;
  expiryDate?: string;
  errors: string[];
}

export interface IImportValidationResponse {
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
  };
  rows: IImportValidateRow[];
}

