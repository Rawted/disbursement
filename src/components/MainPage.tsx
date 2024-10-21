// src/components/MainPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import './MainPage.css';

interface ItemField {
  item: string;
  category: string;
  amount: string;
}

interface FieldCoordinate {
  fieldName: string;
  rectangle: [number, number, number, number];
}

const MainPage: React.FC = () => {
  // **Non-repeating fields**
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [total, setTotal] = useState('');

  // **Repeating fields (Item, Category, Amount)**
  const [items, setItems] = useState<ItemField[]>([
    { item: '', category: '', amount: '' },
  ]);

  const maxItems = 11;

  const addItem = () => {
    if (items.length < maxItems) {
      setItems([...items, { item: '', category: '', amount: '' }]);
    }
  };

  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');

  const generatePdf = async () => {
    // **Fetch the existing PDF template**
    const existingPdfBytes = await fetch('/template.pdf').then((res) =>
      res.arrayBuffer()
    );

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // **Embed a font**
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // **Prepare field coordinates**
    const fieldCoordinates: FieldCoordinate[] = [
      // **Non-repeating fields**
      { fieldName: 'Date', rectangle: [228.43, 112.33, 307.43, 19.04] },
      { fieldName: 'Name', rectangle: [228.43, 530.22, 308.38, 18.09] },
      { fieldName: 'Email', rectangle: [229.38, 551.87, 305.52, 18.09] },
      { fieldName: 'PhoneNumber', rectangle: [228.08, 592.45, 308.38, 17.13] },
      { fieldName: 'StudentNumber', rectangle: [229.73, 612.79, 307.43, 18.09] },
      { fieldName: 'AccountCode', rectangle: [335.03, 163.73, 98.99, 24.75] },
      { fieldName: 'Total', rectangle: [433.06, 491.19, 100.89, 17.13] },
    ];

    // **Repeating fields**
    for (let i = 1; i <= items.length; i++) {
      fieldCoordinates.push(
        { fieldName: `Item${i}`, rectangle: getRectangleForField(`Item${i}`) },
        { fieldName: `Amount${i}`, rectangle: getRectangleForField(`Amount${i}`) },
        { fieldName: `Category${i}`, rectangle: getRectangleForField(`Category${i}`) },
      );
    }

    // **Map field values**
    const fieldValues: { [key: string]: string } = {
      'Date': date,
      'Name': name,
      'Email': email,
      'PhoneNumber': phoneNumber,
      'StudentNumber': studentNumber,
      'AccountCode': accountCode,
      'Total': total,
    };

    // **Add item values**
    for (let i = 1; i <= items.length; i++) {
      fieldValues[`Item${i}`] = items[i - 1].item;
      fieldValues[`Amount${i}`] = items[i - 1].amount;
      fieldValues[`Category${i}`] = items[i - 1].category;
    }

    // **Draw each field at its specified coordinates**
    for (const field of fieldCoordinates) {
      const value = fieldValues[field.fieldName] || '';
      const rect = field.rectangle;

      // **Convert the top coordinate to PDF coordinate system**
      const x = rect[0];
      const y = height - rect[1] - rect[3]; // rect[1] is top, rect[3] is height

      firstPage.drawText(value, {
        x: x + 2, // Add padding
        y: y + 2, // Add padding
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: rect[2] - 4, // rect[2] is width
      });
    }

    // **Serialize the PDFDocument to bytes (a Uint8Array)**
    const pdfBytes = await pdfDoc.save();

    // **Convert to a base64 data URL to display in the browser**
    const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
    setPdfDataUrl(pdfDataUri);

    // **Trigger download of the PDF**
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated.pdf';
    link.click();
  };

  // **Function to get rectangle coordinates for a field**
  const getRectangleForField = (fieldName: string): [number, number, number, number] => {
    const rectangles: { [key: string]: [number, number, number, number] } = {
      // **Item fields**
      'Item1': [136.11, 162.78, 196.07, 23.80],
      'Item2': [136.11, 193.24, 196.07, 23.80],
      'Item3': [135.87, 223.54, 196.59, 24.04],
      'Item4': [136.11, 254.16, 197.02, 23.80],
      'Item5': [136.11, 282.72, 197.02, 24.75],
      'Item6': [136.11, 313.18, 197.97, 23.80],
      'Item7': [136.11, 342.69, 198.92, 24.75],
      'Item8': [136.11, 374.11, 197.97, 22.85],
      'Item9': [136.11, 402.66, 198.92, 23.80],
      'Item10': [137.06, 432.17, 197.97, 25.70],
      'Item11': [136.11, 462.63, 197.02, 23.80],

      // **Amount fields**
      'Amount1': [434.97, 163.73, 100.89, 23.80],
      'Amount2': [433.06, 194.19, 103.74, 22.85],
      'Amount3': [432.11, 225.65, 105.65, 22.85],
      'Amount4': [434.02, 253.21, 101.84, 23.80],
      'Amount5': [434.02, 282.72, 102.79, 23.80],
      'Amount6': [432.11, 313.18, 104.70, 23.80],
      'Amount7': [434.02, 343.64, 100.89, 23.80],
      'Amount8': [433.06, 373.15, 101.84, 23.80],
      'Amount9': [433.06, 402.66, 103.74, 22.85],
      'Amount10': [433.06, 432.17, 102.79, 24.75],
      'Amount11': [433.06, 462.63, 103.74, 23.80],

      // **Category fields**
      'Category1': [37.26, 162.77, 80.47, 25.80],
      'Category2': [37.26, 193.53, 81.47, 24.81],
      'Category3': [37.26, 223.31, 78.49, 23.82],
      'Category4': [36.26, 252.09, 80.47, 24.81],
      'Category5': [36.26, 282.86, 80.47, 24.81],
      'Category6': [35.27, 313.62, 80.47, 24.81],
      'Category7': [36.26, 342.41, 79.48, 25.80],
      'Category8': [36.26, 372.18, 78.49, 25.80],
      'Category9': [35.27, 401.95, 79.48, 25.80],
      'Category10': [35.27, 431.73, 77.49, 25.80],
      'Category11': [35.27, 461.50, 78.49, 25.80],
    };

    return rectangles[fieldName];
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
        {/* **Non-repeating fields** */}
        <div className="input-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="input-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="input-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            id="phoneNumber"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="input-group">
          <label htmlFor="studentNumber">Student Number</label>
          <input
            id="studentNumber"
            type="text"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="input-group">
          <label htmlFor="accountCode">Account Code</label>
          <input
            id="accountCode"
            type="text"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            className="text-input"
          />
        </div>

        {/* **Repeating fields (Item, Category, Amount)** */}
        {items.map((itemField, index) => (
          <div key={index} className="item-group">
            <h3>Item {index + 1}</h3>
            <div className="input-group">
              <label htmlFor={`category${index}`}>Category</label>
              <input
                id={`category${index}`}
                type="text"
                value={itemField.category}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].category = e.target.value;
                  setItems(newItems);
                }}
                className="text-input"
              />
            </div>
            <div className="input-group">
              <label htmlFor={`item${index}`}>Item</label>
              <input
                id={`item${index}`}
                type="text"
                value={itemField.item}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].item = e.target.value;
                  setItems(newItems);
                }}
                className="text-input"
              />
            </div>
            <div className="input-group">
              <label htmlFor={`amount${index}`}>Amount</label>
              <input
                id={`amount${index}`}
                type="text"
                value={itemField.amount}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].amount = e.target.value;
                  setItems(newItems);
                }}
                className="text-input"
              />
            </div>
          </div>
        ))}
        {items.length < maxItems && (
          <button onClick={addItem} className="add-button">
            Add Another Item
          </button>
        )}
        <div className="input-group">
          <label htmlFor="total">Total</label>
          <input
            id="total"
            type="text"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="text-input"
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