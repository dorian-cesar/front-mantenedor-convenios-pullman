/**
 * Trigger a browser download of a blob.
 * Handles UTF-8 BOM for CSV files to ensure compatibility with Excel.
 */
export const downloadBlob = (data: BlobPart, fileName: string, mimeType: string) => {
    let blob: Blob;

    // Add BOM for CSV to handle special characters correctly in Excel
    if (mimeType.includes('csv') || fileName.endsWith('.csv')) {
        const BOM = '\uFEFF';
        blob = new Blob([BOM, data], { type: `${mimeType};charset=utf-8` });
    } else {
        blob = new Blob([data], { type: mimeType });
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
};
