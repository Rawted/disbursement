// src/components/MainPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees,
  PDFImage,
} from 'pdf-lib';
import './MainPage.css';

interface TextField {
  id: string;
  label: string;
  value: string;
  x: number;
  y: number;
}

const MainPage: React.FC = () => {
  const [textFields, setTextFields] = useState<TextField[]>([
    { id: 'name', label: 'Name', value: '', x: 50, y: 700 },
    { id: 'address', label: 'Address', value: '', x: 50, y: 650 },
    { id: 'email', label: 'Email', value: '', x: 50, y: 600 },
    // Add more fields as needed with their corresponding coordinates
  ]);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [bankStatementFile, setBankStatementFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');

  const handleTextChange = (id: string, value: string) => {
    setTextFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id ? { ...field, value: value } : field
      )
    );
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleBankStatementUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setBankStatementFile(e.target.files[0]);
    }
  };

  const generatePdf = async () => {
    // Fetch the existing PDF template
    const existingPdfBytes = await fetch('/template.pdf').then((res) =>
      res.arrayBuffer()
    );

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Embed a font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw each text field at its specified coordinates
    textFields.forEach((field) => {
      firstPage.drawText(field.value, {
        x: field.x,
        y: field.y,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    });

    // Embed receipt image/PDF if uploaded
    if (receiptFile) {
      const receiptBytes = await receiptFile.arrayBuffer();
      await embedFileIntoPdf(pdfDoc, firstPage, receiptBytes, {
        x: 50,
        y: 400,
        width: 200,
        height: 150,
      });
    }

    // Embed bank statement image/PDF if uploaded
    if (bankStatementFile) {
      const bankStatementBytes = await bankStatementFile.arrayBuffer();
      await embedFileIntoPdf(pdfDoc, firstPage, bankStatementBytes, {
        x: 300,
        y: 400,
        width: 200,
        height: 150,
      });
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Convert to a base64 data URL to display in the browser
    const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
    setPdfDataUrl(pdfDataUri);

    // Trigger download of the PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated.pdf';
    link.click();
  };

  // Function to embed an image or PDF into the PDF document
  const embedFileIntoPdf = async (
    pdfDoc: PDFDocument,
    page: any,
    fileBytes: ArrayBuffer,
    position: { x: number; y: number; width: number; height: number }
  ) => {
    const fileType = getFileType(fileBytes);
    if (fileType === 'pdf') {
      // Embed PDF as pages
      const embeddedPdf = await PDFDocument.load(fileBytes);
      const [embeddedPage] = await pdfDoc.copyPages(embeddedPdf, [0]);
      embeddedPage.scale(position.width / embeddedPage.getWidth());
      pdfDoc.addPage(embeddedPage);
    } else if (fileType === 'image') {
      // Embed image
      let image;
      if (isPng(fileBytes)) {
        image = await pdfDoc.embedPng(fileBytes);
      } else {
        image = await pdfDoc.embedJpg(fileBytes);
      }
      page.drawImage(image, {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      });
    } else {
      console.error('Unsupported file type');
    }
  };

  // Helper functions to determine file types
  const getFileType = (fileBytes: ArrayBuffer): string => {
    const arr = new Uint8Array(fileBytes).subarray(0, 4);
    let header = '';
    for (let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16);
    }
    switch (header) {
      case '89504e47':
        return 'image';
      case 'ffd8ffe0':
      case 'ffd8ffe1':
      case 'ffd8ffe2':
        return 'image';
      case '25504446':
        return 'pdf';
      default:
        return 'unknown';
    }
  };

  const isPng = (fileBytes: ArrayBuffer): boolean => {
    const arr = new Uint8Array(fileBytes).subarray(0, 4);
    const header = arr.reduce((acc, curr) => acc + curr.toString(16), '');
    return header === '89504e47';
  };

  return (
    <div className="container">
      <h1>Document Generator</h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="form-container"
      >
        {textFields.map((field) => (
          <div key={field.id} className="input-group">
            <label htmlFor={field.id}>{field.label}</label>
            <input
              id={field.id}
              type="text"
              value={field.value}
              onChange={(e) => handleTextChange(field.id, e.target.value)}
              className="text-input"
            />
          </div>
        ))}
        <div className="input-group">
          <label>Upload Receipt</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleReceiptUpload}
          />
        </div>
        <div className="input-group">
          <label>Upload Bank Statement</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleBankStatementUpload}
          />
        </div>
        <button onClick={generatePdf} className="generate-button">
          Generate PDF
        </button>
      </motion.div>
      {pdfDataUrl && (
        <iframe
          src={pdfDataUrl}
          title="PDF Preview"
          width="100%"
          height="600px"
          className="pdf-preview"
        ></iframe>
      )}
    </div>
  );
};

export default MainPage;