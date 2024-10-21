// src/components/MainPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
    if (e.target.files) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleBankStatementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Convert to a base64 data URL to display in the browser
    const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
    setPdfDataUrl(pdfDataUri);
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