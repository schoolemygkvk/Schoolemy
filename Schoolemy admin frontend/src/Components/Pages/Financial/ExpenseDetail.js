import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExpense } from "../../../Utils/expenseApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../../../assets/Irai aram logo.png";

const ExpenseDetail = () => {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExpense = useCallback(async () => {
    try {
      const response = await getExpense(expenseId);
      setExpense(response.data.data);
    } catch (error) {
      console.error("Error fetching expense:", error);
      alert("Failed to fetch expense details");
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSimpleDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const printBill = async () => {
    try {
      const invoiceContent = document.createElement('div');
      invoiceContent.id = 'expense-print-temp';
      invoiceContent.style.cssText = `
        width: 210mm;
        max-width: 210mm;
        background: white;
        margin: 0 auto;
        padding: 15mm;
        font-family: Arial, sans-serif;
        font-size: 12px;
      `;

      const logoImg = document.createElement('img');
      logoImg.src = logo;
      logoImg.style.cssText = 'width: 180px; height: 140px; object-fit: contain; display: block;';

      const subTotal = expense.amount || 0;
      const cgstRate = expense.cgstRate || 9;
      const sgstRate = expense.sgstRate || 9;
      const igstRate = expense.igstRate || 0;
      const cgstAmount = (subTotal * cgstRate) / 100;
      const sgstAmount = (subTotal * sgstRate) / 100;
      const igstAmount = (subTotal * igstRate) / 100;
      const shippingCharges = expense.shippingCharges || 0;
      const adjustment = expense.adjustment || 0;
      const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount + shippingCharges + adjustment;

      const numberToWords = (num) => {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        if (num === 0) return 'zero';
        const convert = (n) => {
          if (n < 10) return ones[n];
          if (n < 20) return teens[n - 10];
          if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
          if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
          if (n < 100000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
          if (n < 10000000) return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
          return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
        };
        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);
        let words = convert(rupees).trim();
        words = words.charAt(0).toUpperCase() + words.slice(1);
        if (paise > 0) words += ' and ' + convert(paise) + ' paise';
        return words + ' only';
      };

      invoiceContent.innerHTML = `
        <div style="background: white; padding: 20px; font-family: Arial, sans-serif; max-width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
            <div id="print-logo-container"></div>
            <div style="flex: 1; text-align: right; color: #1a202c; font-size: 11px;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px;">IRAI NIYATHI ARAKATTALAI</div>
              <div style="line-height: 1.5; color: #4a5568;">
                No.07, First Floor, Sivarathiinam Complex, Near Register Office, Vellalore, COIMBATORE - 641111<br/>
                Phone: 97894 85258 | GSTIN: ${expense.gstin || '33AAICB5046L1ZL'}
              </div>
            </div>
          </div>
          <div style="text-align: center; padding: 15px 0; margin-bottom: 20px;">
            <div style="font-size: 18px; font-weight: bold; color: #1a202c;">Expense Bill</div>
            <div style="font-size: 12px; color: #718096; margin-top: 4px;">Invoice No: ${expense.invoiceNumber || 'N/A'}</div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 11px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <strong>Invoice Date:</strong> ${formatSimpleDate(expense.date)}<br/>
                <strong>Payment Mode:</strong> ${expense.paymentMethod || 'Cash'}<br/>
                ${expense.transactionId ? `<strong>Transaction ID:</strong> ${expense.transactionId}` : ''}
              </div>
              <div>
                <strong>Category:</strong> ${expense.category || 'N/A'}<br/>
                <strong>Sub Category:</strong> ${expense.subCategory || 'N/A'}
              </div>
            </div>
            ${expense.vendorName ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;"><strong>Vendor:</strong> ${expense.vendorName} ${expense.vendorContact ? `| Contact: ${expense.vendorContact}` : ''}</div>` : ''}
          </div>
          <div style="margin-bottom: 20px; border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden; font-size: 11px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f2d4a1;">
                  <th style="padding: 10px; text-align: left;">Description</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Unit Price</th>
                  <th style="padding: 10px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${expense.title || expense.description || 'N/A'}</td>
                  <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e9ecef;">${expense.quantity || 1}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e9ecef;">₹ ${(subTotal / (expense.quantity || 1)).toFixed(2)}</td>
                  <td style="padding: 10px; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">₹ ${subTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold;">Total Amount: ₹ ${grandTotal.toFixed(2)}</div>
            <div style="font-size: 11px; margin-top: 8px;"><strong>In words:</strong> ${numberToWords(grandTotal)}</div>
          </div>
          <div style="text-align: center; padding-top: 15px; font-size: 10px; color: #718096;">Computer-generated expense bill. No signature required.</div>
        </div>
      `;

      const logoContainer = invoiceContent.querySelector('#print-logo-container');
      if (logoContainer) logoContainer.appendChild(logoImg);

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expense Bill - ${expense.invoiceNumber || expenseId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { padding: 0; margin: 0; }
            @page { size: A4; margin: 10mm; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>${invoiceContent.outerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 250);
    } catch (error) {
      console.error('Error printing bill:', error);
      alert('Failed to print bill. Please try again.');
    }
  };

  const downloadBill = async () => {
    try {
      // Create a temporary div for invoice PDF generation
      const invoiceContent = document.createElement('div');
      invoiceContent.id = 'expense-invoice-temp';
      invoiceContent.style.cssText = `
        width: 800px;
        max-width: 800px;
        background: white;
        margin: 0 auto;
        position: absolute;
        left: -9999px;
        top: 0;
        padding: 20px;
        font-family: Arial, sans-serif;
      `;

      // Create image element for logo with proper attributes
      const logoImg = document.createElement('img');
      logoImg.src = logo;
      logoImg.crossOrigin = 'anonymous';
      logoImg.style.cssText = 'width: 220px; height: 180px; object-fit: contain; display: block;';
      logoImg.alt = 'Irai Aram Logo';

      // Calculate amounts
      const subTotal = expense.amount || 0;
      const cgstRate = expense.cgstRate || 9;
      const sgstRate = expense.sgstRate || 9;
      const igstRate = expense.igstRate || 0;
      
      const cgstAmount = (subTotal * cgstRate) / 100;
      const sgstAmount = (subTotal * sgstRate) / 100;
      const igstAmount = (subTotal * igstRate) / 100;
      const shippingCharges = expense.shippingCharges || 0;
      const adjustment = expense.adjustment || 0;
      const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount + shippingCharges + adjustment;

      // Convert number to words
      const numberToWords = (num) => {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

        if (num === 0) return 'zero';
        
        const convert = (n) => {
          if (n < 10) return ones[n];
          if (n < 20) return teens[n - 10];
          if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
          if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
          if (n < 100000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
          if (n < 10000000) return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
          return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
        };
        
        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);
        
        let words = convert(rupees).trim();
        words = words.charAt(0).toUpperCase() + words.slice(1);
        
        if (paise > 0) {
          words += ' and ' + convert(paise) + ' paise';
        }
        words += ' only';
        
        return words;
      };

      invoiceContent.innerHTML = `
        <div style="background: white; padding: 30px; font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <!-- Header Section -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
            <div id="logo-container" style="flex: 0 0 auto; padding: 10px; background: white; border-radius: 8px;">
            </div>
            
            <div style="flex: 1; text-align: right; color: #1a202c;">
              <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #1a202c;">IRAI NIYATHI ARAKATTALAI</div>
              <div style="font-size: 11px; line-height: 1.6; color: #4a5568;">
                No.07, First Floor, Sivarathiinam Complex,<br/>
                Near Register Office, Vellalore,<br/>
                COIMBATORE - 641111<br/>
                Phone No: 97894 85258<br/>
                GSTIN: ${expense.gstin || '33AAICB5046L1ZL'}
              </div>
            </div>
          </div>

          <!-- Invoice Title -->
          <div style="text-align: center; padding: 20px 0; margin-bottom: 25px;">
            <div style="font-size: 22px; font-weight: bold; color: #1a202c; text-transform: uppercase;">Expense Bill</div>
            <div style="font-size: 14px; color: #718096; margin-top: 5px;">Invoice No: ${expense.invoiceNumber || 'N/A'}</div>
          </div>

          <!-- Invoice Details Section -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 15px;">
              <div>
                <table style="width: 100%; font-size: 12px; color: #333;">
                  <tr>
                    <td style="padding: 6px 0; width: 40%; font-weight: 600; color: #4a5568;">Invoice Date:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${formatSimpleDate(expense.date)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Payment Mode:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.paymentMethod || 'Cash'}</td>
                  </tr>
                  ${expense.transactionId ? `
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Transaction ID:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.transactionId}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <div>
                <table style="width: 100%; font-size: 12px; color: #333;">
                  <tr>
                    <td style="padding: 6px 0; width: 40%; font-weight: 600; color: #4a5568;">Category:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.category || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Sub Category:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.subCategory || 'N/A'}</td>
                  </tr>
                  ${expense.department ? `
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Department:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.department}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>
            
            ${expense.vendorName ? `
            <div style="padding-top: 15px; border-top: 1px solid #dee2e6;">
              <div style="font-size: 12px; font-weight: 600; color: #4a5568; margin-bottom: 8px;">Vendor Details:</div>
              <div style="font-size: 12px; color: #1a202c; line-height: 1.6;">
                ${expense.vendorName}<br/>
                ${expense.vendorContact ? `Contact: ${expense.vendorContact}` : ''}
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 25px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f2d4a1; color: #1a202c;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6;">Description</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #dee2e6;">Unit Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #dee2e6;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; color: #1a202c; border-bottom: 1px solid #e9ecef;">${expense.title || expense.description || 'N/A'}</td>
                  <td style="padding: 12px; text-align: center; color: #1a202c; border-bottom: 1px solid #e9ecef;">${expense.quantity || 1}</td>
                  <td style="padding: 12px; text-align: right; color: #1a202c; border-bottom: 1px solid #e9ecef;">₹ ${(subTotal / (expense.quantity || 1)).toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right; font-weight: 600; color: #1a202c; border-bottom: 1px solid #e9ecef;">₹ ${subTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totals Section -->
          <div style="display: flex; gap: 20px; margin-bottom: 25px;">
            <!-- Bank Details -->
            ${expense.accountNumber ? `
            <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <div style="font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f2d4a1;">Bank Details</div>
              <div style="font-size: 12px; color: #1a202c; line-height: 1.8;">
                <strong>IRAI NIYATHI ARAKATTALAI</strong><br/>
                <strong>Account Number:</strong> ${expense.accountNumber}<br/>
                ${expense.ifscCode ? `<strong>IFSC:</strong> ${expense.ifscCode}<br/>` : ''}
                ${expense.branchName ? `<strong>Branch:</strong> ${expense.branchName}<br/>` : ''}
                ${expense.accountType ? `<strong>Account Type:</strong> ${expense.accountType}` : ''}
              </div>
            </div>
            ` : ''}

            <!-- Summary Box -->
            <div style="width: 300px; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <table style="width: 100%; font-size: 12px;">
                <tr>
                  <td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #1a202c;">Total Amount:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #1a202c;">₹ ${grandTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Total in Words -->
          <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #4a5568; margin-bottom: 5px; font-weight: 600;">Total amount in words:</div>
            <div style="font-size: 13px; color: #1a202c; font-weight: 600;">${numberToWords(grandTotal)}</div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 11px; color: #718096;">
            This is a computer-generated expense bill. No signature required.
          </div>

        </div>
      `;

      document.body.appendChild(invoiceContent);
      
      // Insert logo
      const logoContainer = invoiceContent.querySelector('#logo-container');
      if (logoContainer) {
        logoContainer.appendChild(logoImg);
      }

      // Wait for logo to load before generating PDF
      await new Promise((resolve) => {
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
          resolve();
        } else {
          logoImg.onload = () => {
            setTimeout(resolve, 100); // Small delay to ensure rendering
          };
          logoImg.onerror = () => {
            console.warn('Logo failed to load, continuing without it');
            resolve(); // Continue even if logo fails to load
          };
          // Timeout after 3 seconds
          setTimeout(() => {
            resolve();
          }, 3000);
        }
      });

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(invoiceContent, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: invoiceContent.scrollWidth,
        height: invoiceContent.scrollHeight,
        windowWidth: invoiceContent.scrollWidth,
        windowHeight: invoiceContent.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure logo is visible in cloned document
          const clonedLogo = clonedDoc.querySelector('#logo-container img');
          if (clonedLogo) {
            clonedLogo.style.display = 'block';
            clonedLogo.style.visibility = 'visible';
          }
        }
      });

      document.body.removeChild(invoiceContent);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 5;
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      // Scale to fit single page - no page breaks
      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }
      
      const xOffset = margin + (availableWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, margin, imgWidth, imgHeight);
      pdf.save(`Expense_Invoice_${expense.invoiceNumber || expenseId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download bill. Please try again.');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!expense) {
    return <div style={styles.error}>Expense not found</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={styles.title}>Expense Details</h1>
        <div style={styles.buttonGroup}>
          <button
            style={styles.printButton}
            onClick={printBill}
          >
            🖨️ Print Bill
          </button>
          <button
            style={styles.downloadButton}
            onClick={downloadBill}
          >
            📄 Download Bill
          </button>
          <button
            style={styles.editButton}
            onClick={() => navigate(`/schoolemy/expense/edit/${expenseId}`)}
          >
            Edit
          </button>
        </div>
      </div>

      <div id="expense-bill" style={styles.card}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Invoice Number:</span>
              <span style={styles.fieldValue}>{expense.invoiceNumber}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Title:</span>
              <span style={styles.fieldValue}>{expense.title}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Amount:</span>
              <span style={{ ...styles.fieldValue, ...styles.amountValue }}>
                {formatCurrency(expense.amount)}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Status:</span>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(expense.status),
                }}
              >
                {expense.status}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Category & Department</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Category:</span>
              <span style={styles.fieldValue}>{expense.category}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Sub Category:</span>
              <span style={styles.fieldValue}>
                {expense.subCategory || "N/A"}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Department:</span>
              <span style={styles.fieldValue}>
                {expense.department || "N/A"}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Recurring:</span>
              <span style={styles.fieldValue}>
                {expense.isRecurring
                  ? `Yes (${expense.recurringPeriod})`
                  : "No"}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Vendor Information</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Vendor Name:</span>
              <span style={styles.fieldValue}>
                {expense.vendorName || "N/A"}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Vendor Contact:</span>
              <span style={styles.fieldValue}>
                {expense.vendorContact || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Payment Details</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Payment Method:</span>
              <span style={styles.fieldValue}>{expense.paymentMethod}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Transaction ID:</span>
              <span style={styles.fieldValue}>
                {expense.transactionId || "N/A"}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Date:</span>
              <span style={styles.fieldValue}>{formatDate(expense.date)}</span>
            </div>
            {expense.dueDate && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Due Date:</span>
                <span style={styles.fieldValue}>
                  {formatDate(expense.dueDate)}
                </span>
              </div>
            )}
          </div>
        </div>

        {expense.description && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Description</h2>
            <p style={styles.description}>{expense.description}</p>
          </div>
        )}

        {expense.approvedBy && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Approval Information</h2>
            <div style={styles.grid}>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Approved By:</span>
                <span style={styles.fieldValue}>
                  {expense.approvedBy.name}
                </span>
              </div>
              {expense.approvedDate && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Approved Date:</span>
                  <span style={styles.fieldValue}>
                    {formatDate(expense.approvedDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Audit Trail</h2>
          <div style={styles.auditList}>
            {expense.auditLog?.map((log, index) => (
              <div key={index} style={styles.auditItem}>
                <div style={styles.auditAction}>{log.action}</div>
                <div style={styles.auditDetails}>
                  <span style={styles.auditUser}>
                    By: {log.performedBy?.name || "System"}
                  </span>
                  <span style={styles.auditTime}>
                    {formatDate(log.timestamp)}
                  </span>
                </div>
                {log.changes?.reason && (
                  <div style={styles.auditReason}>
                    Reason: {log.changes.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {expense.createdBy && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Created By</h2>
            <div style={styles.grid}>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Name:</span>
                <span style={styles.fieldValue}>
                  {expense.createdBy.name}
                </span>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Email:</span>
                <span style={styles.fieldValue}>
                  {expense.createdBy.email}
                </span>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Role:</span>
                <span style={styles.fieldValue}>
                  {expense.createdBy.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    Pending: "#f59e0b",
    Approved: "#8b5cf6",
    Paid: "#10b981",
    Rejected: "#ef4444",
    Cancelled: "#6b7280",
  };
  return colors[status] || "#6b7280";
};

const styles = {
  container: {
    padding: "24px",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
  },
  editButton: {
    padding: "10px 20px",
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
  },
  printButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  downloadButton: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 2px 20px rgba(0, 0, 0, 0.08)",
  },
  section: {
    marginBottom: "32px",
    paddingBottom: "32px",
    borderBottom: "1px solid #e1e5e9",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: "16px",
    color: "#1a1a1a",
  },
  amountValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#ef4444",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    width: "fit-content",
  },
  description: {
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.6",
  },
  auditList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  auditItem: {
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    borderLeft: "4px solid #667eea",
  },
  auditAction: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "8px",
  },
  auditDetails: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#6b7280",
  },
  auditUser: {
    fontWeight: "500",
  },
  auditTime: {
    fontStyle: "italic",
  },
  auditReason: {
    marginTop: "8px",
    fontSize: "14px",
    color: "#ef4444",
    fontStyle: "italic",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#6b7280",
  },
  error: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#ef4444",
  },
};

export default ExpenseDetail;
