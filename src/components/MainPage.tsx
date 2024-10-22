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

  // **Receipts and Bank Statements**
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [bankStatementFiles, setBankStatementFiles] = useState<File[]>([]);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReceiptFiles(Array.from(e.target.files));
    }
  };

  const handleBankStatementUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      setBankStatementFiles(Array.from(e.target.files));
    }
  };

  const generatePdf = async () => {
    // **Fetch the existing PDF template**
    const existingPdfBytes = await fetch('/template.pdf').then((res) =>
      res.arrayBuffer()
    );

    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // **Embed a font**
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.getPage(0);
    const { height } = page.getSize();

    // **Prepare field coordinates**
    const fieldCoordinates: FieldCoordinate[] = [
      // **Non-repeating fields**
      { fieldName: 'Date', rectangle: [228.43, 112.33, 307.43, 19.04] },
      { fieldName: 'Name', rectangle: [228.43, 530.22, 308.38, 18.09] },
      { fieldName: 'Email', rectangle: [229.38, 551.87, 305.52, 18.09] },
      { fieldName: 'PhoneNumber', rectangle: [228.08, 592.45, 308.38, 17.13] },
      {
        fieldName: 'StudentNumber',
        rectangle: [229.73, 612.79, 307.43, 18.09],
      },
      { fieldName: 'AccountCode', rectangle: [335.03, 163.73, 98.99, 24.75] },
      { fieldName: 'Total', rectangle: [433.06, 491.19, 100.89, 17.13] },
    ];

    // **Repeating fields**
    for (let i = 1; i <= items.length; i++) {
      fieldCoordinates.push(
        { fieldName: `Item${i}`, rectangle: getRectangleForField(`Item${i}`) },
        {
          fieldName: `Amount${i}`,
          rectangle: getRectangleForField(`Amount${i}`),
        },
        {
          fieldName: `Category${i}`,
          rectangle: getRectangleForField(`Category${i}`),
        }
      );
    }

    // **Calculate Total**
    const totalAmount = items
      .reduce((sum, item) => {
        const amount = parseFloat(item.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0)
      .toFixed(2);

    // **Map field values**
    const fieldValues: { [key: string]: string } = {
      Date: date,
      Name: name,
      Email: email,
      PhoneNumber: phoneNumber,
      StudentNumber: studentNumber,
      AccountCode: accountCode,
      Total: totalAmount,
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

      // **Calculate font size to fit text within rectangle**
      let fontSize = 12; // Starting font size
      const minFontSize = 6; // Minimum font size
      const maxWidth = rect[2] - 2; // Subtract padding
      const maxHeight = rect[3] - 2; // Subtract padding

      // **Split text into lines if necessary**
      let lines = splitTextIntoLines(value, font, fontSize, maxWidth);

      // **Adjust font size to fit width and height**
      while (
        (lines.length * fontSize > maxHeight ||
          font.widthOfTextAtSize(value, fontSize) > maxWidth) &&
        fontSize > minFontSize
      ) {
        fontSize -= 0.5; // Decrease font size
        lines = splitTextIntoLines(value, font, fontSize, maxWidth);
      }

      // **Align Text**
      const isCategoryOrAmount = ['Category', 'Amount'].some((key) =>
        field.fieldName.startsWith(key)
      );
      const isStaticField = [
        'Date',
        'Name',
        'Email',
        'PhoneNumber',
        'StudentNumber',
        'AccountCode',
        'Total',
      ].includes(field.fieldName);

      let textOptions: any = {
        x: x + 1, // Add padding
        y: y + rect[3] - fontSize, // Start at the top of the rectangle
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: maxWidth,
      };

      if (isCategoryOrAmount) {
        // **Center alignment for Category and Amount**
        textOptions.align = 'center';
        textOptions.x = x + rect[2] / 2;
      } else if (isStaticField) {
        // **Right alignment for static text inputs**
        textOptions.align = 'right';
        textOptions.x = x + rect[2] - 1; // Right padding
      } else {
        // **Left alignment for other fields**
        textOptions.align = 'left';
      }

      // **Draw each line**
      lines.forEach((line, index) => {
        page.drawText(line, {
          ...textOptions,
          y: textOptions.y - index * fontSize,
        });
      });
    }

    // **Add Receipts and Bank Statements**
    // **Receipts**
    for (const file of receiptFiles) {
      await addFileAsPage(pdfDoc, file);
    }

    // **Bank Statements**
    for (const file of bankStatementFiles) {
      await addFileAsPage(pdfDoc, file);
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
  const getRectangleForField = (
    fieldName: string
  ): [number, number, number, number] => {
    const rectangles: { [key: string]: [number, number, number, number] } = {
      // **Item fields**
      'Item1': [136.11, 162.78, 196.07, 23.8],
      'Item2': [136.11, 193.24, 196.07, 23.8],
      'Item3': [135.87, 223.54, 196.59, 24.04],
      'Item4': [136.11, 254.16, 197.02, 23.8],
      'Item5': [136.11, 282.72, 197.02, 24.75],
      'Item6': [136.11, 313.18, 197.97, 23.8],
      'Item7': [136.11, 342.69, 198.92, 24.75],
      'Item8': [136.11, 374.11, 197.97, 22.85],
      'Item9': [136.11, 402.66, 198.92, 23.8],
      'Item10': [137.06, 432.17, 197.97, 25.7],
      'Item11': [136.11, 462.63, 197.02, 23.8],

      // **Amount fields**
      'Amount1': [434.97, 163.73, 100.89, 23.8],
      'Amount2': [433.06, 194.19, 103.74, 22.85],
      'Amount3': [432.11, 225.65, 105.65, 22.85],
      'Amount4': [434.02, 253.21, 101.84, 23.8],
      'Amount5': [434.02, 282.72, 102.79, 23.8],
      'Amount6': [432.11, 313.18, 104.7, 23.8],
      'Amount7': [434.02, 343.64, 100.89, 23.8],
      'Amount8': [433.06, 373.15, 101.84, 23.8],
      'Amount9': [433.06, 402.66, 103.74, 22.85],
      'Amount10': [433.06, 432.17, 102.79, 24.75],
      'Amount11': [433.06, 462.63, 103.74, 23.8],

      // **Category fields**
      'Category1': [37.26, 162.77, 80.47, 25.8],
      'Category2': [37.26, 193.53, 81.47, 24.81],
      'Category3': [37.26, 223.31, 78.49, 23.82],
      'Category4': [36.26, 252.09, 80.47, 24.81],
      'Category5': [36.26, 282.86, 80.47, 24.81],
      'Category6': [35.27, 313.62, 80.47, 24.81],
      'Category7': [36.26, 342.41, 79.48, 25.8],
      'Category8': [36.26, 372.18, 78.49, 25.8],
      'Category9': [35.27, 401.95, 79.48, 25.8],
      'Category10': [35.27, 431.73, 77.49, 25.8],
      'Category11': [35.27, 461.5, 78.49, 25.8],
    };

    return rectangles[fieldName];
  };

  // **Helper function to split text into lines**
  const splitTextIntoLines = (
    text: string,
    font: any,
    fontSize: number,
    maxWidth: number
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  // **Function to add a file as a new page in the PDF**
  const addFileAsPage = async (pdfDoc: PDFDocument, file: File) => {
    const fileBytes = await file.arrayBuffer();
    const fileType = getFileType(fileBytes);

    if (fileType === 'pdf') {
      const externalPdf = await PDFDocument.load(fileBytes);
      const copiedPages = await pdfDoc.copyPages(
        externalPdf,
        externalPdf.getPageIndices()
      );
      copiedPages.forEach((page) => pdfDoc.addPage(page));
    } else if (fileType === 'image') {
      const image = await embedImage(pdfDoc, fileBytes);
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      // Scale image to fit page
      const imgWidth = image.width;
      const imgHeight = image.height;
      const scale = Math.min(width / imgWidth, height / imgHeight);

      page.drawImage(image, {
        x: (width - imgWidth * scale) / 2,
        y: (height - imgHeight * scale) / 2,
        width: imgWidth * scale,
        height: imgHeight * scale,
      });
    } else {
      console.error('Unsupported file type');
    }
  };

  // **Helper function to determine file type**
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

  // **Helper function to embed image**
  const embedImage = async (pdfDoc: PDFDocument, fileBytes: ArrayBuffer) => {
    const isPng = (fileBytes: ArrayBuffer): boolean => {
      const arr = new Uint8Array(fileBytes).subarray(0, 4);
      const header = arr.reduce((acc, curr) => acc + curr.toString(16), '');
      return header === '89504e47';
    };

    if (isPng(fileBytes)) {
      return await pdfDoc.embedPng(fileBytes);
    } else {
      return await pdfDoc.embedJpg(fileBytes);
    }
  };

  return (
    <div className="container">
      <h1>Document Generator</h1>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
          <motion.div
            key={index}
            className="item-group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Item {index + 1}</h3>
            <div className="input-group">
              <label htmlFor={`category${index}`}>Category</label>
              <select
                id={`category${index}`}
                value={itemField.category}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].category = e.target.value;
                  setItems(newItems);
                }}
                className="text-input"
              >
                <option value="">Select Category</option>
                <option value="Operations">Operations</option>
                <option value="Logistics">Logistics</option>
                <option value="Meal">Meal</option>
                <option value="Marketing">Marketing</option>
                <option value="Gift & Prize">Gift & Prize</option>
                <option value="Team">Team</option>
              </select>
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
          </motion.div>
        ))}
        {items.length < maxItems && (
          <motion.button
            onClick={addItem}
            className="add-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add Another Item
          </motion.button>
        )}
        {/* **Receipts Upload** */}
        <div className="input-group">
          <label>Upload Receipts</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleReceiptUpload}
            multiple
          />
        </div>
        {/* **Bank Statements Upload** */}
        <div className="input-group">
          <label>Upload Bank Statements</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleBankStatementUpload}
            multiple
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