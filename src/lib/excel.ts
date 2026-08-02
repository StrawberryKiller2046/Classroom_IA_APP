import writeXlsxFile from "write-excel-file/browser"
import type { Column } from "write-excel-file/browser"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-z0-9]+/gi, "-")
}

/** Builds and downloads an .xlsx file from a list of rows plus a column
 * schema (header + cell accessor per column). Shared by the Planner and
 * the Results export so both produce consistently formatted workbooks. */
export function downloadExcel<T>(rows: T[], columns: Column<T>[], fileName: string) {
  return writeXlsxFile(rows, { columns, sheet: "Sheet1" }).toFile(`${sanitizeFileName(fileName)}.xlsx`)
}

export type { Column as ExcelColumn }
