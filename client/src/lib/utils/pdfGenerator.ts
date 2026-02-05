import html2pdf from 'html2pdf.js';

/**
 * Generate PDF from HTML element
 */
export async function generatePDF(elementId: string, filename: string = 'quotation.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff',
      removeContainer: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['tr', 'img', 'h1', 'h2', 'h3', 'h4'],
    },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

/**
 * Open print dialog with proper styling
 */
export function printDocument(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Fallback to regular print if popup is blocked
    window.print();
    return;
  }

  // Get the element's HTML
  const elementHTML = element.outerHTML;

  // Create print styles
  const printStyles = `
    <style>
      @page {
        size: A4;
        margin: 1cm;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #000;
        background: #fff;
        padding: 20px;
      }
      
      .print-hidden {
        display: none !important;
      }
      
      h1, h2, h3, h4 {
        color: #000;
        page-break-after: avoid;
      }
      
      table {
        border-collapse: collapse;
        width: 100%;
        page-break-inside: avoid;
      }
      
      table th,
      table td {
        border: 1px solid #000;
        padding: 8px;
        text-align: left;
      }
      
      table th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
      
      @media print {
        body {
          padding: 0;
        }
        
        .no-print {
          display: none !important;
        }
      }
    </style>
  `;

  // Write to print window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quotation Document</title>
        ${printStyles}
      </head>
      <body>
        ${elementHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after printing (optional)
      // printWindow.close();
    }, 250);
  };
}
