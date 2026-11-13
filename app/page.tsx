

"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { apiRequest } from "@/lib/api";

type ItemRow = {
  id: number;
  item: string;
  qty: number;
  price: number;
};

type QuotationItem = {
  id?: number;
  item?: string;
  qty?: number | string;
  quantity?: number | string;
  price?: number | string;
  gst18?: number | string | null;
  amount?: number | string;
};

type QuotationRecord = {
  id: number | string;
  quote_no?: number | string;
  quoteNo?: number | string;
  quotation_no?: number | string;
  quotationNo?: number | string;
  quote_number?: number | string;
  quote_date?: string;
  quoteDate?: string;
  quotation_date?: string;
  quotationDate?: string;
  date?: string;
  name?: string;
  location?: string | null;
  mobile?: string;
  mobile_number?: string;
  mobileNumber?: string;
  gst_type?: string;
  gstType?: string;
  items?: QuotationItem[];
  quotation_items?: QuotationItem[];
  quotationItems?: QuotationItem[];
  quotation?: any;
  [key: string]: any;
};

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const createItem = (): ItemRow => ({
  id: Date.now() + Math.random(),
  item: "",
  qty: 1,
  price: 0,
});

const unwrapResponse = (response: any): any => {
  let result = response;

  for (let i = 0; i < 5; i++) {
    if (
      result &&
      !Array.isArray(result) &&
      typeof result === "object" &&
      "data" in result
    ) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
};

const getQuoteNo = (record: QuotationRecord): string => {
  const value =
    record.quote_no ??
    record.quoteNo ??
    record.quotation_no ??
    record.quotationNo ??
    record.quote_number ??
    record.quotation?.quote_no ??
    record.quotation?.quoteNo;

  return value == null ? "" : String(value);
};

const getQuoteDate = (record: QuotationRecord): string => {
  const value =
    record.quote_date ??
    record.quoteDate ??
    record.quotation_date ??
    record.quotationDate ??
    record.date ??
    record.quotation?.quote_date ??
    record.quotation?.quoteDate;

  return value == null ? "" : String(value);
};

const getQuotationItems = (
  record: QuotationRecord
): QuotationItem[] => {
  const value =
    record.items ??
    record.quotation_items ??
    record.quotationItems ??
    record.quotation?.items;

  return Array.isArray(value) ? value : [];
};

const formatDate = (value: unknown): string => {
  if (value == null || value === "") return "-";

  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) return `${match[3]}/${match[2]}/${match[1]}`;

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime())
    ? raw
    : parsed.toLocaleDateString("en-IN");
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "An unexpected error occurred.";

const money = (amount: number) =>
  amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const hasQuotationGst = (record: QuotationRecord) => {
  const type = String(
    record.gst_type ?? record.gstType ?? ""
  ).toLowerCase();

  const items = getQuotationItems(record);

  if (type) {
    return type === "with-gst" || type === "with_gst";
  }

  return items.some(
    (item) => item.gst18 != null && Number(item.gst18) > 0
  );
};

// =====================================================
// LOAD LOGO FROM THE NEXT.JS PUBLIC FOLDER
// File location: public/arrow-computers-logo.jpeg
// =====================================================

const loadLogoDataUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch("/arrow-computers-logo.jpeg");

    if (!response.ok) {
      throw new Error("Unable to load Arrow Computers logo.");
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Unable to read logo image."));
        }
      };

      reader.onerror = () => {
        reject(new Error("Unable to read logo image."));
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Logo loading failed:", error);
    return null;
  }
};

export default function Home() {
  const [showForm, setShowForm] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const [quoteNo, setQuoteNo] = useState("1001");
  const [date, setDate] = useState(getCurrentDate());
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [mobile, setMobile] = useState("");
  const [gstType, setGstType] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [printingId, setPrintingId] = useState<string | number | null>(
    null
  );

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);

  const [items, setItems] = useState<ItemRow[]>([createItem()]);

  const resetForm = () => {
    setEditingId(null);
    setQuoteNo("");
    setDate(getCurrentDate());
    setName("");
    setLocation("");
    setMobile("");
    setGstType("");
    setItems([createItem()]);
  };

  const handleNew = () => {
    resetForm();
    setShowForm(true);
    setShowTable(false);
  };

  const handleShow = async () => {
    setShowForm(false);
    setShowTable(true);
    setLoadingList(true);

    try {
      const response = await apiRequest("/quotations", {
        method: "GET",
      });

      const result = unwrapResponse(response);

      const records = Array.isArray(result)
        ? result
        : result?.quotations ??
          result?.records ??
          result?.results ??
          result?.items ??
          [];

      setQuotations(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error(error);
      alert("Unable to load quotations: " + getErrorMessage(error));
    } finally {
      setLoadingList(false);
    }
  };

  const handleAddRow = () =>
    setItems((previous) => [...previous, createItem()]);

  const handleDeleteRow = (id: number) =>
    setItems((previous) =>
      previous.filter((row) => row.id !== id)
    );

  const handleItemChange = (
    id: number,
    field: "item" | "qty" | "price",
    value: string
  ) => {
    setItems((previous) =>
      previous.map((row) => {
        if (row.id !== id) return row;

        if (field === "item") {
          return { ...row, item: value };
        }

        return {
          ...row,
          [field]: value === "" ? 0 : Number(value),
        };
      })
    );
  };

  const subtotal = items.reduce(
    (total, row) => total + row.qty * row.price,
    0
  );

  const cgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
  const sgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
  const gstTotal = cgst + sgst;
  const totalAmount = subtotal + gstTotal;

  // =====================================================
  // SAVE / UPDATE QUOTATION
  // =====================================================

  const handleSave = async () => {
    if (saving) return;

    const numericQuoteNo = Number(quoteNo);

    if (
      !quoteNo.trim() ||
      !Number.isSafeInteger(numericQuoteNo) ||
      numericQuoteNo <= 0
    ) {
      alert("Please enter a valid numeric Quote No.");
      return;
    }

    if (!date) return alert("Please select Date.");
    if (!name.trim()) return alert("Please enter Name.");
    if (!mobile.trim()) return alert("Please enter Mobile Number.");
    if (!gstType) return alert("Please select GST Type.");
    if (!items.length) return alert("Please add at least one item.");

    for (const row of items) {
      if (!row.item.trim()) {
        return alert("Please enter every item name.");
      }

      if (!Number.isFinite(row.qty) || row.qty <= 0) {
        return alert("Quantity must be greater than zero.");
      }

      if (!Number.isFinite(row.price) || row.price < 0) {
        return alert("Price cannot be negative.");
      }
    }

    const payload = {
      quote_no: numericQuoteNo,
      quote_date: date,
      name: name.trim(),
      location: location.trim(),
      mobile: mobile.trim(),
      gst_type: gstType,
      items: items.map((row) => {
        const base = row.qty * row.price;

        const gst18 =
          gstType === "with-gst"
            ? Number((base * 0.18).toFixed(2))
            : null;

        return {
          item: row.item.trim(),
          qty: row.qty,
          price: row.price,
          gst18,
          amount: Number((base + (gst18 ?? 0)).toFixed(2)),
        };
      }),
    };

    try {
      setSaving(true);

      const isEditing = editingId !== null;

      await apiRequest(
        isEditing ? `/quotations/${editingId}` : "/quotations",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      alert(
        isEditing
          ? "Quotation updated successfully!"
          : "Quotation saved successfully!"
      );

      resetForm();
      await handleShow();
    } catch (error) {
      alert("Unable to save quotation: " + getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // FETCH COMPLETE QUOTATION
  // =====================================================

  const fetchFullQuotation = async (
    record: QuotationRecord
  ): Promise<QuotationRecord> => {
    let quotation = record;

    if (
      getQuotationItems(quotation).length === 0 &&
      record.id != null
    ) {
      const response = await apiRequest(
        `/quotations/${record.id}`,
        { method: "GET" }
      );

      const result = unwrapResponse(response);

      quotation = (result?.quotation ?? result) as QuotationRecord;
    }

    return {
      ...quotation,
      items: getQuotationItems(quotation),
    } as QuotationRecord;
  };

  // =====================================================
  // EDIT QUOTATION
  // =====================================================

  const handleEdit = async (record: QuotationRecord) => {
    try {
      const quotation = await fetchFullQuotation(record);
      const quotationItems = getQuotationItems(quotation);

      setEditingId(Number(quotation.id));
      setQuoteNo(getQuoteNo(quotation));

      setDate(
        getQuoteDate(quotation)
          ? getQuoteDate(quotation).slice(0, 10)
          : getCurrentDate()
      );

      setName(quotation.name ?? "");
      setLocation(quotation.location ?? "");

      setMobile(
        quotation.mobile ??
          quotation.mobile_number ??
          quotation.mobileNumber ??
          ""
      );

      setGstType(
        hasQuotationGst(quotation) ? "with-gst" : "without-gst"
      );

      setItems(
        quotationItems.length
          ? quotationItems.map((item, index) => ({
              id: Number(item.id ?? Date.now() + index),
              item: item.item ?? "",
              qty: Number(item.qty ?? item.quantity ?? 1),
              price: Number(item.price ?? 0),
            }))
          : [createItem()]
      );

      setShowForm(true);
      setShowTable(false);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      alert("Unable to load quotation: " + getErrorMessage(error));
    }
  };

  // =====================================================
  // PDF GENERATION WITH COMPANY LOGO
  // =====================================================

  const generateQuotationPDF = async (
    quotation: QuotationRecord
  ) => {
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 14;
    const right = pageWidth - margin;

    const quote = getQuoteNo(quotation) || "-";
    const quoteDate = formatDate(getQuoteDate(quotation));
    const quoteItems = getQuotationItems(quotation);
    const gst = hasQuotationGst(quotation);

    const customerMobile =
      quotation.mobile ??
      quotation.mobile_number ??
      quotation.mobileNumber ??
      "-";

    const fmt = (amount: number) =>
      `Rs. ${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const sub = quoteItems.reduce(
      (sum, item) =>
        sum +
        Number(item.qty ?? item.quantity ?? 0) *
          Number(item.price ?? 0),
      0
    );

    const cg = gst ? sub * 0.09 : 0;
    const sg = gst ? sub * 0.09 : 0;
    const grand = sub + cg + sg;

    // Load logo from public folder before generating the PDF.
    const logoData = await loadLogoDataUrl();

    // -----------------------------------------------------
    // PAGE 1: COMPANY HEADER AND QUOTATION
    // -----------------------------------------------------

    doc.setDrawColor(21, 148, 71);
    doc.setLineWidth(0.8);
    doc.line(margin, 12, right, 12);

    // LOGO: public/arrow-computers-logo.jpeg
    // Positioned on the left side of the company header.
    if (logoData) {
      try {
        doc.addImage(
          logoData,
          "JPEG",
          margin,
          15,
          25,
          25
        );
      } catch (error) {
        console.error("Unable to add logo to PDF:", error);
      }
    }

    // Company name remains centered.
    doc.setTextColor(7, 139, 66);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);

    doc.text("ARROW COMPUTERS", pageWidth / 2, 22, {
      align: "center",
    });

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
      "No 402, Chennai Thiruvallur High Road, Opp to Max Showroom, Avadi - 600054",
      pageWidth / 2,
      29,
      { align: "center" }
    );

    doc.text(
      "Phone: 8610901240 | Email: arrowcomputersavadi@gamil.com",
      pageWidth / 2,
      34,
      { align: "center" }
    );

    doc.text(
      "GST: 33PIPPS0073B1Z2 | PAN: 33PIPPS0073B",
      pageWidth / 2,
      39,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");

    doc.text("www.arrowcomputerz.com", pageWidth / 2, 44, {
      align: "center",
    });

    doc.line(margin, 49, right, 49);

    doc.setFontSize(15);

    doc.text("QUOTATION", pageWidth / 2, 58, {
      align: "center",
    });

    autoTable(doc, {
      startY: 64,
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [30, 30, 30],
      },
      body: [
        [
          `QUOTATION TO\nName: ${quotation.name || "-"}\nLocation: ${quotation.location || "-"}\nMobile: ${customerMobile}`,
          `Quote No: AC - ${quote}\nDate: ${quoteDate}\nGST: ${
            gst ? "With GST (18%)" : "Without GST"
          }`,
        ],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      theme: "grid",
      margin: { left: margin, right: margin },

      head: [
        [
          "S.No",
          "Item / Description",
          "Qty",
          "Price (Rs.)",
          ...(gst ? ["GST 18% (Rs.)"] : []),
          "Amount (Rs.)",
        ],
      ],

      body: quoteItems.length
        ? quoteItems.map((item, index) => {
            const qty = Number(item.qty ?? item.quantity ?? 0);
            const price = Number(item.price ?? 0);
            const base = qty * price;
            const tax = gst
              ? Number((base * 0.18).toFixed(2))
              : 0;

            return [
              String(index + 1),
              item.item || "-",
              String(qty),
              fmt(price),
              ...(gst ? [fmt(tax)] : []),
              fmt(base + tax),
            ];
          })
        : [
            [
              "1",
              "No items",
              "-",
              "-",
              ...(gst ? ["-"] : []),
              "-",
            ],
          ],

      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: [235, 242, 237],
        textColor: [20, 20, 20],
      },

      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 13, halign: "center" },
      },
    });

    let y = (doc as any).lastAutoTable.finalY + 8;

    if (y > 205) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("BANK DETAILS", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
      [
        "Name: Arrow Computers",
        "IFSC Code: HDFC0006718",
        "Account No: 50200097119884",
        "Bank: HDFC Bank, TNHB Avadi",
      ],
      margin,
      y + 6
    );

    autoTable(doc, {
      startY: y - 3,
      theme: "plain",
      margin: { left: 116, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 1: { halign: "right" } },

      body: [
        ["Subtotal", fmt(sub)],
        ...(gst
          ? [
              ["CGST 9%", fmt(cg)],
              ["SGST 9%", fmt(sg)],
            ]
          : []),
        ["GRAND TOTAL", fmt(grand)],
      ],

      didParseCell: (data) => {
        if (data.row.index === (gst ? 3 : 1)) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    y = Math.max(
      y + 31,
      (doc as any).lastAutoTable.finalY + 6
    );

    if (y > 245) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Note:", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const note =
      "This quotation is valid for 2 days from the date of issue. Prices may change after the validity period. Delivery will be made within the committed time. Any delay due to stock or logistics issues will be informed.";

    doc.text(
      doc.splitTextToSize(note, right - margin),
      margin,
      y + 5
    );

    doc.setFont("helvetica", "bold");

    doc.text("Authorized Signatory", right, 268, {
      align: "right",
    });

    doc.text("ARROW COMPUTERS", right, 273, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");

    doc.text("www.arrowcomputerz.com", margin, 282);

    // -----------------------------------------------------
    // PAGE 2: TERMS AND CONDITIONS
    // -----------------------------------------------------

    doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);

    doc.text("TERMS & CONDITIONS", pageWidth / 2, 22, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const intro =
      "This Quotation is valid for 2 Days from the date of issue. Prices may change after validity period. Delivery will be made within the committed time. Any delay due to stock or logistics issues will be informed.";

    const introLines = doc.splitTextToSize(
      intro,
      pageWidth - margin * 2
    );

    doc.text(introLines, margin, 35);

    const terms = [
      "Refurbished Products covers Under 1 year service warranty & 1 Month parts replacement warranty.",
      "Assembled Full set PC covers 1 year warranty.",
      "Liability: ARROW COMPUTERS is not responsible for any data loss. Customers are advised to take backup.",
      "Service warranty covers OS & Software issues only. Hardware not included.",
      "For Brand New products as per Manufacturer warranty.",
      "Physical & liquid damages warranty can't claim.",
    ];

    let termY = 35 + introLines.length * 6 + 12;

    terms.forEach((term, index) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}.`, margin + 2, termY);

      doc.setFont("helvetica", "normal");

      const lines = doc.splitTextToSize(
        term,
        pageWidth - margin * 2 - 13
      );

      doc.text(lines, margin + 12, termY);

      termY += lines.length * 6 + 4;
    });

    doc.setFontSize(9);

    doc.text(
      "www.arrowcomputerz.com",
      margin,
      pageHeight - 15
    );

    doc.setFont("helvetica", "bold");

    doc.text(
      "Authorized Signatory",
      right,
      pageHeight - 25,
      { align: "right" }
    );

    doc.text(
      "ARROW COMPUTERS",
      right,
      pageHeight - 20,
      { align: "right" }
    );

    return { doc, quote };
  };

  // =====================================================
  // DOWNLOAD PDF WITH LOGO
  // =====================================================

  const handleDownloadPDF = async (
    record: QuotationRecord
  ) => {
    try {
      setPrintingId(record.id);

      const quotation = await fetchFullQuotation(record);

      // IMPORTANT: Wait until logo is loaded and PDF is generated.
      const { doc, quote } = await generateQuotationPDF(quotation);

      doc.save(`Arrow-Computers-Quotation-${quote}.pdf`);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to download PDF: " + getErrorMessage(error)
      );
    } finally {
      setPrintingId(null);
    }
  };

  // =====================================================
  // PRINT PDF WITH LOGO
  // =====================================================

  const handlePrint = async (record: QuotationRecord) => {
    let url: string | null = null;

    try {
      setPrintingId(record.id);

      const quotation = await fetchFullQuotation(record);

      // IMPORTANT: Wait until logo is loaded and PDF is generated.
      const { doc } = await generateQuotationPDF(quotation);

      const blob = doc.output("blob");
      url = URL.createObjectURL(blob);

      const printWindow = window.open(url, "_blank");

      if (!printWindow) {
        URL.revokeObjectURL(url);
        url = null;

        alert("Please allow pop-ups to print the quotation.");
        return;
      }

      printWindow.addEventListener(
        "load",
        () => {
          printWindow.focus();
          printWindow.print();
        },
        { once: true }
      );

      const printUrl = url;

      window.setTimeout(() => {
        URL.revokeObjectURL(printUrl);
      }, 60000);
    } catch (error) {
      console.error(error);

      if (url) {
        URL.revokeObjectURL(url);
      }

      alert("Unable to print quotation: " + getErrorMessage(error));
    } finally {
      setPrintingId(null);
    }
  };

  // =====================================================
  // DELETE QUOTATION
  // =====================================================

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this quotation?"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);

      await apiRequest(`/quotations/${id}`, {
        method: "DELETE",
      });

      setQuotations((previous) =>
        previous.filter(
          (quotation) => Number(quotation.id) !== id
        )
      );

      alert("Quotation deleted successfully!");
    } catch (error) {
      alert("Unable to delete quotation: " + getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-800 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Sales Management
            </p>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Quotation Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create, manage and track customer quotations.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleNew}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              + New
            </button>

            <button
              type="button"
              onClick={handleShow}
              disabled={loadingList}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingList ? "Loading..." : "Show"}
            </button>
          </div>
        </header>

        {showForm && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
              <h2 className="text-xl font-bold">
                {editingId !== null
                  ? "Edit Quotation"
                  : "Quotation Form"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter customer details and quotation items.
              </p>
            </div>

            <div className="space-y-8 p-5 sm:p-8">
              <div>
                <h3 className="mb-4 font-bold">Customer Details</h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>
                      Quote No *
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quoteNo}
                      onChange={(e) => setQuoteNo(e.target.value)}
                      className={inputClass}
                      placeholder="Enter quote number"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Date *</label>

                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Name *</label>

                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      placeholder="Enter Name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Mobile Number *
                    </label>

                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      maxLength={10}
                      className={inputClass}
                      placeholder="Enter Mobile Number"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Location</label>

                    <textarea
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="Enter Location"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>GST Type *</label>

                    <select
                      value={gstType}
                      onChange={(e) => setGstType(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select GST Type</option>
                      <option value="with-gst">With GST</option>
                      <option value="without-gst">Without GST</option>
                    </select>

                    <p className="mt-2 text-xs text-slate-500">
                      {gstType === "with-gst"
                        ? "GST 18% applies: CGST 9% and SGST 9%."
                        : gstType === "without-gst"
                          ? "No GST will be added."
                          : "Select a GST type to display items."}
                    </p>
                  </div>
                </div>
              </div>

              {gstType && (
                <div>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold">Quotation Items</h3>

                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[850px] border-collapse text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {[
                            "Item",
                            "QTY",
                            "Price (₹)",
                            ...(gstType === "with-gst"
                              ? ["GST 18% (₹)"]
                              : []),
                            "Amount (₹)",
                            "Action",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="border-b px-4 py-4 text-left font-semibold text-slate-600"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((row) => {
                          const base = row.qty * row.price;

                          const rowGst =
                            gstType === "with-gst"
                              ? base * 0.18
                              : 0;

                          return (
                            <tr
                              key={row.id}
                              className="hover:bg-slate-50"
                            >
                              <td className="border-b p-3">
                                <input
                                  value={row.item}
                                  onChange={(e) =>
                                    handleItemChange(
                                      row.id,
                                      "item",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter Item"
                                  className="w-full min-w-44 rounded-lg border px-3 py-2.5"
                                />
                              </td>

                              <td className="border-b p-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={row.qty}
                                  onChange={(e) =>
                                    handleItemChange(
                                      row.id,
                                      "qty",
                                      e.target.value
                                    )
                                  }
                                  className="w-20 rounded-lg border px-2 py-2.5"
                                />
                              </td>

                              <td className="border-b p-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.price}
                                  onChange={(e) =>
                                    handleItemChange(
                                      row.id,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded-lg border px-2 py-2.5"
                                />
                              </td>

                              {gstType === "with-gst" && (
                                <td className="border-b px-4 py-3 text-right">
                                  ₹{money(rowGst)}
                                </td>
                              )}

                              <td className="border-b px-4 py-3 text-right font-semibold">
                                ₹{money(base + rowGst)}
                              </td>

                              <td className="border-b p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteRow(row.id)
                                  }
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <div className="w-full rounded-2xl border bg-slate-50 p-5 sm:max-w-md">
                      <h3 className="mb-4 font-bold">
                        Quotation Summary
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>₹{money(subtotal)}</span>
                        </div>

                        {gstType === "with-gst" && (
                          <>
                            <div className="flex justify-between">
                              <span>CGST 9%</span>
                              <span>₹{money(cgst)}</span>
                            </div>

                            <div className="flex justify-between">
                              <span>SGST 9%</span>
                              <span>₹{money(sgst)}</span>
                            </div>

                            <div className="flex justify-between border-t pt-3">
                              <span>GST Total</span>
                              <span>₹{money(gstTotal)}</span>
                            </div>
                          </>
                        )}

                        <div className="flex justify-between border-t pt-4">
                          <span className="text-base font-bold">
                            Grand Total
                          </span>

                          <span className="text-xl font-bold text-blue-700">
                            ₹{money(totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
                {editingId !== null && (
                  <button
                    type="button"
                    onClick={handleNew}
                    disabled={saving}
                    className="rounded-xl border px-5 py-3 text-sm font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Quotation"
                      : "Save Quotation"}
                </button>
              </div>
            </div>
          </section>
        )}

        {showTable && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5 sm:px-8">
              <div>
                <h2 className="text-xl font-bold">
                  All Quotations
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View, edit, print, download and delete quotations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleShow}
                disabled={loadingList}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
              >
                {loadingList ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="p-5 sm:p-8">
              {loadingList ? (
                <p className="py-10 text-center text-slate-500">
                  Loading quotations...
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[1000px] border-collapse text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          "S.No",
                          "Quote No",
                          "Date",
                          "Name",
                          "Mobile Number",
                          "Action",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="border-b px-4 py-4 text-left font-semibold text-slate-600"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {quotations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-slate-500"
                          >
                            No quotations found.
                          </td>
                        </tr>
                      ) : (
                        quotations.map((quotation, index) => (
                          <tr
                            key={quotation.id ?? index}
                            className="hover:bg-blue-50/40"
                          >
                            <td className="border-b px-4 py-4 text-center">
                              {index + 1}
                            </td>

                            <td className="border-b px-4 py-4 font-semibold">
                              {getQuoteNo(quotation) || "-"}
                            </td>

                            <td className="border-b px-4 py-4">
                              {formatDate(getQuoteDate(quotation))}
                            </td>

                            <td className="border-b px-4 py-4">
                              {quotation.name || "-"}
                            </td>

                            <td className="border-b px-4 py-4">
                              {quotation.mobile ??
                                quotation.mobile_number ??
                                quotation.mobileNumber ??
                                "-"}
                            </td>

                            <td className="border-b px-4 py-4">
                              <div className="flex flex-wrap justify-center gap-2">
                                <button
                                  type="button"
                                  disabled={printingId !== null}
                                  onClick={() =>
                                    handlePrint(quotation)
                                  }
                                  className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  {printingId === quotation.id
                                    ? "Preparing..."
                                    : "Print"}
                                </button>

                                <button
                                  type="button"
                                  disabled={printingId !== null}
                                  onClick={() =>
                                    handleDownloadPDF(quotation)
                                  }
                                  className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                >
                                  {printingId === quotation.id
                                    ? "Preparing..."
                                    : "Download PDF"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleEdit(quotation)}
                                  className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    deletingId ===
                                      Number(quotation.id) ||
                                    quotation.id == null
                                  }
                                  onClick={() =>
                                    handleDelete(
                                      Number(quotation.id)
                                    )
                                  }
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                >
                                  {deletingId ===
                                  Number(quotation.id)
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}



// "use client";

// import { useEffect, useState } from "react";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import { apiRequest } from "@/lib/api";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// type QuotationItem = {
//   id?: number;
//   item?: string;
//   qty?: number | string;
//   quantity?: number | string;
//   price?: number | string;
//   gst18?: number | string | null;
//   amount?: number | string;
// };

// type QuotationRecord = {
//   id: number | string;
//   quote_no?: number | string;
//   quoteNo?: number | string;
//   quotation_no?: number | string;
//   quotationNo?: number | string;
//   quote_number?: number | string;
//   quote_date?: string;
//   quoteDate?: string;
//   quotation_date?: string;
//   quotationDate?: string;
//   date?: string;
//   name?: string;
//   location?: string | null;
//   mobile?: string;
//   mobile_number?: string;
//   mobileNumber?: string;
//   gst_type?: string;
//   gstType?: string;
//   items?: QuotationItem[];
//   quotation_items?: QuotationItem[];
//   quotationItems?: QuotationItem[];
//   quotation?: any;
//   [key: string]: any;
// };

// const getCurrentDate = () => {
//   const now = new Date();
//   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
// };

// const createItem = (): ItemRow => ({
//   id: Date.now() + Math.random(),
//   item: "",
//   qty: 1,
//   price: 0,
// });

// const unwrapResponse = (response: any): any => {
//   let result = response;
//   for (let i = 0; i < 5; i++) {
//     if (
//       result &&
//       !Array.isArray(result) &&
//       typeof result === "object" &&
//       "data" in result
//     ) {
//       result = result.data;
//     } else {
//       break;
//     }
//   }
//   return result;
// };

// const getQuoteNo = (record: QuotationRecord): string => {
//   const value =
//     record.quote_no ??
//     record.quoteNo ??
//     record.quotation_no ??
//     record.quotationNo ??
//     record.quote_number ??
//     record.quotation?.quote_no ??
//     record.quotation?.quoteNo;
//   return value == null ? "" : String(value);
// };

// const getQuoteDate = (record: QuotationRecord): string => {
//   const value =
//     record.quote_date ??
//     record.quoteDate ??
//     record.quotation_date ??
//     record.quotationDate ??
//     record.date ??
//     record.quotation?.quote_date ??
//     record.quotation?.quoteDate;
//   return value == null ? "" : String(value);
// };

// const getQuotationItems = (record: QuotationRecord): QuotationItem[] => {
//   const value =
//     record.items ??
//     record.quotation_items ??
//     record.quotationItems ??
//     record.quotation?.items;
//   return Array.isArray(value) ? value : [];
// };

// const formatDate = (value: unknown): string => {
//   if (value == null || value === "") return "-";
//   const raw = String(value);
//   const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
//   if (match) return `${match[3]}/${match[2]}/${match[1]}`;
//   const parsed = new Date(raw);
//   return Number.isNaN(parsed.getTime())
//     ? raw
//     : parsed.toLocaleDateString("en-IN");
// };

// const getErrorMessage = (error: unknown) =>
//   error instanceof Error ? error.message : "An unexpected error occurred.";

// const money = (amount: number) =>
//   amount.toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// const hasQuotationGst = (record: QuotationRecord) => {
//   const type = String(record.gst_type ?? record.gstType ?? "").toLowerCase();
//   const items = getQuotationItems(record);

//   if (type) {
//     return type === "with-gst" || type === "with_gst";
//   }

//   return items.some(
//     (item) => item.gst18 != null && Number(item.gst18) > 0
//   );
// };

// export default function Home() {
//   const [showForm, setShowForm] = useState(true);
//   const [showTable, setShowTable] = useState(false);

//   const [quoteNo, setQuoteNo] = useState("1001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [gstType, setGstType] = useState("");

//   const [saving, setSaving] = useState(false);
//   const [loadingList, setLoadingList] = useState(false);
//   const [deletingId, setDeletingId] = useState<number | null>(null);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [printingId, setPrintingId] = useState<string | number | null>(null);

//   const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
//   const [printQuotation, setPrintQuotation] =
//     useState<QuotationRecord | null>(null);

//   const [items, setItems] = useState<ItemRow[]>([createItem()]);

//   const resetForm = () => {
//     setEditingId(null);
//     setQuoteNo("");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");
//     setItems([createItem()]);
//   };

//   const handleNew = () => {
//     resetForm();
//     setShowForm(true);
//     setShowTable(false);
//   };

//   const handleShow = async () => {
//     setShowForm(false);
//     setShowTable(true);
//     setLoadingList(true);

//     try {
//       const response = await apiRequest("/quotations", { method: "GET" });
//       const result = unwrapResponse(response);

//       const records = Array.isArray(result)
//         ? result
//         : result?.quotations ??
//           result?.records ??
//           result?.results ??
//           result?.items ??
//           [];

//       setQuotations(Array.isArray(records) ? records : []);
//     } catch (error) {
//       console.error(error);
//       alert("Unable to load quotations: " + getErrorMessage(error));
//     } finally {
//       setLoadingList(false);
//     }
//   };

//   const handleAddRow = () =>
//     setItems((previous) => [...previous, createItem()]);

//   const handleDeleteRow = (id: number) =>
//     setItems((previous) => previous.filter((row) => row.id !== id));

//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string
//   ) => {
//     setItems((previous) =>
//       previous.map((row) => {
//         if (row.id !== id) return row;
//         if (field === "item") return { ...row, item: value };
//         return { ...row, [field]: value === "" ? 0 : Number(value) };
//       })
//     );
//   };

//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );
//   const cgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const sgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const gstTotal = cgst + sgst;
//   const totalAmount = subtotal + gstTotal;

//   const handleSave = async () => {
//     if (saving) return;

//     const numericQuoteNo = Number(quoteNo);

//     if (
//       !quoteNo.trim() ||
//       !Number.isSafeInteger(numericQuoteNo) ||
//       numericQuoteNo <= 0
//     ) {
//       alert("Please enter a valid numeric Quote No.");
//       return;
//     }
//     if (!date) return alert("Please select Date.");
//     if (!name.trim()) return alert("Please enter Name.");
//     if (!mobile.trim()) return alert("Please enter Mobile Number.");
//     if (!gstType) return alert("Please select GST Type.");
//     if (!items.length) return alert("Please add at least one item.");

//     for (const row of items) {
//       if (!row.item.trim()) return alert("Please enter every item name.");
//       if (!Number.isFinite(row.qty) || row.qty <= 0)
//         return alert("Quantity must be greater than zero.");
//       if (!Number.isFinite(row.price) || row.price < 0)
//         return alert("Price cannot be negative.");
//     }

//     const payload = {
//       quote_no: numericQuoteNo,
//       quote_date: date,
//       name: name.trim(),
//       location: location.trim(),
//       mobile: mobile.trim(),
//       gst_type: gstType,
//       items: items.map((row) => {
//         const base = row.qty * row.price;
//         const gst18 =
//           gstType === "with-gst"
//             ? Number((base * 0.18).toFixed(2))
//             : null;
//         return {
//           item: row.item.trim(),
//           qty: row.qty,
//           price: row.price,
//           gst18,
//           amount: Number((base + (gst18 ?? 0)).toFixed(2)),
//         };
//       }),
//     };

//     try {
//       setSaving(true);
//       const isEditing = editingId !== null;

//       await apiRequest(
//         isEditing ? `/quotations/${editingId}` : "/quotations",
//         {
//           method: isEditing ? "PUT" : "POST",
//           body: JSON.stringify(payload),
//         }
//       );

//       alert(isEditing ? "Quotation updated successfully!" : "Quotation saved successfully!");
//       resetForm();
//       await handleShow();
//     } catch (error) {
//       alert("Unable to save quotation: " + getErrorMessage(error));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const fetchFullQuotation = async (record: QuotationRecord) => {
//     let quotation = record;

//     if (getQuotationItems(quotation).length === 0 && record.id != null) {
//       const response = await apiRequest(`/quotations/${record.id}`, {
//         method: "GET",
//       });
//       const result = unwrapResponse(response);
//       quotation = (result?.quotation ?? result) as QuotationRecord;
//     }

//     return {
//       ...quotation,
//       items: getQuotationItems(quotation),
//     } as QuotationRecord;
//   };

//   const handleEdit = async (record: QuotationRecord) => {
//     try {
//       const quotation = await fetchFullQuotation(record);
//       const quotationItems = getQuotationItems(quotation);

//       setEditingId(Number(quotation.id));
//       setQuoteNo(getQuoteNo(quotation));
//       setDate(
//         getQuoteDate(quotation)
//           ? getQuoteDate(quotation).slice(0, 10)
//           : getCurrentDate()
//       );
//       setName(quotation.name ?? "");
//       setLocation(quotation.location ?? "");
//       setMobile(
//         quotation.mobile ??
//           quotation.mobile_number ??
//           quotation.mobileNumber ??
//           ""
//       );
//       setGstType(hasQuotationGst(quotation) ? "with-gst" : "without-gst");

//       setItems(
//         quotationItems.length
//           ? quotationItems.map((item, index) => ({
//               id: Number(item.id ?? Date.now() + index),
//               item: item.item ?? "",
//               qty: Number(item.qty ?? item.quantity ?? 1),
//               price: Number(item.price ?? 0),
//             }))
//           : [createItem()]
//       );

//       setShowForm(true);
//       setShowTable(false);
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     } catch (error) {
//       alert("Unable to load quotation: " + getErrorMessage(error));
//     }
//   };

//   // Shared PDF generation for download and print.
//   const generateQuotationPDF = (quotation: QuotationRecord) => {
//     const doc = new jsPDF("p", "mm", "a4");
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();
//     const margin = 14;
//     const right = pageWidth - margin;
//     const quote = getQuoteNo(quotation) || "-";
//     const quoteDate = formatDate(getQuoteDate(quotation));
//     const quoteItems = getQuotationItems(quotation);
//     const gst = hasQuotationGst(quotation);

//     const customerMobile =
//       quotation.mobile ??
//       quotation.mobile_number ??
//       quotation.mobileNumber ??
//       "-";

//     const fmt = (amount: number) =>
//       `Rs. ${amount.toLocaleString("en-IN", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       })}`;

//     const sub = quoteItems.reduce(
//       (sum, item) =>
//         sum +
//         Number(item.qty ?? item.quantity ?? 0) * Number(item.price ?? 0),
//       0
//     );
//     const cg = gst ? sub * 0.09 : 0;
//     const sg = gst ? sub * 0.09 : 0;
//     const grand = sub + cg + sg;

//     // Page 1: Company header and quotation.
//     doc.setDrawColor(21, 148, 71);
//     doc.setLineWidth(0.8);
//     doc.line(margin, 12, right, 12);
//     doc.setTextColor(7, 139, 66);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(20);
//     doc.text("ARROW COMPUTERS", pageWidth / 2, 22, { align: "center" });

//     doc.setTextColor(30, 30, 30);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     doc.text(
//       "No 402, Chennai Thiruvallur High Road, Opp to Max Showroom, Avadi - 600054",
//       pageWidth / 2,
//       29,
//       { align: "center" }
//     );
//     doc.text(
//       "Phone: 8610901240 | Email: arrowcomputersavadi@gamil.com",
//       pageWidth / 2,
//       34,
//       { align: "center" }
//     );
//     doc.text(
//       "GST: 33PIPPS0073B1Z2 | PAN: 33PIPPS0073B",
//       pageWidth / 2,
//       39,
//       { align: "center" }
//     );
//     doc.setFont("helvetica", "bold");
//     doc.text("www.arrowcomputerz.com", pageWidth / 2, 44, { align: "center" });
//     doc.line(margin, 49, right, 49);

//     doc.setFontSize(15);
//     doc.text("QUOTATION", pageWidth / 2, 58, { align: "center" });

//     autoTable(doc, {
//       startY: 64,
//       theme: "grid",
//       margin: { left: margin, right: margin },
//       styles: { fontSize: 9, cellPadding: 3, textColor: [30, 30, 30] },
//       body: [[
//         `QUOTATION TO\nName: ${quotation.name || "-"}\nLocation: ${quotation.location || "-"}\nMobile: ${customerMobile}`,
//         `Quote No: AC - ${quote}\nDate: ${quoteDate}\nGST: ${gst ? "With GST (18%)" : "Without GST"}`,
//       ]],
//     });

//     autoTable(doc, {
//       startY: (doc as any).lastAutoTable.finalY + 5,
//       theme: "grid",
//       margin: { left: margin, right: margin },
//       head: [[
//         "S.No",
//         "Item / Description",
//         "Qty",
//         "Price (Rs.)",
//         ...(gst ? ["GST 18% (Rs.)"] : []),
//         "Amount (Rs.)",
//       ]],
//       body: quoteItems.length
//         ? quoteItems.map((item, index) => {
//             const qty = Number(item.qty ?? item.quantity ?? 0);
//             const price = Number(item.price ?? 0);
//             const base = qty * price;
//             const tax = gst ? Number((base * 0.18).toFixed(2)) : 0;
//             return [
//               String(index + 1),
//               item.item || "-",
//               String(qty),
//               fmt(price),
//               ...(gst ? [fmt(tax)] : []),
//               fmt(base + tax),
//             ];
//           })
//         : [["1", "No items", "-", "-", ...(gst ? ["-"] : []), "-"]],
//       styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
//       headStyles: {
//         fillColor: [235, 242, 237],
//         textColor: [20, 20, 20],
//       },
//       columnStyles: {
//         0: { cellWidth: 12, halign: "center" },
//         2: { cellWidth: 13, halign: "center" },
//       },
//     });

//     let y = (doc as any).lastAutoTable.finalY + 8;

//     if (y > 205) {
//       doc.addPage();
//       y = 20;
//     }

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(9);
//     doc.text("BANK DETAILS", margin, y);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     doc.text(
//       [
//         "Name: Arrow Computers",
//         "IFSC Code: HDFC0006718",
//         "Account No: 50200097119884",
//         "Bank: HDFC Bank, TNHB Avadi",
//       ],
//       margin,
//       y + 6
//     );

//     autoTable(doc, {
//       startY: y - 3,
//       theme: "plain",
//       margin: { left: 116, right: margin },
//       styles: { fontSize: 8, cellPadding: 2 },
//       columnStyles: { 1: { halign: "right" } },
//       body: [
//         ["Subtotal", fmt(sub)],
//         ...(gst ? [["CGST 9%", fmt(cg)], ["SGST 9%", fmt(sg)]] : []),
//         ["GRAND TOTAL", fmt(grand)],
//       ],
//       didParseCell: (data) => {
//         if (data.row.index === (gst ? 3 : 1)) {
//           data.cell.styles.fontStyle = "bold";
//         }
//       },
//     });

//     y = Math.max(y + 31, (doc as any).lastAutoTable.finalY + 6);
//     if (y > 245) {
//       doc.addPage();
//       y = 20;
//     }

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(9);
//     doc.text("Note:", margin, y);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     const note =
//       "This quotation is valid for 2 days from the date of issue. Prices may change after the validity period. Delivery will be made within the committed time. Any delay due to stock or logistics issues will be informed.";
//     doc.text(doc.splitTextToSize(note, right - margin), margin, y + 5);

//     doc.setFont("helvetica", "bold");
//     doc.text("Authorized Signatory", right, 268, { align: "right" });
//     doc.text("ARROW COMPUTERS", right, 273, { align: "right" });
//     doc.setFont("helvetica", "normal");
//     doc.text("www.arrowcomputerz.com", margin, 282);

//     // Page 2: Terms and conditions in the requested numbered order.
//     doc.addPage();
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(15);
//     doc.text("TERMS & CONDITIONS", pageWidth / 2, 22, { align: "center" });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(11);
//     const intro =
//       "This Quotation is valid for 2 Days from the date of issue. Prices may change after validity period. Delivery will be made within the committed time. Any delay due to stock or logistics issues will be informed.";
//     const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2);
//     doc.text(introLines, margin, 35);

//     const terms = [
//       "Refurbished Products covers Under 1 year service warranty & 1 Month parts replacement warranty.",
//       "Assembled Full set PC covers 1 year warranty.",
//       "Liability: ARROW COMPUTERS is not responsible for any data loss. Customers are advised to take backup.",
//       "Service warranty covers OS & Software issues only. Hardware not included.",
//       "For Brand New products as per Manufacturer warranty.",
//       "Physical & liquid damages warranty can't claim.",
//     ];

//     let termY = 35 + introLines.length * 6 + 12;
//     terms.forEach((term, index) => {
//       doc.setFont("helvetica", "bold");
//       doc.text(`${index + 1}.`, margin + 2, termY);
//       doc.setFont("helvetica", "normal");
//       const lines = doc.splitTextToSize(
//         term,
//         pageWidth - margin * 2 - 13
//       );
//       doc.text(lines, margin + 12, termY);
//       termY += lines.length * 6 + 4;
//     });

//     doc.setFontSize(9);
//     doc.text("www.arrowcomputerz.com", margin, pageHeight - 15);
//     doc.setFont("helvetica", "bold");
//     doc.text("Authorized Signatory", right, pageHeight - 25, { align: "right" });
//     doc.text("ARROW COMPUTERS", right, pageHeight - 20, { align: "right" });

//     return { doc, quote };
//   };

//   const handleDownloadPDF = async (record: QuotationRecord) => {
//     try {
//       setPrintingId(record.id);
//       const quotation = await fetchFullQuotation(record);
//       const { doc, quote } = generateQuotationPDF(quotation);
//       doc.save(`Arrow-Computers-Quotation-${quote}.pdf`);
//     } catch (error) {
//       console.error(error);
//       alert("Unable to download PDF: " + getErrorMessage(error));
//     } finally {
//       setPrintingId(null);
//     }
//   };

//   const handlePrint = async (record: QuotationRecord) => {
//     try {
//       setPrintingId(record.id);
//       const quotation = await fetchFullQuotation(record);
//       const { doc } = generateQuotationPDF(quotation);

//       // Open the generated PDF for the browser's Print dialog.
//       const blob = doc.output("blob");
//       const url = URL.createObjectURL(blob);
//       const printWindow = window.open(url, "_blank");

//       if (!printWindow) {
//         URL.revokeObjectURL(url);
//         alert("Please allow pop-ups to print the quotation.");
//         return;
//       }

//       printWindow.addEventListener("load", () => {
//         printWindow.focus();
//         printWindow.print();
//       });
//       window.setTimeout(() => URL.revokeObjectURL(url), 60000);
//     } catch (error) {
//       console.error(error);
//       alert("Unable to print quotation: " + getErrorMessage(error));
//     } finally {
//       setPrintingId(null);
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this quotation?")) {
//       return;
//     }

//     try {
//       setDeletingId(id);
//       await apiRequest(`/quotations/${id}`, { method: "DELETE" });
//       setQuotations((previous) =>
//         previous.filter((quotation) => Number(quotation.id) !== id)
//       );
//       alert("Quotation deleted successfully!");
//     } catch (error) {
//       alert("Unable to delete quotation: " + getErrorMessage(error));
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const inputClass =
//     "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
//   const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

//   return (
//     <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-800 sm:px-8 sm:py-10">
//       <div className="mx-auto max-w-7xl">
//         <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-blue-600">
//               Sales Management
//             </p>
//             <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
//               Quotation Management
//             </h1>
//             <p className="mt-2 text-sm text-slate-500">
//               Create, manage and track customer quotations.
//             </p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               type="button"
//               onClick={handleNew}
//               disabled={saving}
//               className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
//             >
//               + New
//             </button>
//             <button
//               type="button"
//               onClick={handleShow}
//               disabled={loadingList}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
//             >
//               {loadingList ? "Loading..." : "Show"}
//             </button>
//           </div>
//         </header>

//         {showForm && (
//           <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
//               <h2 className="text-xl font-bold">
//                 {editingId !== null ? "Edit Quotation" : "Quotation Form"}
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Enter customer details and quotation items.
//               </p>
//             </div>

//             <div className="space-y-8 p-5 sm:p-8">
//               <div>
//                 <h3 className="mb-4 font-bold">Customer Details</h3>
//                 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
//                   <div>
//                     <label className={labelClass}>Quote No *</label>
//                     <input
//                       type="number"
//                       min="1"
//                       step="1"
//                       value={quoteNo}
//                       onChange={(e) => setQuoteNo(e.target.value)}
//                       className={inputClass}
//                       placeholder="Enter quote number"
//                     />
//                   </div>
//                   <div>
//                     <label className={labelClass}>Date *</label>
//                     <input
//                       type="date"
//                       value={date}
//                       onChange={(e) => setDate(e.target.value)}
//                       className={inputClass}
//                     />
//                   </div>
//                   <div>
//                     <label className={labelClass}>Name *</label>
//                     <input
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       className={inputClass}
//                       placeholder="Enter Name"
//                     />
//                   </div>
//                   <div>
//                     <label className={labelClass}>Mobile Number *</label>
//                     <input
//                       type="tel"
//                       value={mobile}
//                       onChange={(e) => setMobile(e.target.value)}
//                       maxLength={10}
//                       className={inputClass}
//                       placeholder="Enter Mobile Number"
//                     />
//                   </div>
//                   <div>
//                     <label className={labelClass}>Location</label>
//                     <textarea
//                       value={location}
//                       onChange={(e) => setLocation(e.target.value)}
//                       rows={3}
//                       className={`${inputClass} resize-none`}
//                       placeholder="Enter Location"
//                     />
//                   </div>
//                   <div>
//                     <label className={labelClass}>GST Type *</label>
//                     <select
//                       value={gstType}
//                       onChange={(e) => setGstType(e.target.value)}
//                       className={inputClass}
//                     >
//                       <option value="">Select GST Type</option>
//                       <option value="with-gst">With GST</option>
//                       <option value="without-gst">Without GST</option>
//                     </select>
//                     <p className="mt-2 text-xs text-slate-500">
//                       {gstType === "with-gst"
//                         ? "GST 18% applies: CGST 9% and SGST 9%."
//                         : gstType === "without-gst"
//                           ? "No GST will be added."
//                           : "Select a GST type to display items."}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {gstType && (
//                 <div>
//                   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//                     <h3 className="font-bold">Quotation Items</h3>
//                     <button
//                       type="button"
//                       onClick={handleAddRow}
//                       className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
//                     >
//                       + Add Item
//                     </button>
//                   </div>

//                   <div className="overflow-x-auto rounded-xl border border-slate-200">
//                     <table className="w-full min-w-[850px] border-collapse text-sm">
//                       <thead className="bg-slate-50">
//                         <tr>
//                           {["Item", "QTY", "Price (₹)", ...(gstType === "with-gst" ? ["GST 18% (₹)"] : []), "Amount (₹)", "Action"].map((heading) => (
//                             <th key={heading} className="border-b px-4 py-4 text-left font-semibold text-slate-600">
//                               {heading}
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {items.map((row) => {
//                           const base = row.qty * row.price;
//                           const rowGst = gstType === "with-gst" ? base * 0.18 : 0;
//                           return (
//                             <tr key={row.id} className="hover:bg-slate-50">
//                               <td className="border-b p-3">
//                                 <input
//                                   value={row.item}
//                                   onChange={(e) => handleItemChange(row.id, "item", e.target.value)}
//                                   placeholder="Enter Item"
//                                   className="w-full min-w-44 rounded-lg border px-3 py-2.5"
//                                 />
//                               </td>
//                               <td className="border-b p-3">
//                                 <input
//                                   type="number"
//                                   min="1"
//                                   value={row.qty}
//                                   onChange={(e) => handleItemChange(row.id, "qty", e.target.value)}
//                                   className="w-20 rounded-lg border px-2 py-2.5"
//                                 />
//                               </td>
//                               <td className="border-b p-3">
//                                 <input
//                                   type="number"
//                                   min="0"
//                                   step="0.01"
//                                   value={row.price}
//                                   onChange={(e) => handleItemChange(row.id, "price", e.target.value)}
//                                   className="w-28 rounded-lg border px-2 py-2.5"
//                                 />
//                               </td>
//                               {gstType === "with-gst" && (
//                                 <td className="border-b px-4 py-3 text-right">₹{money(rowGst)}</td>
//                               )}
//                               <td className="border-b px-4 py-3 text-right font-semibold">₹{money(base + rowGst)}</td>
//                               <td className="border-b p-3 text-center">
//                                 <button
//                                   type="button"
//                                   onClick={() => handleDeleteRow(row.id)}
//                                   className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
//                                 >
//                                   Delete
//                                 </button>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="mt-6 flex justify-end">
//                     <div className="w-full rounded-2xl border bg-slate-50 p-5 sm:max-w-md">
//                       <h3 className="mb-4 font-bold">Quotation Summary</h3>
//                       <div className="space-y-3 text-sm">
//                         <div className="flex justify-between"><span>Subtotal</span><span>₹{money(subtotal)}</span></div>
//                         {gstType === "with-gst" && (
//                           <>
//                             <div className="flex justify-between"><span>CGST 9%</span><span>₹{money(cgst)}</span></div>
//                             <div className="flex justify-between"><span>SGST 9%</span><span>₹{money(sgst)}</span></div>
//                             <div className="flex justify-between border-t pt-3"><span>GST Total</span><span>₹{money(gstTotal)}</span></div>
//                           </>
//                         )}
//                         <div className="flex justify-between border-t pt-4">
//                           <span className="text-base font-bold">Grand Total</span>
//                           <span className="text-xl font-bold text-blue-700">₹{money(totalAmount)}</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
//                 {editingId !== null && (
//                   <button type="button" onClick={handleNew} disabled={saving} className="rounded-xl border px-5 py-3 text-sm font-semibold">
//                     Cancel Edit
//                   </button>
//                 )}
//                 <button
//                   type="button"
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
//                 >
//                   {saving ? "Saving..." : editingId !== null ? "Update Quotation" : "Save Quotation"}
//                 </button>
//               </div>
//             </div>
//           </section>
//         )}

//         {showTable && (
//           <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5 sm:px-8">
//               <div>
//                 <h2 className="text-xl font-bold">All Quotations</h2>
//                 <p className="mt-1 text-sm text-slate-500">View, edit, print, download and delete quotations.</p>
//               </div>
//               <button type="button" onClick={handleShow} disabled={loadingList} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">
//                 {loadingList ? "Refreshing..." : "Refresh"}
//               </button>
//             </div>

//             <div className="p-5 sm:p-8">
//               {loadingList ? (
//                 <p className="py-10 text-center text-slate-500">Loading quotations...</p>
//               ) : (
//                 <div className="overflow-x-auto rounded-xl border">
//                   <table className="w-full min-w-[1000px] border-collapse text-sm">
//                     <thead className="bg-slate-50">
//                       <tr>
//                         {["S.No", "Quote No", "Date", "Name", "Mobile Number", "Action"].map((heading) => (
//                           <th key={heading} className="border-b px-4 py-4 text-left font-semibold text-slate-600">{heading}</th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {quotations.length === 0 ? (
//                         <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No quotations found.</td></tr>
//                       ) : (
//                         quotations.map((quotation, index) => (
//                           <tr key={quotation.id ?? index} className="hover:bg-blue-50/40">
//                             <td className="border-b px-4 py-4 text-center">{index + 1}</td>
//                             <td className="border-b px-4 py-4 font-semibold">{getQuoteNo(quotation) || "-"}</td>
//                             <td className="border-b px-4 py-4">{formatDate(getQuoteDate(quotation))}</td>
//                             <td className="border-b px-4 py-4">{quotation.name || "-"}</td>
//                             <td className="border-b px-4 py-4">{quotation.mobile ?? quotation.mobile_number ?? quotation.mobileNumber ?? "-"}</td>
//                             <td className="border-b px-4 py-4">
//                               <div className="flex flex-wrap justify-center gap-2">
//                                 <button
//                                   type="button"
//                                   disabled={printingId !== null}
//                                   onClick={() => handlePrint(quotation)}
//                                   className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
//                                 >
//                                   {printingId === quotation.id ? "Preparing..." : "Print"}
//                                 </button>
//                                 <button
//                                   type="button"
//                                   disabled={printingId !== null}
//                                   onClick={() => handleDownloadPDF(quotation)}
//                                   className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
//                                 >
//                                   {printingId === quotation.id ? "Preparing..." : "Download PDF"}
//                                 </button>
//                                 <button
//                                   type="button"
//                                   onClick={() => handleEdit(quotation)}
//                                   className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
//                                 >
//                                   Edit
//                                 </button>
//                                 <button
//                                   type="button"
//                                   disabled={deletingId === Number(quotation.id) || quotation.id == null}
//                                   onClick={() => handleDelete(Number(quotation.id))}
//                                   className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
//                                 >
//                                   {deletingId === Number(quotation.id) ? "Deleting..." : "Delete"}
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         ))
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}
//       </div>
//     </main>
//   );
// }


// "use client";

// import { useEffect, useState } from "react";
// import { apiRequest } from "@/lib/api";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// type QuotationItem = {
//   id?: number;
//   item?: string;
//   qty?: number | string;
//   quantity?: number | string;
//   price?: number | string;
//   gst18?: number | string | null;
//   amount?: number | string;
// };

// type QuotationRecord = {
//   id: number | string;
//   quote_no?: number | string;
//   quoteNo?: number | string;
//   quotation_no?: number | string;
//   quotationNo?: number | string;
//   quote_number?: number | string;
//   quote_date?: string;
//   quoteDate?: string;
//   quotation_date?: string;
//   quotationDate?: string;
//   date?: string;
//   name?: string;
//   location?: string | null;
//   mobile?: string;
//   mobile_number?: string;
//   mobileNumber?: string;
//   gst_type?: string;
//   gstType?: string;
//   items?: QuotationItem[];
//   quotation_items?: QuotationItem[];
//   quotationItems?: QuotationItem[];
//   quotation?: any;
//   [key: string]: any;
// };

// const getCurrentDate = () => {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, "0");
//   const day = String(now.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const createItem = (): ItemRow => ({
//   id: Date.now() + Math.random(),
//   item: "",
//   qty: 1,
//   price: 0,
// });

// // Unwrap common NestJS response formats.
// const unwrapResponse = (response: any): any => {
//   let result = response;

//   for (let i = 0; i < 5; i++) {
//     if (
//       result &&
//       !Array.isArray(result) &&
//       typeof result === "object" &&
//       "data" in result
//     ) {
//       result = result.data;
//     } else {
//       break;
//     }
//   }

//   return result;
// };

// const getQuoteNo = (record: QuotationRecord): string => {
//   const value =
//     record.quote_no ??
//     record.quoteNo ??
//     record.quotation_no ??
//     record.quotationNo ??
//     record.quote_number ??
//     record.quotation?.quote_no ??
//     record.quotation?.quoteNo;

//   return value == null ? "" : String(value);
// };

// const getQuoteDate = (record: QuotationRecord): string => {
//   const value =
//     record.quote_date ??
//     record.quoteDate ??
//     record.quotation_date ??
//     record.quotationDate ??
//     record.date ??
//     record.quotation?.quote_date ??
//     record.quotation?.quoteDate;

//   return value == null ? "" : String(value);
// };

// const getQuotationItems = (
//   record: QuotationRecord
// ): QuotationItem[] => {
//   const value =
//     record.items ??
//     record.quotation_items ??
//     record.quotationItems ??
//     record.quotation?.items;

//   return Array.isArray(value) ? value : [];
// };

// const formatDate = (value: unknown): string => {
//   if (value == null || value === "") return "-";

//   const raw = String(value);
//   const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

//   // Prevent date-only values from changing because of timezone conversion.
//   if (match) {
//     return `${match[3]}/${match[2]}/${match[1]}`;
//   }

//   const parsed = new Date(raw);

//   if (Number.isNaN(parsed.getTime())) {
//     return raw;
//   }

//   return parsed.toLocaleDateString("en-IN");
// };

// const getErrorMessage = (error: unknown): string =>
//   error instanceof Error ? error.message : "An unexpected error occurred.";

// export default function Home() {
//   // FORM / TABLE VISIBILITY
//   const [showForm, setShowForm] = useState(true);
//   const [showTable, setShowTable] = useState(false);

//   // CUSTOMER DETAILS
//   const [quoteNo, setQuoteNo] = useState("1001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // GST TYPE
//   const [gstType, setGstType] = useState("");

//   // API STATES
//   const [saving, setSaving] = useState(false);
//   const [loadingList, setLoadingList] = useState(false);
//   const [deletingId, setDeletingId] = useState<number | null>(null);
//   const [editingId, setEditingId] = useState<number | null>(null);

//   // QUOTATION LIST
//   const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
//   const [printQuotation, setPrintQuotation] = useState<QuotationRecord | null>(null);
//   const [printing, setPrinting] = useState(false);

//   // ITEMS
//   const [items, setItems] = useState<ItemRow[]>([createItem()]);

//   // RESET FORM
//   const resetForm = () => {
//     setEditingId(null);
//     setQuoteNo("");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");
//     setItems([createItem()]);
//   };

//   // NEW BUTTON: open form and hide table.
//   const handleNew = () => {
//     resetForm();
//     setShowForm(true);
//     setShowTable(false);
//   };

//   // SHOW BUTTON: hide form and display only the table.
//   const handleShow = async () => {
//     setShowForm(false);
//     setShowTable(true);
//     setLoadingList(true);

//     try {
//       const response = await apiRequest("/quotations", {
//         method: "GET",
//       });

//       const result = unwrapResponse(response);

//       // Support arrays and common response wrappers.
//       const records: QuotationRecord[] = Array.isArray(result)
//         ? result
//         : Array.isArray(result?.quotations)
//           ? result.quotations
//           : Array.isArray(result?.records)
//             ? result.records
//             : Array.isArray(result?.results)
//               ? result.results
//               : Array.isArray(result?.items)
//                 ? result.items
//                 : [];

//       setQuotations(records);
//     } catch (error) {
//       console.error("Get quotations error:", error);
//       alert("Unable to load quotations: " + getErrorMessage(error));
//       setQuotations([]);
//     } finally {
//       setLoadingList(false);
//     }
//   };

//   // ADD ITEM ROW
//   const handleAddRow = () => {
//     setItems((previous) => [...previous, createItem()]);
//   };

//   // DELETE ITEM ROW
//   const handleDeleteRow = (id: number) => {
//     setItems((previous) => previous.filter((row) => row.id !== id));
//   };

//   // UPDATE ITEM ROW
//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string
//   ) => {
//     setItems((previous) =>
//       previous.map((row) => {
//         if (row.id !== id) return row;

//         if (field === "item") {
//           return { ...row, item: value };
//         }

//         return {
//           ...row,
//           [field]: value === "" ? 0 : Number(value),
//         };
//       })
//     );
//   };

//   // CALCULATIONS
//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );

//   const cgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const sgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const gstTotal = cgst + sgst;
//   const totalAmount = subtotal + gstTotal;

//   const money = (amount: number) =>
//     amount.toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   // SAVE OR UPDATE
//   const handleSave = async () => {
//     if (saving) return;

//     const numericQuoteNo = Number(quoteNo);

//     if (
//       !quoteNo.trim() ||
//       !Number.isSafeInteger(numericQuoteNo) ||
//       numericQuoteNo <= 0
//     ) {
//       alert("Please enter a valid numeric Quote No, e.g. 1001.");
//       return;
//     }

//     if (!date) {
//       alert("Please select Date.");
//       return;
//     }

//     if (!name.trim()) {
//       alert("Please enter Name.");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number.");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type.");
//       return;
//     }

//     if (items.length === 0) {
//       alert("Please add at least one item.");
//       return;
//     }

//     for (const row of items) {
//       if (!row.item.trim()) {
//         alert("Please enter an item name for every row.");
//         return;
//       }

//       if (!Number.isFinite(row.qty) || row.qty <= 0) {
//         alert("Quantity must be greater than zero.");
//         return;
//       }

//       if (!Number.isFinite(row.price) || row.price < 0) {
//         alert("Price cannot be negative.");
//         return;
//       }
//     }

//     const payload = {
//       quote_no: numericQuoteNo,
//       quote_date: date,
//       name: name.trim(),
//       location: location.trim(),
//       mobile: mobile.trim(),

//       // Keep this property if your backend supports saving GST type.
//       gst_type: gstType,

//       items: items.map((row) => {
//         const qty = Number(row.qty);
//         const price = Number(row.price);
//         const baseAmount = qty * price;

//         const gst18 =
//           gstType === "with-gst"
//             ? Number((baseAmount * 0.18).toFixed(2))
//             : null;

//         const amount =
//           gstType === "with-gst"
//             ? Number((baseAmount + (gst18 ?? 0)).toFixed(2))
//             : Number(baseAmount.toFixed(2));

//         return {
//           item: row.item.trim(),
//           qty,
//           price,
//           gst18,
//           amount,
//         };
//       }),
//     };

//     try {
//       setSaving(true);

//       const isEditing = editingId !== null;

//       const response = isEditing
//         ? await apiRequest(`/quotations/${editingId}`, {
//             method: "PUT",
//             body: JSON.stringify(payload),
//           })
//         : await apiRequest("/quotations", {
//             method: "POST",
//             body: JSON.stringify(payload),
//           });

//       console.log("Quotation API response:", response);

//       alert(
//         isEditing
//           ? "Quotation updated successfully!"
//           : "Quotation saved successfully!"
//       );

//       resetForm();

//       // After save, show the refreshed table.
//       await handleShow();
//     } catch (error) {
//       console.error("Save/update error:", error);
//       alert("Unable to save quotation: " + getErrorMessage(error));
//     } finally {
//       setSaving(false);
//     }
//   };

//   // EDIT QUOTATION
//   const handleEdit = async (record: QuotationRecord) => {
//     try {
//       let quotation = record;

//       // Fetch full details if the list response doesn't contain items.
//       if (!Array.isArray(getQuotationItems(quotation))) {
//         const response = await apiRequest(`/quotations/${record.id}`, {
//           method: "GET",
//         });

//         const result = unwrapResponse(response);
//         quotation = result?.quotation ?? result;
//       }

//       let quotationItems = getQuotationItems(quotation);

//       // Some list endpoints don't return item details.
//       if (quotationItems.length === 0) {
//         const response = await apiRequest(`/quotations/${record.id}`, {
//           method: "GET",
//         });

//         const result = unwrapResponse(response);
//         const detail = result?.quotation ?? result;

//         if (detail && typeof detail === "object") {
//           quotation = detail;
//           quotationItems = getQuotationItems(quotation);
//         }
//       }

//       const savedQuoteNo = getQuoteNo(quotation);
//       const savedDate = getQuoteDate(quotation);

//       setEditingId(Number(quotation.id));
//       setQuoteNo(savedQuoteNo);
//       setDate(savedDate ? savedDate.slice(0, 10) : getCurrentDate());
//       setName(quotation.name ?? "");
//       setLocation(quotation.location ?? "");
//       setMobile(
//         quotation.mobile ??
//           quotation.mobile_number ??
//           quotation.mobileNumber ??
//           ""
//       );

//       const savedGstType = String(
//         quotation.gst_type ?? quotation.gstType ?? ""
//       ).toLowerCase();

//       const hasGst = savedGstType
//         ? savedGstType === "with-gst" || savedGstType === "with_gst"
//         : quotationItems.some(
//             (item) => item.gst18 !== null && item.gst18 !== undefined
//           );

//       setGstType(hasGst ? "with-gst" : "without-gst");

//       setItems(
//         quotationItems.length > 0
//           ? quotationItems.map((item, index) => ({
//               id: Number(item.id ?? Date.now() + index),
//               item: item.item ?? "",
//               qty: Number(item.qty ?? item.quantity ?? 1),
//               price: Number(item.price ?? 0),
//             }))
//           : [createItem()]
//       );

//       setShowForm(true);
//       setShowTable(false);

//       window.scrollTo({ top: 0, behavior: "smooth" });
//     } catch (error) {
//       console.error("Edit quotation error:", error);
//       alert("Unable to load quotation: " + getErrorMessage(error));
//     }
//   };

//   // PRINT A SAVED QUOTATION IN ARROW COMPUTERS FORMAT
//   const handlePrint = async (record: QuotationRecord) => {
//     try {
//       setPrinting(true);
//       let quotation: QuotationRecord = record;
//       let quotationItems = getQuotationItems(quotation);

//       // The list endpoint may not include item rows; fetch the full record if needed.
//       if (quotationItems.length === 0 && record.id != null) {
//         const response = await apiRequest(`/quotations/${record.id}`, {
//           method: "GET",
//         });
//         const result = unwrapResponse(response);
//         quotation = (result?.quotation ?? result) as QuotationRecord;
//         quotationItems = getQuotationItems(quotation);
//       }

//       setPrintQuotation({
//         ...quotation,
//         items: quotationItems,
//       });
//     } catch (error) {
//       console.error("Print quotation error:", error);
//       alert("Unable to load quotation for printing: " + getErrorMessage(error));
//     } finally {
//       setPrinting(false);
//     }
//   };

//   useEffect(() => {
//     if (!printQuotation) return;
//     const timer = window.setTimeout(() => {
//       window.print();
//     }, 300);
//     return () => window.clearTimeout(timer);
//   }, [printQuotation]);

//   useEffect(() => {
//     const clearPrintRecord = () => setPrintQuotation(null);
//     window.addEventListener("afterprint", clearPrintRecord);
//     return () => window.removeEventListener("afterprint", clearPrintRecord);
//   }, []);

//   const printItems = printQuotation ? getQuotationItems(printQuotation) : [];
//   const printSubtotal = printItems.reduce(
//     (sum, item) => sum + Number(item.qty ?? item.quantity ?? 0) * Number(item.price ?? 0),
//     0,
//   );
//   const printHasGst = printQuotation
//     ? String(printQuotation.gst_type ?? printQuotation.gstType ?? "").toLowerCase().includes("with-gst") ||
//       String(printQuotation.gst_type ?? printQuotation.gstType ?? "").toLowerCase().includes("with_gst") ||
//       printItems.some((item) => item.gst18 !== null && item.gst18 !== undefined && Number(item.gst18) > 0)
//     : false;
//   const printCgst = printHasGst ? printSubtotal * 0.09 : 0;
//   const printSgst = printHasGst ? printSubtotal * 0.09 : 0;
//   const printGrandTotal = printSubtotal + printCgst + printSgst;

//   // DELETE QUOTATION
//   const handleDelete = async (id: number) => {
//     if (
//       !window.confirm("Are you sure you want to delete this quotation?")
//     ) {
//       return;
//     }

//     try {
//       setDeletingId(id);

//       await apiRequest(`/quotations/${id}`, {
//         method: "DELETE",
//       });

//       setQuotations((previous) =>
//         previous.filter((quotation) => Number(quotation.id) !== id)
//       );

//       alert("Quotation deleted successfully!");
//     } catch (error) {
//       console.error("Delete quotation error:", error);
//       alert("Unable to delete quotation: " + getErrorMessage(error));
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const inputClass =
//     "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

//   const labelClass =
//     "mb-2 block text-sm font-semibold text-slate-700";

//   return (
//     <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-800 sm:px-8 sm:py-10">
//       <div className="mx-auto max-w-7xl">
//         {/* HEADER AND BUTTONS */}
//         <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-blue-600">
//               Sales Management
//             </p>

//             <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
//               Quotation Management
//             </h1>

//             <p className="mt-2 text-sm text-slate-500">
//               Create, manage and track customer quotations.
//             </p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               type="button"
//               onClick={handleNew}
//               disabled={saving}
//               className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50"
//             >
//               + New
//             </button>

//             <button
//               type="button"
//               onClick={handleShow}
//               disabled={loadingList}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-50"
//             >
//               {loadingList ? "Loading..." : "Show"}
//             </button>
//           </div>
//         </header>

//         {/* QUOTATION FORM: HIDDEN WHEN SHOW IS CLICKED */}
//         {showForm && (
//           <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
//               <h2 className="text-xl font-bold text-slate-900">
//                 {editingId !== null ? "Edit Quotation" : "Quotation Form"}
//               </h2>

//               <p className="mt-1 text-sm text-slate-500">
//                 Enter customer details and quotation items.
//               </p>
//             </div>

//             <div className="space-y-8 p-5 sm:p-8">
//               {/* CUSTOMER DETAILS */}
//               <div>
//                 <h3 className="mb-4 text-base font-bold text-slate-800">
//                   Customer Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
//                   <div>
//                     <label className={labelClass}>Quote No *</label>
//                     <input
//                       type="number"
//                       min="1"
//                       step="1"
//                       value={quoteNo}
//                       onChange={(e) => setQuoteNo(e.target.value)}
//                       placeholder="Enter quote number"
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Date *</label>
//                     <input
//                       type="date"
//                       value={date}
//                       onChange={(e) => setDate(e.target.value)}
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Name *</label>
//                     <input
//                       type="text"
//                       placeholder="Enter Name"
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Mobile Number *</label>
//                     <input
//                       type="tel"
//                       placeholder="Enter Mobile Number"
//                       value={mobile}
//                       onChange={(e) => setMobile(e.target.value)}
//                       maxLength={10}
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Location</label>
//                     <textarea
//                       placeholder="Enter Location"
//                       value={location}
//                       onChange={(e) => setLocation(e.target.value)}
//                       rows={3}
//                       className={`${inputClass} resize-none`}
//                     />
//                   </div>

//                   {/* GST DROPDOWN */}
//                   <div>
//                     <label className={labelClass}>GST Type *</label>

//                     <select
//                       value={gstType}
//                       onChange={(e) => setGstType(e.target.value)}
//                       className={inputClass}
//                     >
//                       <option value="">Select GST Type</option>
//                       <option value="with-gst">With GST</option>
//                       <option value="without-gst">Without GST</option>
//                     </select>

//                     <p className="mt-2 text-xs leading-5 text-slate-500">
//                       {gstType === "with-gst"
//                         ? "GST 18% applies: CGST 9% and SGST 9%."
//                         : gstType === "without-gst"
//                           ? "No GST will be added to item prices."
//                           : "Select a GST type to display the item table."}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* ITEMS TABLE: DISPLAY AFTER GST SELECTION */}
//               {gstType && (
//                 <div>
//                   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//                     <div>
//                       <h3 className="text-base font-bold text-slate-800">
//                         Quotation Items
//                       </h3>
//                       <p className="mt-1 text-sm text-slate-500">
//                         Add products or services to this quotation.
//                       </p>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={handleAddRow}
//                       className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
//                     >
//                       + Add Item
//                     </button>
//                   </div>

//                   <div className="overflow-x-auto rounded-xl border border-slate-200">
//                     <table className="w-full min-w-[850px] border-collapse text-sm">
//                       <thead className="bg-slate-50">
//                         <tr>
//                           <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                             Item
//                           </th>

//                           <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                             QTY
//                           </th>

//                           <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                             Price (₹)
//                           </th>

//                           {gstType === "with-gst" && (
//                             <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                               GST 18% (₹)
//                             </th>
//                           )}

//                           <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                             Amount (₹)
//                           </th>

//                           <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                             Action
//                           </th>
//                         </tr>
//                       </thead>

//                       <tbody>
//                         {items.map((row) => {
//                           const rowSubtotal = row.qty * row.price;

//                           const rowGst =
//                             gstType === "with-gst"
//                               ? Number((rowSubtotal * 0.18).toFixed(2))
//                               : 0;

//                           const rowAmount = rowSubtotal + rowGst;

//                           return (
//                             <tr
//                               key={row.id}
//                               className="transition hover:bg-slate-50"
//                             >
//                               <td className="border-b border-slate-100 p-3">
//                                 <input
//                                   type="text"
//                                   placeholder="Enter Item"
//                                   value={row.item}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       row.id,
//                                       "item",
//                                       e.target.value
//                                     )
//                                   }
//                                   className="w-full min-w-44 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                                 />
//                               </td>

//                               <td className="border-b border-slate-100 p-3">
//                                 <input
//                                   type="number"
//                                   min="1"
//                                   value={row.qty}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       row.id,
//                                       "qty",
//                                       e.target.value
//                                     )
//                                   }
//                                   className="w-20 rounded-lg border border-slate-300 px-2 py-2.5 text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                                 />
//                               </td>

//                               <td className="border-b border-slate-100 p-3">
//                                 <input
//                                   type="number"
//                                   min="0"
//                                   step="0.01"
//                                   value={row.price}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       row.id,
//                                       "price",
//                                       e.target.value
//                                     )
//                                   }
//                                   className="w-28 rounded-lg border border-slate-300 px-2 py-2.5 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                                 />
//                               </td>

//                               {gstType === "with-gst" && (
//                                 <td className="border-b border-slate-100 px-4 py-3 text-right">
//                                   ₹{money(rowGst)}
//                                 </td>
//                               )}

//                               <td className="border-b border-slate-100 px-4 py-3 text-right font-semibold">
//                                 ₹{money(rowAmount)}
//                               </td>

//                               <td className="border-b border-slate-100 p-3 text-center">
//                                 <button
//                                   type="button"
//                                   onClick={() => handleDeleteRow(row.id)}
//                                   className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
//                                 >
//                                   Delete
//                                 </button>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* TOTALS */}
//                   <div className="mt-6 flex justify-end">
//                     <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:max-w-md sm:p-6">
//                       <h3 className="mb-4 text-base font-bold text-slate-800">
//                         Quotation Summary
//                       </h3>

//                       <div className="space-y-3 text-sm">
//                         <div className="flex justify-between gap-4">
//                           <span className="text-slate-500">Subtotal</span>
//                           <span className="font-semibold">
//                             ₹{money(subtotal)}
//                           </span>
//                         </div>

//                         {gstType === "with-gst" && (
//                           <>
//                             <div className="flex justify-between gap-4">
//                               <span className="text-slate-500">CGST 9%</span>
//                               <span>₹{money(cgst)}</span>
//                             </div>

//                             <div className="flex justify-between gap-4">
//                               <span className="text-slate-500">SGST 9%</span>
//                               <span>₹{money(sgst)}</span>
//                             </div>

//                             <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
//                               <span className="text-slate-600">GST Total</span>
//                               <span className="font-semibold">
//                                 ₹{money(gstTotal)}
//                               </span>
//                             </div>
//                           </>
//                         )}

//                         <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
//                           <span className="text-base font-bold text-slate-900">
//                             Grand Total
//                           </span>
//                           <span className="text-xl font-bold text-blue-700">
//                             ₹{money(totalAmount)}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* FORM ACTIONS */}
//               <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
//                 {editingId !== null && (
//                   <button
//                     type="button"
//                     onClick={handleNew}
//                     disabled={saving}
//                     className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
//                   >
//                     Cancel Edit
//                   </button>
//                 )}

//                 <button
//                   type="button"
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {saving
//                     ? "Saving..."
//                     : editingId !== null
//                       ? "Update Quotation"
//                       : "Save Quotation"}
//                 </button>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* TABLE: ONLY VISIBLE WHEN SHOW IS CLICKED */}
//         {showTable && (
//           <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-8">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900">
//                   All Quotations
//                 </h2>

//                 <p className="mt-1 text-sm text-slate-500">
//                   View, edit and delete saved quotations.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleShow}
//                 disabled={loadingList}
//                 className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
//               >
//                 {loadingList ? "Refreshing..." : "Refresh"}
//               </button>
//             </div>

//             <div className="p-5 sm:p-8">
//               {loadingList ? (
//                 <p className="py-10 text-center text-slate-500">
//                   Loading quotations...
//                 </p>
//               ) : (
//                 <div className="overflow-x-auto rounded-xl border border-slate-200">
//                   <table className="w-full min-w-[850px] border-collapse text-sm">
//                     <thead className="bg-slate-50">
//                       <tr>
//                         <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                           S.No
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Quote No
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Date
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Name
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Mobile Number
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                           Action
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {quotations.length === 0 ? (
//                         <tr>
//                           <td
//                             colSpan={6}
//                             className="px-4 py-10 text-center text-slate-500"
//                           >
//                             No quotations found.
//                           </td>
//                         </tr>
//                       ) : (
//                         quotations.map((quotation, index) => (
//                           <tr
//                             key={quotation.id ?? index}
//                             className="transition hover:bg-blue-50/40"
//                           >
//                             {/* Serial number */}
//                             <td className="border-b border-slate-100 px-4 py-4 text-center text-slate-500">
//                               {index + 1}
//                             </td>

//                             {/* Quote number */}
//                             <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-800">
//                               {getQuoteNo(quotation) || "-"}
//                             </td>

//                             {/* Quote date */}
//                             <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
//                               {formatDate(getQuoteDate(quotation))}
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
//                               {quotation.name || "-"}
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
//                               {quotation.mobile ??
//                                 quotation.mobile_number ??
//                                 quotation.mobileNumber ??
//                                 "-"}
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-4">
//                               <div className="flex justify-center gap-2">
//                                 <button
//                                   type="button"
//                                   disabled={printing}
//                                   onClick={() => handlePrint(quotation)}
//                                   className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
//                                 >
//                                   {printing ? "Loading..." : "Print"}
//                                 </button>
//                                 <button
//                                   type="button"
//                                   onClick={() => handleEdit(quotation)}
//                                   className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
//                                 >
//                                   Edit
//                                 </button>

//                                 <button
//                                   type="button"
//                                   disabled={
//                                     deletingId === Number(quotation.id) ||
//                                     quotation.id == null
//                                   }
//                                   onClick={() =>
//                                     handleDelete(Number(quotation.id))
//                                   }
//                                   className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
//                                 >
//                                   {deletingId === Number(quotation.id)
//                                     ? "Deleting..."
//                                     : "Delete"}
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         ))
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}
//       </div>

//       {/* PRINT-ONLY QUOTATION DOCUMENT */}
//       {printQuotation && (
//         <div id="quotation-print" className="print-document">
//           <style jsx global>{`
//             .print-document { display: none; }
//             @media print {
//               @page { size: A4; margin: 12mm; }
//               body * { visibility: hidden !important; }
//               #quotation-print, #quotation-print * { visibility: visible !important; }
//               #quotation-print {
//                 display: block !important;
//                 position: absolute;
//                 left: 0;
//                 top: 0;
//                 width: 100%;
//                 color: #111;
//                 background: #fff;
//                 font-family: Arial, Helvetica, sans-serif;
//                 font-size: 10pt;
//               }
//               .print-page { page-break-after: always; min-height: 270mm; position: relative; }
//               .print-page:last-child { page-break-after: auto; }
//               .print-table { width: 100%; border-collapse: collapse; margin-top: 18px; }
//               .print-table th, .print-table td { border: 1px solid #555; padding: 7px 6px; vertical-align: top; }
//               .print-table th { background: #f0f0f0 !important; }
//               .print-no-border td { border: none !important; }
//               .print-footer { position: absolute; bottom: 8mm; left: 0; right: 0; }
//               button { display: none !important; }
//             }
//           `}</style>

//           <section className="print-page">
//             <div style={{ display: "flex", alignItems: "center", gap: 18, borderBottom: "2px solid #159447", paddingBottom: 12 }}>
//               <img src="/arrow-computers-logo.jpeg" alt="Arrow Computers Logo" style={{ width: 150, height: 100, objectFit: "contain" }} />
//               <div style={{ flex: 1, textAlign: "center" }}>
//                 <h1 style={{ fontSize: 24, fontWeight: 800, color: "#078b42", margin: 0 }}>ARROW COMPUTERS</h1>
//                 <p style={{ margin: "5px 0" }}>No 402, Chennai Thiruvallur High Road, Opp to Max Showroom, Avadi - 600054</p>
//                 <p style={{ margin: "3px 0" }}>Phone: 8610901240 | Email: arrowcomputersavadi@gamil.com</p>
//                 <p style={{ margin: "3px 0" }}>GST: 33PIPPS0073B1Z2 | PAN: 33PIPPS0073B</p>
//                 <p style={{ margin: "3px 0", fontWeight: 700 }}>www.arrowcomputerz.com</p>
//               </div>
//             </div>

//             <h2 style={{ textAlign: "center", fontSize: 18, margin: "18px 0", textDecoration: "underline", letterSpacing: 2 }}>QUOTATION</h2>

//             <table className="print-table">
//               <tbody>
//                 <tr>
//                   <td style={{ width: "58%" }}>
//                     <strong>Quotation To</strong><br />
//                     <strong>Name:</strong> {printQuotation.name || "-"}<br />
//                     <strong>Location:</strong> {printQuotation.location || "-"}<br />
//                     <strong>Mobile:</strong> {printQuotation.mobile ?? printQuotation.mobile_number ?? printQuotation.mobileNumber ?? "-"}
//                   </td>
//                   <td>
//                     <strong>Quote No:</strong> AC - {getQuoteNo(printQuotation) || "-"}<br />
//                     <strong>Date:</strong> {formatDate(getQuoteDate(printQuotation))}<br />
//                     <strong>GST:</strong> {printHasGst ? "With GST (18%)" : "Without GST"}
//                   </td>
//                 </tr>
//               </tbody>
//             </table>

//             <table className="print-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: "7%" }}>S.No</th>
//                   <th>Item / Description</th>
//                   <th style={{ width: "10%" }}>Qty</th>
//                   <th style={{ width: "16%" }}>Price (₹)</th>
//                   {printHasGst && <th style={{ width: "16%" }}>GST 18% (₹)</th>}
//                   <th style={{ width: "18%" }}>Amount (₹)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {printItems.map((item, index) => {
//                   const qty = Number(item.qty ?? item.quantity ?? 0);
//                   const price = Number(item.price ?? 0);
//                   const base = qty * price;
//                   const gst = printHasGst ? Number((base * 0.18).toFixed(2)) : 0;
//                   return (
//                     <tr key={item.id ?? index}>
//                       <td style={{ textAlign: "center" }}>{index + 1}</td>
//                       <td style={{ whiteSpace: "pre-wrap" }}>{item.item || "-"}</td>
//                       <td style={{ textAlign: "center" }}>{qty}</td>
//                       <td style={{ textAlign: "right" }}>{money(price)}</td>
//                       {printHasGst && <td style={{ textAlign: "right" }}>{money(gst)}</td>}
//                       <td style={{ textAlign: "right" }}>{money(base + gst)}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>

//             <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 22 }}>
//               <div style={{ width: "48%" }}>
//                 <strong>BANK DETAILS</strong>
//                 <p style={{ margin: "8px 0 3px" }}>Name: Arrow Computers</p>
//                 <p style={{ margin: "3px 0" }}>IFSC Code: HDFC0006718</p>
//                 <p style={{ margin: "3px 0" }}>Account No: 50200097119884</p>
//                 <p style={{ margin: "3px 0" }}>Bank: HDFC Bank, TNHB Avadi</p>
//               </div>
//               <div style={{ width: "45%" }}>
//                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                   <tbody>
//                     <tr><td style={{ padding: 6 }}>Subtotal</td><td style={{ padding: 6, textAlign: "right" }}>₹{money(printSubtotal)}</td></tr>
//                     {printHasGst && <>
//                       <tr><td style={{ padding: 6 }}>CGST 9%</td><td style={{ padding: 6, textAlign: "right" }}>₹{money(printCgst)}</td></tr>
//                       <tr><td style={{ padding: 6 }}>SGST 9%</td><td style={{ padding: 6, textAlign: "right" }}>₹{money(printSgst)}</td></tr>
//                     </>}
//                     <tr style={{ borderTop: "2px solid #222", fontWeight: 800, fontSize: 12 }}>
//                       <td style={{ padding: 8 }}>GRAND TOTAL</td><td style={{ padding: 8, textAlign: "right" }}>₹{money(printGrandTotal)}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div style={{ marginTop: 18 }}>
//               <strong>Note:</strong>
//               <p style={{ margin: "5px 0" }}>This quotation is valid for 2 days from the date of issue. Prices may change after the validity period. Delivery will be made within the committed time. Any delay due to stock or logistics issues will be informed.</p>
//             </div>

//             <div className="print-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
//               <span>www.arrowcomputerz.com</span>
//               <div style={{ textAlign: "center", minWidth: 180 }}>
//                 <div style={{ height: 45 }}></div>
//                 <strong>Authorized Signatory</strong><br />
//                 <strong>ARROW COMPUTERS</strong>
//               </div>
//             </div>
//           </section>

//           <section className="print-page">
//             <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: "10px 0 28px" }}>TERMS & CONDITIONS</h2>
//             <p>This quotation is valid for 2 Days from the date of issue. Prices may change after validity period. Delivery will be made within the committed time. Any delay due to stock or logistics issues will be informed.</p>
//             <ol style={{ paddingLeft: 22, lineHeight: 1.8 }}>
//               <li>Refurbished Products covers Under 1 year service warranty & 1 Month parts replacement warranty.</li>
//               <li>Assembled Full set PC covers 1 year warranty.</li>
//               <li>Liability: ARROW COMPUTERS is not responsible for any data loss. Customers are advised to take backup.</li>
//               <li>Service warranty covers OS & Software issues only. Hardware not included.</li>
//               <li>For Brand New products as per Manufacturer warranty.</li>
//               <li>Physical & liquid damages warranty cannot be claimed.</li>
//             </ol>
//             <div className="print-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
//               <span>www.arrowcomputerz.com</span>
//               <div style={{ textAlign: "center", minWidth: 180 }}>
//                 <div style={{ height: 45 }}></div>
//                 <strong>Authorized Signatory</strong><br />
//                 <strong>ARROW COMPUTERS</strong>
//               </div>
//             </div>
//           </section>
//         </div>
//       )}
//     </main>
//   );
// }

// "use client";

// import { useState } from "react";
// import { apiRequest } from "@/lib/api";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// type QuotationItem = {
//   id?: number;
//   item?: string;
//   qty?: number | string;
//   quantity?: number | string;
//   price?: number | string;
//   gst18?: number | string | null;
//   amount?: number | string;
// };

// type QuotationRecord = {
//   id: number | string;
//   quote_no?: number | string;
//   quoteNo?: number | string;
//   quotation_no?: number | string;
//   quotationNo?: number | string;
//   quote_number?: number | string;
//   quote_date?: string;
//   quoteDate?: string;
//   quotation_date?: string;
//   quotationDate?: string;
//   date?: string;
//   name?: string;
//   location?: string | null;
//   mobile?: string;
//   mobile_number?: string;
//   mobileNumber?: string;
//   gst_type?: string;
//   gstType?: string;
//   items?: QuotationItem[];
//   quotation_items?: QuotationItem[];
//   quotationItems?: QuotationItem[];
//   quotation?: any;
//   [key: string]: any;
// };

// const getCurrentDate = () => {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, "0");
//   const day = String(now.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const createItem = (): ItemRow => ({
//   id: Date.now() + Math.random(),
//   item: "",
//   qty: 1,
//   price: 0,
// });

// // Unwrap common NestJS response formats.
// const unwrapResponse = (response: any): any => {
//   let result = response;

//   for (let i = 0; i < 5; i++) {
//     if (
//       result &&
//       !Array.isArray(result) &&
//       typeof result === "object" &&
//       "data" in result
//     ) {
//       result = result.data;
//     } else {
//       break;
//     }
//   }

//   return result;
// };

// const getQuoteNo = (record: QuotationRecord): string => {
//   const value =
//     record.quote_no ??
//     record.quoteNo ??
//     record.quotation_no ??
//     record.quotationNo ??
//     record.quote_number ??
//     record.quotation?.quote_no ??
//     record.quotation?.quoteNo;

//   return value == null ? "" : String(value);
// };

// const getQuoteDate = (record: QuotationRecord): string => {
//   const value =
//     record.quote_date ??
//     record.quoteDate ??
//     record.quotation_date ??
//     record.quotationDate ??
//     record.date ??
//     record.quotation?.quote_date ??
//     record.quotation?.quoteDate;

//   return value == null ? "" : String(value);
// };

// const getQuotationItems = (
//   record: QuotationRecord
// ): QuotationItem[] => {
//   const value =
//     record.items ??
//     record.quotation_items ??
//     record.quotationItems ??
//     record.quotation?.items;

//   return Array.isArray(value) ? value : [];
// };

// const formatDate = (value: unknown): string => {
//   if (value == null || value === "") return "-";

//   const raw = String(value);
//   const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

//   // Prevent date-only values from changing because of timezone conversion.
//   if (match) {
//     return `${match[3]}/${match[2]}/${match[1]}`;
//   }

//   const parsed = new Date(raw);

//   if (Number.isNaN(parsed.getTime())) {
//     return raw;
//   }

//   return parsed.toLocaleDateString("en-IN");
// };

// const getErrorMessage = (error: unknown): string =>
//   error instanceof Error ? error.message : "An unexpected error occurred.";

// export default function Home() {
//   // FORM / TABLE VISIBILITY
//   const [showForm, setShowForm] = useState(true);
//   const [showTable, setShowTable] = useState(false);

//   // CUSTOMER DETAILS
//   const [quoteNo, setQuoteNo] = useState("1001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // GST TYPE
//   const [gstType, setGstType] = useState("");

//   // API STATES
//   const [saving, setSaving] = useState(false);
//   const [loadingList, setLoadingList] = useState(false);
//   const [deletingId, setDeletingId] = useState<number | null>(null);
//   const [editingId, setEditingId] = useState<number | null>(null);

//   // QUOTATION LIST
//   const [quotations, setQuotations] = useState<QuotationRecord[]>([]);

//   // ITEMS
//   const [items, setItems] = useState<ItemRow[]>([createItem()]);

//   // RESET FORM
//   const resetForm = () => {
//     setEditingId(null);
//     setQuoteNo("");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");
//     setItems([createItem()]);
//   };

//   // NEW BUTTON: open form and hide table.
//   const handleNew = () => {
//     resetForm();
//     setShowForm(true);
//     setShowTable(false);
//   };

//   // SHOW BUTTON: hide form and display only the table.
//   const handleShow = async () => {
//     setShowForm(false);
//     setShowTable(true);
//     setLoadingList(true);

//     try {
//       const response = await apiRequest("/quotations", {
//         method: "GET",
//       });

//       const result = unwrapResponse(response);

//       // Support arrays and common response wrappers.
//       const records: QuotationRecord[] = Array.isArray(result)
//         ? result
//         : Array.isArray(result?.quotations)
//           ? result.quotations
//           : Array.isArray(result?.records)
//             ? result.records
//             : Array.isArray(result?.results)
//               ? result.results
//               : Array.isArray(result?.items)
//                 ? result.items
//                 : [];

//       setQuotations(records);
//     } catch (error) {
//       console.error("Get quotations error:", error);
//       alert("Unable to load quotations: " + getErrorMessage(error));
//       setQuotations([]);
//     } finally {
//       setLoadingList(false);
//     }
//   };

//   // ADD ITEM ROW
//   const handleAddRow = () => {
//     setItems((previous) => [...previous, createItem()]);
//   };

//   // DELETE ITEM ROW
//   const handleDeleteRow = (id: number) => {
//     setItems((previous) => previous.filter((row) => row.id !== id));
//   };

//   // UPDATE ITEM ROW
//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string
//   ) => {
//     setItems((previous) =>
//       previous.map((row) => {
//         if (row.id !== id) return row;

//         if (field === "item") {
//           return { ...row, item: value };
//         }

//         return {
//           ...row,
//           [field]: value === "" ? 0 : Number(value),
//         };
//       })
//     );
//   };

//   // CALCULATIONS
//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );

//   const cgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const sgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const gstTotal = cgst + sgst;
//   const totalAmount = subtotal + gstTotal;

//   const money = (amount: number) =>
//     amount.toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   // SAVE OR UPDATE
//   const handleSave = async () => {
//     if (saving) return;

//     const numericQuoteNo = Number(quoteNo);

//     if (
//       !quoteNo.trim() ||
//       !Number.isSafeInteger(numericQuoteNo) ||
//       numericQuoteNo <= 0
//     ) {
//       alert("Please enter a valid numeric Quote No, e.g. 1001.");
//       return;
//     }

//     if (!date) {
//       alert("Please select Date.");
//       return;
//     }

//     if (!name.trim()) {
//       alert("Please enter Name.");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number.");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type.");
//       return;
//     }

//     if (items.length === 0) {
//       alert("Please add at least one item.");
//       return;
//     }

//     for (const row of items) {
//       if (!row.item.trim()) {
//         alert("Please enter an item name for every row.");
//         return;
//       }

//       if (!Number.isFinite(row.qty) || row.qty <= 0) {
//         alert("Quantity must be greater than zero.");
//         return;
//       }

//       if (!Number.isFinite(row.price) || row.price < 0) {
//         alert("Price cannot be negative.");
//         return;
//       }
//     }

//     const payload = {
//       quote_no: numericQuoteNo,
//       quote_date: date,
//       name: name.trim(),
//       location: location.trim(),
//       mobile: mobile.trim(),

//       // Keep this property if your backend supports saving GST type.
//       gst_type: gstType,

//       items: items.map((row) => {
//         const qty = Number(row.qty);
//         const price = Number(row.price);
//         const baseAmount = qty * price;

//         const gst18 =
//           gstType === "with-gst"
//             ? Number((baseAmount * 0.18).toFixed(2))
//             : null;

//         const amount =
//           gstType === "with-gst"
//             ? Number((baseAmount + (gst18 ?? 0)).toFixed(2))
//             : Number(baseAmount.toFixed(2));

//         return {
//           item: row.item.trim(),
//           qty,
//           price,
//           gst18,
//           amount,
//         };
//       }),
//     };

//     try {
//       setSaving(true);

//       const isEditing = editingId !== null;

//       const response = isEditing
//         ? await apiRequest(`/quotations/${editingId}`, {
//             method: "PUT",
//             body: JSON.stringify(payload),
//           })
//         : await apiRequest("/quotations", {
//             method: "POST",
//             body: JSON.stringify(payload),
//           });

//       console.log("Quotation API response:", response);

//       alert(
//         isEditing
//           ? "Quotation updated successfully!"
//           : "Quotation saved successfully!"
//       );

//       resetForm();

//       // After save, show the refreshed table.
//       await handleShow();
//     } catch (error) {
//       console.error("Save/update error:", error);
//       alert("Unable to save quotation: " + getErrorMessage(error));
//     } finally {
//       setSaving(false);
//     }
//   };

//   // EDIT QUOTATION
//   const handleEdit = async (record: QuotationRecord) => {
//     try {
//       let quotation = record;

//       // Fetch full details if the list response doesn't contain items.
//       if (!Array.isArray(getQuotationItems(quotation))) {
//         const response = await apiRequest(`/quotations/${record.id}`, {
//           method: "GET",
//         });

//         const result = unwrapResponse(response);
//         quotation = result?.quotation ?? result;
//       }

//       let quotationItems = getQuotationItems(quotation);

//       // Some list endpoints don't return item details.
//       if (quotationItems.length === 0) {
//         const response = await apiRequest(`/quotations/${record.id}`, {
//           method: "GET",
//         });

//         const result = unwrapResponse(response);
//         const detail = result?.quotation ?? result;

//         if (detail && typeof detail === "object") {
//           quotation = detail;
//           quotationItems = getQuotationItems(quotation);
//         }
//       }

//       const savedQuoteNo = getQuoteNo(quotation);
//       const savedDate = getQuoteDate(quotation);

//       setEditingId(Number(quotation.id));
//       setQuoteNo(savedQuoteNo);
//       setDate(savedDate ? savedDate.slice(0, 10) : getCurrentDate());
//       setName(quotation.name ?? "");
//       setLocation(quotation.location ?? "");
//       setMobile(
//         quotation.mobile ??
//           quotation.mobile_number ??
//           quotation.mobileNumber ??
//           ""
//       );

//       const savedGstType = String(
//         quotation.gst_type ?? quotation.gstType ?? ""
//       ).toLowerCase();

//       const hasGst = savedGstType
//         ? savedGstType === "with-gst" || savedGstType === "with_gst"
//         : quotationItems.some(
//             (item) => item.gst18 !== null && item.gst18 !== undefined
//           );

//       setGstType(hasGst ? "with-gst" : "without-gst");

//       setItems(
//         quotationItems.length > 0
//           ? quotationItems.map((item, index) => ({
//               id: Number(item.id ?? Date.now() + index),
//               item: item.item ?? "",
//               qty: Number(item.qty ?? item.quantity ?? 1),
//               price: Number(item.price ?? 0),
//             }))
//           : [createItem()]
//       );

//       setShowForm(true);
//       setShowTable(false);

//       window.scrollTo({ top: 0, behavior: "smooth" });
//     } catch (error) {
//       console.error("Edit quotation error:", error);
//       alert("Unable to load quotation: " + getErrorMessage(error));
//     }
//   };

//   // DELETE QUOTATION
//   const handleDelete = async (id: number) => {
//     if (
//       !window.confirm("Are you sure you want to delete this quotation?")
//     ) {
//       return;
//     }

//     try {
//       setDeletingId(id);

//       await apiRequest(`/quotations/${id}`, {
//         method: "DELETE",
//       });

//       setQuotations((previous) =>
//         previous.filter((quotation) => Number(quotation.id) !== id)
//       );

//       alert("Quotation deleted successfully!");
//     } catch (error) {
//       console.error("Delete quotation error:", error);
//       alert("Unable to delete quotation: " + getErrorMessage(error));
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const inputClass =
//     "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

//   const labelClass =
//     "mb-2 block text-sm font-semibold text-slate-700";

//   return (
//     <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-800 sm:px-8 sm:py-10">
//       <div className="mx-auto max-w-7xl">
//         {/* HEADER AND BUTTONS */}
//         <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-blue-600">
//               Sales Management
//             </p>

//             <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
//               Quotation Management
//             </h1>

//             <p className="mt-2 text-sm text-slate-500">
//               Create, manage and track customer quotations.
//             </p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               type="button"
//               onClick={handleNew}
//               disabled={saving}
//               className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50"
//             >
//               + New
//             </button>

//             <button
//               type="button"
//               onClick={handleShow}
//               disabled={loadingList}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-50"
//             >
//               {loadingList ? "Loading..." : "Show"}
//             </button>
//           </div>
//         </header>

//         {/* QUOTATION FORM: HIDDEN WHEN SHOW IS CLICKED */}
//         {showForm && (
//           <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
//               <h2 className="text-xl font-bold text-slate-900">
//                 {editingId !== null ? "Edit Quotation" : "Quotation Form"}
//               </h2>

//               <p className="mt-1 text-sm text-slate-500">
//                 Enter customer details and quotation items.
//               </p>
//             </div>

//             <div className="space-y-8 p-5 sm:p-8">
//               {/* CUSTOMER DETAILS */}
//               <div>
//                 <h3 className="mb-4 text-base font-bold text-slate-800">
//                   Customer Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
//                   <div>
//                     <label className={labelClass}>Quote No *</label>
//                     <input
//                       type="number"
//                       min="1"
//                       step="1"
//                       value={quoteNo}
//                       onChange={(e) => setQuoteNo(e.target.value)}
//                       placeholder="Enter quote number"
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Date *</label>
//                     <input
//                       type="date"
//                       value={date}
//                       onChange={(e) => setDate(e.target.value)}
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Name *</label>
//                     <input
//                       type="text"
//                       placeholder="Enter Name"
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Mobile Number *</label>
//                     <input
//                       type="tel"
//                       placeholder="Enter Mobile Number"
//                       value={mobile}
//                       onChange={(e) => setMobile(e.target.value)}
//                       maxLength={10}
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Location</label>
//                     <textarea
//                       placeholder="Enter Location"
//                       value={location}
//                       onChange={(e) => setLocation(e.target.value)}
//                       rows={3}
//                       className={`${inputClass} resize-none`}
//                     />
//                   </div>

//                   {/* GST DROPDOWN */}
//                   <div>
//                     <label className={labelClass}>GST Type *</label>

//                     <select
//                       value={gstType}
//                       onChange={(e) => setGstType(e.target.value)}
//                       className={inputClass}
//                     >
//                       <option value="">Select GST Type</option>
//                       <option value="with-gst">With GST</option>
//                       <option value="without-gst">Without GST</option>
//                     </select>

//                     <p className="mt-2 text-xs leading-5 text-slate-500">
//                       {gstType === "with-gst"
//                         ? "GST 18% applies: CGST 9% and SGST 9%."
//                         : gstType === "without-gst"
//                           ? "No GST will be added to item prices."
//                           : "Select a GST type to display the item table."}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* ITEMS TABLE: DISPLAY AFTER GST SELECTION */}
//               {gstType && (
//                 <div>
//                   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//                     <div>
//                       <h3 className="text-base font-bold text-slate-800">
//                         Quotation Items
//                       </h3>
//                       <p className="mt-1 text-sm text-slate-500">
//                         Add products or services to this quotation.
//                       </p>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={handleAddRow}
//                       className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
//                     >
//                       + Add Item
//                     </button>
//                   </div>

//                   <div className="overflow-x-auto rounded-xl border border-slate-200">
//                     <table className="w-full min-w-[850px] border-collapse text-sm">
//                       <thead className="bg-slate-50">
//                         <tr>
//                           <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                             Item
//                           </th>

//                           <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                             QTY
//                           </th>

//                           <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                             Price (₹)
//                           </th>

//                           {gstType === "with-gst" && (
//                             <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                               GST 18% (₹)
//                             </th>
//                           )}

//                           <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                             Amount (₹)
//                           </th>

//                           <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                             Action
//                           </th>
//                         </tr>
//                       </thead>

//                       <tbody>
//                         {items.map((row) => {
//                           const rowSubtotal = row.qty * row.price;

//                           const rowGst =
//                             gstType === "with-gst"
//                               ? Number((rowSubtotal * 0.18).toFixed(2))
//                               : 0;

//                           const rowAmount = rowSubtotal + rowGst;

//                           return (
//                             <tr
//                               key={row.id}
//                               className="transition hover:bg-slate-50"
//                             >
//                               <td className="border-b border-slate-100 p-3">
//                                 <input
//                                   type="text"
//                                   placeholder="Enter Item"
//                                   value={row.item}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       row.id,
//                                       "item",
//                                       e.target.value
//                                     )
//                                   }
//                                   className="w-full min-w-44 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                                 />
//                               </td>

//                               <td className="border-b border-slate-100 p-3">
//                                 <input
//                                   type="number"
//                                   min="1"
//                                   value={row.qty}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       row.id,
//                                       "qty",
//                                       e.target.value
//                                     )
//                                   }
//                                   className="w-20 rounded-lg border border-slate-300 px-2 py-2.5 text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                                 />
//                               </td>

//                               <td className="border-b border-slate-100 p-3">
//                                 <input
//                                   type="number"
//                                   min="0"
//                                   step="0.01"
//                                   value={row.price}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       row.id,
//                                       "price",
//                                       e.target.value
//                                     )
//                                   }
//                                   className="w-28 rounded-lg border border-slate-300 px-2 py-2.5 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                                 />
//                               </td>

//                               {gstType === "with-gst" && (
//                                 <td className="border-b border-slate-100 px-4 py-3 text-right">
//                                   ₹{money(rowGst)}
//                                 </td>
//                               )}

//                               <td className="border-b border-slate-100 px-4 py-3 text-right font-semibold">
//                                 ₹{money(rowAmount)}
//                               </td>

//                               <td className="border-b border-slate-100 p-3 text-center">
//                                 <button
//                                   type="button"
//                                   onClick={() => handleDeleteRow(row.id)}
//                                   className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
//                                 >
//                                   Delete
//                                 </button>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* TOTALS */}
//                   <div className="mt-6 flex justify-end">
//                     <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:max-w-md sm:p-6">
//                       <h3 className="mb-4 text-base font-bold text-slate-800">
//                         Quotation Summary
//                       </h3>

//                       <div className="space-y-3 text-sm">
//                         <div className="flex justify-between gap-4">
//                           <span className="text-slate-500">Subtotal</span>
//                           <span className="font-semibold">
//                             ₹{money(subtotal)}
//                           </span>
//                         </div>

//                         {gstType === "with-gst" && (
//                           <>
//                             <div className="flex justify-between gap-4">
//                               <span className="text-slate-500">CGST 9%</span>
//                               <span>₹{money(cgst)}</span>
//                             </div>

//                             <div className="flex justify-between gap-4">
//                               <span className="text-slate-500">SGST 9%</span>
//                               <span>₹{money(sgst)}</span>
//                             </div>

//                             <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
//                               <span className="text-slate-600">GST Total</span>
//                               <span className="font-semibold">
//                                 ₹{money(gstTotal)}
//                               </span>
//                             </div>
//                           </>
//                         )}

//                         <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
//                           <span className="text-base font-bold text-slate-900">
//                             Grand Total
//                           </span>
//                           <span className="text-xl font-bold text-blue-700">
//                             ₹{money(totalAmount)}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* FORM ACTIONS */}
//               <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
//                 {editingId !== null && (
//                   <button
//                     type="button"
//                     onClick={handleNew}
//                     disabled={saving}
//                     className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
//                   >
//                     Cancel Edit
//                   </button>
//                 )}

//                 <button
//                   type="button"
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {saving
//                     ? "Saving..."
//                     : editingId !== null
//                       ? "Update Quotation"
//                       : "Save Quotation"}
//                 </button>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* TABLE: ONLY VISIBLE WHEN SHOW IS CLICKED */}
//         {showTable && (
//           <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-8">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900">
//                   All Quotations
//                 </h2>

//                 <p className="mt-1 text-sm text-slate-500">
//                   View, edit and delete saved quotations.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleShow}
//                 disabled={loadingList}
//                 className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
//               >
//                 {loadingList ? "Refreshing..." : "Refresh"}
//               </button>
//             </div>

//             <div className="p-5 sm:p-8">
//               {loadingList ? (
//                 <p className="py-10 text-center text-slate-500">
//                   Loading quotations...
//                 </p>
//               ) : (
//                 <div className="overflow-x-auto rounded-xl border border-slate-200">
//                   <table className="w-full min-w-[850px] border-collapse text-sm">
//                     <thead className="bg-slate-50">
//                       <tr>
//                         <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                           S.No
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Quote No
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Date
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Name
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Mobile Number
//                         </th>

//                         <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                           Action
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {quotations.length === 0 ? (
//                         <tr>
//                           <td
//                             colSpan={6}
//                             className="px-4 py-10 text-center text-slate-500"
//                           >
//                             No quotations found.
//                           </td>
//                         </tr>
//                       ) : (
//                         quotations.map((quotation, index) => (
//                           <tr
//                             key={quotation.id ?? index}
//                             className="transition hover:bg-blue-50/40"
//                           >
//                             {/* Serial number */}
//                             <td className="border-b border-slate-100 px-4 py-4 text-center text-slate-500">
//                               {index + 1}
//                             </td>

//                             {/* Quote number */}
//                             <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-800">
//                               {getQuoteNo(quotation) || "-"}
//                             </td>

//                             {/* Quote date */}
//                             <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
//                               {formatDate(getQuoteDate(quotation))}
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
//                               {quotation.name || "-"}
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
//                               {quotation.mobile ??
//                                 quotation.mobile_number ??
//                                 quotation.mobileNumber ??
//                                 "-"}
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-4">
//                               <div className="flex justify-center gap-2">
//                                 <button
//                                   type="button"
//                                   onClick={() => handleEdit(quotation)}
//                                   className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
//                                 >
//                                   Edit
//                                 </button>

//                                 <button
//                                   type="button"
//                                   disabled={
//                                     deletingId === Number(quotation.id) ||
//                                     quotation.id == null
//                                   }
//                                   onClick={() =>
//                                     handleDelete(Number(quotation.id))
//                                   }
//                                   className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
//                                 >
//                                   {deletingId === Number(quotation.id)
//                                     ? "Deleting..."
//                                     : "Delete"}
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         ))
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}
//       </div>
//     </main>
//   );
// }



// "use client";

// import { useState } from "react";
// import { apiRequest } from "@/lib/api";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// type QuotationItem = {
//   id?: number;
//   item?: string;
//   qty?: number | string;
//   quantity?: number | string;
//   price?: number | string;
//   gst18?: number | string | null;
//   amount?: number | string;
// };

// type QuotationRecord = {
//   id: number;
//   quote_no?: number | string;
//   quoteNo?: number | string;
//   quotation_no?: number | string;
//   quotationNo?: number | string;
//   quote_date?: string;
//   quoteDate?: string;
//   quotation_date?: string;
//   quotationDate?: string;
//   date?: string;
//   name?: string;
//   location?: string;
//   mobile?: string;
//   mobile_number?: string;
//   mobileNumber?: string;
//   gst_type?: string;
//   gstType?: string;
//   items?: QuotationItem[];
//   quotation_items?: QuotationItem[];
//   quotationItems?: QuotationItem[];
//   quotation?: any;
//   [key: string]: any;
// };

// const today = () => {
//   const date = new Date();
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// };

// const createItem = (): ItemRow => ({
//   id: Date.now() + Math.random(),
//   item: "",
//   qty: 1,
//   price: 0,
// });

// const unwrapResponse = (response: any): any => {
//   let result = response;

//   for (let i = 0; i < 3; i++) {
//     if (
//       result &&
//       !Array.isArray(result) &&
//       typeof result === "object" &&
//       "data" in result
//     ) {
//       result = result.data;
//     } else {
//       break;
//     }
//   }

//   return result;
// };

// const getQuoteNumber = (record: QuotationRecord) =>
//   record.quote_no ??
//   record.quoteNo ??
//   record.quotation_no ??
//   record.quotationNo ??
//   record.quotation?.quote_no ??
//   record.quotation?.quoteNo ??
//   "";

// const getQuoteDate = (record: QuotationRecord) =>
//   record.quote_date ??
//   record.quoteDate ??
//   record.quotation_date ??
//   record.quotationDate ??
//   record.date ??
//   record.quotation?.quote_date ??
//   record.quotation?.quoteDate ??
//   "";

// const getItems = (record: QuotationRecord): QuotationItem[] => {
//   const result =
//     record.items ??
//     record.quotation_items ??
//     record.quotationItems ??
//     record.quotation?.items ??
//     [];

//   return Array.isArray(result) ? result : [];
// };

// const formatDate = (value: unknown) => {
//   if (!value) return "-";

//   const raw = String(value);
//   const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

//   if (match) {
//     return `${match[3]}/${match[2]}/${match[1]}`;
//   }

//   const date = new Date(raw);

//   return Number.isNaN(date.getTime())
//     ? raw
//     : date.toLocaleDateString("en-IN");
// };

// const getErrorMessage = (error: unknown) =>
//   error instanceof Error ? error.message : "An unexpected error occurred.";

// export default function Home() {
//   const [showForm, setShowForm] = useState(true);
//   const [showTable, setShowTable] = useState(false);

//   const [quoteNo, setQuoteNo] = useState("");
//   const [quoteDate, setQuoteDate] = useState(today());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // Exact dropdown options requested.
//   const [gstType, setGstType] = useState("");

//   const [items, setItems] = useState<ItemRow[]>([createItem()]);
//   const [quotations, setQuotations] = useState<QuotationRecord[]>([]);

//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [loadingList, setLoadingList] = useState(false);
//   const [deletingId, setDeletingId] = useState<number | null>(null);

//   const resetForm = () => {
//     setQuoteNo("");
//     setQuoteDate(today());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");
//     setItems([createItem()]);
//     setEditingId(null);
//   };

//   // NEW button: show the form and hide the table.
//   const handleNew = () => {
//     resetForm();
//     setShowForm(true);
//     setShowTable(false);
//   };

//   // SHOW button: hide the form and display the table.
//   const handleShow = async () => {
//     setShowForm(false);
//     setShowTable(true);
//     setLoadingList(true);

//     try {
//       const response = await apiRequest("/quotations");
//       const result = unwrapResponse(response);

//       const records: QuotationRecord[] = Array.isArray(result)
//         ? result
//         : Array.isArray(result?.quotations)
//           ? result.quotations
//           : Array.isArray(result?.items)
//             ? result.items
//             : [];

//       setQuotations(records);
//     } catch (error) {
//       alert("Unable to load quotations: " + getErrorMessage(error));
//       setQuotations([]);
//     } finally {
//       setLoadingList(false);
//     }
//   };

//   const handleAddItem = () => {
//     setItems((previous) => [...previous, createItem()]);
//   };

//   const handleDeleteItem = (id: number) => {
//     setItems((previous) => previous.filter((row) => row.id !== id));
//   };

//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string
//   ) => {
//     setItems((previous) =>
//       previous.map((row) => {
//         if (row.id !== id) return row;

//         if (field === "item") {
//           return { ...row, item: value };
//         }

//         return {
//           ...row,
//           [field]: value === "" ? 0 : Math.max(0, Number(value)),
//         };
//       })
//     );
//   };

//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );

//   const gstTotal = gstType === "with-gst" ? subtotal * 0.18 : 0;
//   const cgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const sgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const grandTotal = subtotal + gstTotal;

//   const money = (amount: number) =>
//     amount.toLocaleString("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   const handleSave = async () => {
//     if (!quoteNo.trim() || !Number.isFinite(Number(quoteNo)) || Number(quoteNo) <= 0) {
//       alert("Please enter a valid Quote No.");
//       return;
//     }

//     if (!quoteDate || !name.trim() || !mobile.trim()) {
//       alert("Please enter Quote Date, Name and Mobile Number.");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type.");
//       return;
//     }

//     if (
//       items.length === 0 ||
//       items.some(
//         (row) =>
//           !row.item.trim() ||
//           !Number.isFinite(row.qty) ||
//           row.qty <= 0 ||
//           !Number.isFinite(row.price) ||
//           row.price < 0
//       )
//     ) {
//       alert("Please enter valid item names, quantities and prices.");
//       return;
//     }

//     const payload = {
//       quote_no: Number(quoteNo),
//       quote_date: quoteDate,
//       name: name.trim(),
//       location: location.trim(),
//       mobile: mobile.trim(),
//       gst_type: gstType,
//       items: items.map((row) => {
//         const baseAmount = row.qty * row.price;
//         const itemGst =
//           gstType === "with-gst" ? baseAmount * 0.18 : null;

//         return {
//           item: row.item.trim(),
//           qty: row.qty,
//           price: row.price,
//           gst18: itemGst,
//           amount: baseAmount + (itemGst ?? 0),
//         };
//       }),
//     };

//     setSaving(true);

//     try {
//       if (editingId !== null) {
//         await apiRequest(`/quotations/${editingId}`, {
//           method: "PUT",
//           body: JSON.stringify(payload),
//         });

//         alert("Quotation updated successfully.");
//       } else {
//         await apiRequest("/quotations", {
//           method: "POST",
//           body: JSON.stringify(payload),
//         });

//         alert("Quotation saved successfully.");
//       }

//       resetForm();
//       setShowForm(false);
//       setShowTable(true);
//       await handleShow();
//     } catch (error) {
//       alert("Unable to save quotation: " + getErrorMessage(error));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleEdit = async (record: QuotationRecord) => {
//     try {
//       let quotation = record;

//       if (getItems(quotation).length === 0 && record.id != null) {
//         const response = await apiRequest(`/quotations/${record.id}`);
//         const result = unwrapResponse(response);
//         quotation = result?.quotation ?? result;
//       }

//       const recordItems = getItems(quotation);
//       const savedGstType = String(
//         quotation.gst_type ?? quotation.gstType ?? ""
//       ).toLowerCase();

//       const hasGst = savedGstType
//         ? savedGstType === "with-gst" || savedGstType === "with_gst"
//         : recordItems.some(
//             (item) => item.gst18 !== null && item.gst18 !== undefined
//           );

//       const savedDate = getQuoteDate(quotation);

//       setQuoteNo(String(getQuoteNumber(quotation)));
//       setQuoteDate(savedDate ? String(savedDate).slice(0, 10) : today());
//       setName(quotation.name ?? "");
//       setLocation(quotation.location ?? "");
//       setMobile(
//         quotation.mobile ??
//           quotation.mobile_number ??
//           quotation.mobileNumber ??
//           ""
//       );
//       setGstType(hasGst ? "with-gst" : "without-gst");

//       setItems(
//         recordItems.length
//           ? recordItems.map((item) => ({
//               id: item.id ?? Date.now() + Math.random(),
//               item: item.item ?? "",
//               qty: Number(item.qty ?? item.quantity ?? 1),
//               price: Number(item.price ?? 0),
//             }))
//           : [createItem()]
//       );

//       setEditingId(Number(quotation.id));
//       setShowForm(true);
//       setShowTable(false);
//     } catch (error) {
//       alert("Unable to load quotation: " + getErrorMessage(error));
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this quotation?")) {
//       return;
//     }

//     setDeletingId(id);

//     try {
//       await apiRequest(`/quotations/${id}`, {
//         method: "DELETE",
//       });

//       setQuotations((previous) =>
//         previous.filter((record) => Number(record.id) !== Number(id))
//       );

//       alert("Quotation deleted successfully.");
//     } catch (error) {
//       alert("Unable to delete quotation: " + getErrorMessage(error));
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const inputClass =
//     "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

//   const labelClass =
//     "mb-2 block text-sm font-semibold text-slate-700";

//   return (
//     <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-800 sm:px-8 sm:py-10">
//       <div className="mx-auto max-w-7xl">
//         {/* Header and navigation */}
//         <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-blue-600">
//               Sales Management
//             </p>
//             <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
//               Quotation Management
//             </h1>
//             <p className="mt-2 text-sm text-slate-500">
//               Create, manage and track customer quotations.
//             </p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               type="button"
//               onClick={handleNew}
//               className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
//             >
//               + New
//             </button>

//             <button
//               type="button"
//               onClick={handleShow}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
//             >
//               Show Quotations
//             </button>
//           </div>
//         </header>

//         {/* Quotation form */}
//         {showForm && (
//           <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
//               <h2 className="text-xl font-bold text-slate-900">
//                 {editingId !== null ? "Update Quotation" : "Quotation Form"}
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Enter customer details and quotation items below.
//               </p>
//             </div>

//             <div className="space-y-8 p-5 sm:p-8">
//               {/* Customer details */}
//               <div>
//                 <h3 className="mb-4 text-base font-bold text-slate-800">
//                   Customer Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
//                   <div>
//                     <label className={labelClass}>Quote No *</label>
//                     <input
//                       type="number"
//                       min="1"
//                       value={quoteNo}
//                       onChange={(e) => setQuoteNo(e.target.value)}
//                       placeholder="Enter quote number"
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Quote Date *</label>
//                     <input
//                       type="date"
//                       value={quoteDate}
//                       onChange={(e) => setQuoteDate(e.target.value)}
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Customer Name *</label>
//                     <input
//                       type="text"
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       placeholder="Enter customer name"
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Mobile Number *</label>
//                     <input
//                       type="tel"
//                       value={mobile}
//                       onChange={(e) => setMobile(e.target.value)}
//                       placeholder="Enter mobile number"
//                       className={inputClass}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Location</label>
//                     <textarea
//                       value={location}
//                       onChange={(e) => setLocation(e.target.value)}
//                       placeholder="Enter customer location"
//                       rows={3}
//                       className={inputClass}
//                     />
//                   </div>

//                   {/* GST Type dropdown with exact requested options */}
//                   <div>
//                     <label className={labelClass}>GST Type *</label>
//                     <select
//                       value={gstType}
//                       onChange={(e) => setGstType(e.target.value)}
//                       className={inputClass}
//                     >
//                       <option value="">Select GST Type</option>
//                       <option value="with-gst">With GST</option>
//                       <option value="without-gst">Without GST</option>
//                     </select>

//                     <p className="mt-2 text-xs leading-5 text-slate-500">
//                       {gstType === "with-gst"
//                         ? "GST 18% applies, split into CGST 9% and SGST 9%."
//                         : gstType === "without-gst"
//                           ? "No GST will be added to the item prices."
//                           : "Please select whether this quotation includes GST."}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Items */}
//               <div>
//                 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//                   <div>
//                     <h3 className="text-base font-bold text-slate-800">
//                       Quotation Items
//                     </h3>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Add products or services for this quotation.
//                     </p>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={handleAddItem}
//                     className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
//                   >
//                     + Add Item
//                   </button>
//                 </div>

//                 <div className="overflow-x-auto rounded-xl border border-slate-200">
//                   <table className="w-full min-w-[850px] border-collapse text-sm">
//                     <thead className="bg-slate-50">
//                       <tr>
//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Item
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                           QTY
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                           Price (₹)
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                           GST 18% (₹)
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-right font-semibold text-slate-600">
//                           Amount (₹)
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                           Action
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {items.map((row) => {
//                         const baseAmount = row.qty * row.price;
//                         const rowGst =
//                           gstType === "with-gst" ? baseAmount * 0.18 : 0;

//                         return (
//                           <tr key={row.id} className="transition hover:bg-slate-50">
//                             <td className="border-b border-slate-100 p-3">
//                               <input
//                                 type="text"
//                                 value={row.item}
//                                 onChange={(e) =>
//                                   handleItemChange(row.id, "item", e.target.value)
//                                 }
//                                 placeholder="Enter item name"
//                                 className="w-full min-w-44 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                               />
//                             </td>

//                             <td className="border-b border-slate-100 p-3">
//                               <input
//                                 type="number"
//                                 min="1"
//                                 value={row.qty}
//                                 onChange={(e) =>
//                                   handleItemChange(row.id, "qty", e.target.value)
//                                 }
//                                 className="w-20 rounded-lg border border-slate-300 px-2 py-2.5 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                               />
//                             </td>

//                             <td className="border-b border-slate-100 p-3">
//                               <input
//                                 type="number"
//                                 min="0"
//                                 step="0.01"
//                                 value={row.price}
//                                 onChange={(e) =>
//                                   handleItemChange(row.id, "price", e.target.value)
//                                 }
//                                 className="w-28 rounded-lg border border-slate-300 px-2 py-2.5 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                               />
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-600">
//                               {money(rowGst)}
//                             </td>

//                             <td className="border-b border-slate-100 px-4 py-3 text-right font-semibold text-slate-800">
//                               {money(baseAmount + rowGst)}
//                             </td>

//                             <td className="border-b border-slate-100 px-3 py-3 text-center">
//                               <button
//                                 type="button"
//                                 onClick={() => handleDeleteItem(row.id)}
//                                 className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
//                               >
//                                 Delete
//                               </button>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Totals */}
//               <div className="flex justify-end">
//                 <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:max-w-md sm:p-6">
//                   <h3 className="mb-4 text-base font-bold text-slate-800">
//                     Quotation Summary
//                   </h3>

//                   <div className="space-y-3 text-sm">
//                     <div className="flex justify-between gap-4">
//                       <span className="text-slate-500">Subtotal</span>
//                       <span className="font-semibold text-slate-800">
//                         {money(subtotal)}
//                       </span>
//                     </div>

//                     <div className="flex justify-between gap-4">
//                       <span className="text-slate-500">CGST 9%</span>
//                       <span className="text-slate-700">{money(cgst)}</span>
//                     </div>

//                     <div className="flex justify-between gap-4">
//                       <span className="text-slate-500">SGST 9%</span>
//                       <span className="text-slate-700">{money(sgst)}</span>
//                     </div>

//                     <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
//                       <span className="text-slate-600">GST Total</span>
//                       <span className="font-semibold text-slate-800">
//                         {money(gstTotal)}
//                       </span>
//                     </div>

//                     <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
//                       <span className="text-base font-bold text-slate-900">
//                         Grand Total
//                       </span>
//                       <span className="text-xl font-bold text-blue-700">
//                         {money(grandTotal)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Form actions */}
//               <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
//                 <button
//                   type="button"
//                   onClick={handleNew}
//                   className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//                 >
//                   Clear Form
//                 </button>

//                 <button
//                   type="button"
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {saving
//                     ? "Saving..."
//                     : editingId !== null
//                       ? "Update Quotation"
//                       : "Save Quotation"}
//                 </button>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Quotations table */}
//         {showTable && (
//           <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-8">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900">
//                   All Quotations
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   View and manage your saved quotations.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleNew}
//                 className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
//               >
//                 + New Quotation
//               </button>
//             </div>

//             <div className="p-5 sm:p-8">
//               {loadingList ? (
//                 <div className="py-12 text-center text-sm text-slate-500">
//                   Loading quotations...
//                 </div>
//               ) : quotations.length === 0 ? (
//                 <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
//                   <p className="font-semibold text-slate-700">
//                     No quotations found
//                   </p>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Create a new quotation to see it listed here.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto rounded-xl border border-slate-200">
//                   <table className="w-full min-w-[750px] border-collapse text-sm">
//                     <thead className="bg-slate-50">
//                       <tr>
//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Quote No
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Date
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Name
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-left font-semibold text-slate-600">
//                           Mobile Number
//                         </th>
//                         <th className="border-b border-slate-200 px-4 py-4 text-center font-semibold text-slate-600">
//                           Action
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {quotations.map((record, index) => (
//                         <tr
//                           key={record.id ?? index}
//                           className="transition hover:bg-blue-50/40"
//                         >
//                           <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-800">
//                             {getQuoteNumber(record) || "-"}
//                           </td>

//                           <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
//                             {formatDate(getQuoteDate(record))}
//                           </td>

//                           <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
//                             {record.name || "-"}
//                           </td>

//                           <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
//                             {record.mobile ??
//                               record.mobile_number ??
//                               record.mobileNumber ??
//                               "-"}
//                           </td>

//                           <td className="border-b border-slate-100 px-4 py-4">
//                             <div className="flex justify-center gap-2">
//                               <button
//                                 type="button"
//                                 onClick={() => handleEdit(record)}
//                                 className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
//                               >
//                                 Edit
//                               </button>

//                               <button
//                                 type="button"
//                                 onClick={() => handleDelete(Number(record.id))}
//                                 disabled={
//                                   deletingId === Number(record.id) ||
//                                   record.id == null
//                                 }
//                                 className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
//                               >
//                                 {deletingId === Number(record.id)
//                                   ? "Deleting..."
//                                   : "Delete"}
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}
//       </div>
//     </main>
//   );
// }


// "use client";

// import { useState } from "react";
// import { apiRequest } from "@/lib/api";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// type QuotationItem = {
//   id?: number;
//   item?: string;
//   qty?: number | string;
//   quantity?: number | string;
//   price?: number | string;
//   gst18?: number | string | null;
//   amount?: number | string;
// };

// type QuotationRecord = {
//   id: number;
//   quote_no?: number | string;
//   quoteNo?: number | string;
//   quotation_no?: number | string;
//   quotationNo?: number | string;
//   quote_date?: string;
//   quoteDate?: string;
//   quotation_date?: string;
//   quotationDate?: string;
//   date?: string;
//   name?: string;
//   location?: string;
//   mobile?: string;
//   mobile_number?: string;
//   mobileNumber?: string;
//   gstType?: string;
//   gst_type?: string;
//   items?: QuotationItem[];
//   quotation_items?: QuotationItem[];
//   quotationItems?: QuotationItem[];
//   [key: string]: any;
// };

// const emptyItem = (): ItemRow => ({
//   id: Date.now() + Math.random(),
//   item: "",
//   qty: 1,
//   price: 0,
// });

// const getErrorMessage = (error: unknown) =>
//   error instanceof Error ? error.message : "Something went wrong.";

// const unwrapResponse = (response: any): any => {
//   let result = response;

//   // Handle common API response wrappers.
//   for (let i = 0; i < 3; i++) {
//     if (
//       result &&
//       !Array.isArray(result) &&
//       typeof result === "object" &&
//       "data" in result
//     ) {
//       result = result.data;
//     } else {
//       break;
//     }
//   }

//   return result;
// };

// const getQuoteNumber = (record: QuotationRecord) =>
//   record.quote_no ??
//   record.quoteNo ??
//   record.quotation_no ??
//   record.quotationNo ??
//   record.quotation?.quote_no ??
//   record.quotation?.quoteNo ??
//   "";

// const getQuoteDate = (record: QuotationRecord) =>
//   record.quote_date ??
//   record.quoteDate ??
//   record.quotation_date ??
//   record.quotationDate ??
//   record.date ??
//   record.quotation?.quote_date ??
//   record.quotation?.quoteDate ??
//   "";

// const getRecordItems = (record: QuotationRecord): QuotationItem[] => {
//   const items =
//     record.items ??
//     record.quotation_items ??
//     record.quotationItems ??
//     record.quotation?.items ??
//     [];

//   return Array.isArray(items) ? items : [];
// };

// const formatDate = (value: unknown): string => {
//   if (!value) return "-";

//   const raw = String(value);

//   // Handle a date-only string without timezone shifting.
//   const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

//   if (dateOnly) {
//     return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
//   }

//   const date = new Date(raw);

//   if (Number.isNaN(date.getTime())) return raw;

//   return date.toLocaleDateString("en-IN");
// };

// export default function Home() {
//   const [showForm, setShowForm] = useState(true);
//   const [showTable, setShowTable] = useState(false);

//   const [quoteNo, setQuoteNo] = useState("");
//   const [quoteDate, setQuoteDate] = useState(
//     new Date().toLocaleDateString("en-CA")
//   );
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [gstType, setGstType] = useState("with-gst");

//   const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
//   const [quotations, setQuotations] = useState<QuotationRecord[]>([]);

//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [loadingList, setLoadingList] = useState(false);
//   const [deletingId, setDeletingId] = useState<number | null>(null);

//   const resetForm = () => {
//     setQuoteNo("");
//     setQuoteDate(new Date().toLocaleDateString("en-CA"));
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("with-gst");
//     setItems([emptyItem()]);
//     setEditingId(null);
//   };

//   // NEW: Show the form and hide the table.
//   const handleNew = () => {
//     resetForm();
//     setShowForm(true);
//     setShowTable(false);
//   };

//   // SHOW: Hide the form and display the quotations table.
//   const handleShow = async () => {
//     setShowForm(false);
//     setShowTable(true);
//     setLoadingList(true);

//     try {
//       const response = await apiRequest("/quotations");
//       const result = unwrapResponse(response);

//       // Support either an array or { items: [...] } / { quotations: [...] }.
//       const records: QuotationRecord[] = Array.isArray(result)
//         ? result
//         : Array.isArray(result?.quotations)
//           ? result.quotations
//           : Array.isArray(result?.items)
//             ? result.items
//             : [];

//       setQuotations(records);
//     } catch (error) {
//       alert("Unable to load quotations: " + getErrorMessage(error));
//       setQuotations([]);
//     } finally {
//       setLoadingList(false);
//     }
//   };

//   const handleAddRow = () => {
//     setItems((previous) => [...previous, emptyItem()]);
//   };

//   const handleDeleteRow = (id: number) => {
//     setItems((previous) => previous.filter((row) => row.id !== id));
//   };

//   const handleItemChange = (
//     id: number,
//     field: keyof Omit<ItemRow, "id">,
//     value: string
//   ) => {
//     setItems((previous) =>
//       previous.map((row) =>
//         row.id === id
//           ? {
//               ...row,
//               [field]:
//                 field === "item"
//                   ? value
//                   : field === "qty"
//                     ? value === ""
//                       ? 0
//                       : Math.max(0, Number(value))
//                     : value === ""
//                       ? 0
//                       : Math.max(0, Number(value)),
//             }
//           : row
//       )
//     );
//   };

//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );

//   const gstTotal = gstType === "with-gst" ? subtotal * 0.18 : 0;
//   const cgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const sgst = gstType === "with-gst" ? subtotal * 0.09 : 0;
//   const grandTotal = subtotal + gstTotal;

//   const money = (amount: number) =>
//     amount.toLocaleString("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   const handleSave = async () => {
//     if (!quoteNo.trim() || !Number.isFinite(Number(quoteNo))) {
//       alert("Please enter a valid numeric Quote No.");
//       return;
//     }

//     if (!quoteDate || !name.trim() || !mobile.trim()) {
//       alert("Please enter Quote Date, Name and Mobile Number.");
//       return;
//     }

//     if (
//       items.length === 0 ||
//       items.some(
//         (row) =>
//           !row.item.trim() ||
//           !Number.isFinite(row.qty) ||
//           row.qty <= 0 ||
//           !Number.isFinite(row.price) ||
//           row.price < 0
//       )
//     ) {
//       alert("Please enter valid item names, quantities and prices.");
//       return;
//     }

//     const payload = {
//       quote_no: Number(quoteNo),
//       quote_date: quoteDate,
//       name: name.trim(),
//       location: location.trim(),
//       mobile: mobile.trim(),
//       gst_type: gstType,
//       items: items.map((row) => {
//         const baseAmount = row.qty * row.price;
//         const itemGst =
//           gstType === "with-gst" ? baseAmount * 0.18 : null;

//         return {
//           item: row.item.trim(),
//           qty: row.qty,
//           price: row.price,
//           gst18: itemGst,
//           amount: baseAmount + (itemGst ?? 0),
//         };
//       }),
//     };

//     setSaving(true);

//     try {
//       if (editingId !== null) {
//         await apiRequest(`/quotations/${editingId}`, {
//           method: "PUT",
//           body: JSON.stringify(payload),
//         });

//         alert("Quotation updated successfully.");
//       } else {
//         await apiRequest("/quotations", {
//           method: "POST",
//           body: JSON.stringify(payload),
//         });

//         alert("Quotation saved successfully.");
//       }

//       resetForm();
//       setShowForm(false);
//       setShowTable(true);

//       await handleShow();
//     } catch (error) {
//       alert("Unable to save quotation: " + getErrorMessage(error));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleEdit = async (record: QuotationRecord) => {
//     try {
//       let quotation = record;

//       // Fetch full record if the list endpoint doesn't include its items.
//       if (getRecordItems(quotation).length === 0 && record.id != null) {
//         const response = await apiRequest(`/quotations/${record.id}`);
//         const detail = unwrapResponse(response);

//         if (detail && typeof detail === "object") {
//           quotation = detail.quotation ?? detail;
//         }
//       }

//       const recordItems = getRecordItems(quotation);
//       const rawGstType = String(
//         quotation.gst_type ?? quotation.gstType ?? ""
//       ).toLowerCase();

//       const hasGst =
//         rawGstType
//           ? rawGstType === "with-gst" || rawGstType === "with_gst"
//           : recordItems.some(
//               (item) => item.gst18 !== null && item.gst18 !== undefined
//             );

//       const dateValue = getQuoteDate(quotation);
//       const dateForInput = dateValue
//         ? String(dateValue).slice(0, 10)
//         : new Date().toLocaleDateString("en-CA");

//       setQuoteNo(String(getQuoteNumber(quotation)));
//       setQuoteDate(dateForInput);
//       setName(quotation.name ?? "");
//       setLocation(quotation.location ?? "");
//       setMobile(
//         quotation.mobile ??
//           quotation.mobile_number ??
//           quotation.mobileNumber ??
//           ""
//       );
//       setGstType(hasGst ? "with-gst" : "without-gst");

//       setItems(
//         recordItems.length > 0
//           ? recordItems.map((item) => ({
//               id: item.id ?? Date.now() + Math.random(),
//               item: item.item ?? "",
//               qty: Number(item.qty ?? item.quantity ?? 1),
//               price: Number(item.price ?? 0),
//             }))
//           : [emptyItem()]
//       );

//       setEditingId(Number(quotation.id));
//       setShowForm(true);
//       setShowTable(false);
//     } catch (error) {
//       alert("Unable to load quotation for editing: " + getErrorMessage(error));
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this quotation?")) {
//       return;
//     }

//     setDeletingId(id);

//     try {
//       await apiRequest(`/quotations/${id}`, {
//         method: "DELETE",
//       });

//       setQuotations((previous) =>
//         previous.filter((record) => Number(record.id) !== Number(id))
//       );

//       alert("Quotation deleted successfully.");
//     } catch (error) {
//       alert("Unable to delete quotation: " + getErrorMessage(error));
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-gray-100 p-4 text-gray-800 sm:p-8">
//       <div className="mx-auto max-w-6xl">
//         <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
//           <h1 className="text-2xl font-bold text-blue-700">
//             Quotation Management
//           </h1>

//           <div className="flex gap-3">
//             <button
//               type="button"
//               onClick={handleNew}
//               className="rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//             >
//               New
//             </button>

//             <button
//               type="button"
//               onClick={handleShow}
//               className="rounded bg-gray-700 px-5 py-2 font-medium text-white hover:bg-gray-800"
//             >
//               Show
//             </button>
//           </div>
//         </div>

//         {showForm && (
//           <section className="mb-8 rounded-lg bg-white p-5 shadow sm:p-7">
//             <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
//               <h2 className="text-xl font-bold">
//                 {editingId !== null ? "Update Quotation" : "Quotation Form"}
//               </h2>

//               {editingId !== null && (
//                 <button
//                   type="button"
//                   onClick={handleNew}
//                   className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
//                 >
//                   Cancel Edit
//                 </button>
//               )}
//             </div>

//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   Quote No *
//                 </label>
//                 <input
//                   type="number"
//                   min="1"
//                   value={quoteNo}
//                   onChange={(e) => setQuoteNo(e.target.value)}
//                   placeholder="Enter quote number"
//                   className="w-full rounded border p-2 outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   Quote Date *
//                 </label>
//                 <input
//                   type="date"
//                   value={quoteDate}
//                   onChange={(e) => setQuoteDate(e.target.value)}
//                   className="w-full rounded border p-2 outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   placeholder="Enter customer name"
//                   className="w-full rounded border p-2 outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   Mobile Number *
//                 </label>
//                 <input
//                   type="tel"
//                   value={mobile}
//                   onChange={(e) => setMobile(e.target.value)}
//                   placeholder="Enter mobile number"
//                   className="w-full rounded border p-2 outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   Location
//                 </label>
//                 <textarea
//                   value={location}
//                   onChange={(e) => setLocation(e.target.value)}
//                   placeholder="Enter customer location"
//                   rows={3}
//                   className="w-full rounded border p-2 outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   GST Type
//                 </label>
//                 <select
//                   value={gstType}
//                   onChange={(e) => setGstType(e.target.value)}
//                   className="w-full rounded border bg-white p-2 outline-none focus:border-blue-500"
//                 >
//                   <option value="with-gst">With GST (18%)</option>
//                   <option value="without-gst">Without GST</option>
//                 </select>
//               </div>
//             </div>

//             <div className="mt-8">
//               <div className="mb-3 flex items-center justify-between gap-3">
//                 <h3 className="text-lg font-semibold">Quotation Items</h3>
//                 <button
//                   type="button"
//                   onClick={handleAddRow}
//                   className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
//                 >
//                   + Add Item
//                 </button>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[650px] border-collapse border border-gray-300 text-sm">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-3 text-left">Item</th>
//                       <th className="border p-3 text-right">QTY</th>
//                       <th className="border p-3 text-right">Price (₹)</th>
//                       <th className="border p-3 text-right">GST 18% (₹)</th>
//                       <th className="border p-3 text-right">Amount (₹)</th>
//                       <th className="border p-3 text-center">Action</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {items.map((row) => {
//                       const baseAmount = row.qty * row.price;
//                       const rowGst =
//                         gstType === "with-gst" ? baseAmount * 0.18 : 0;

//                       return (
//                         <tr key={row.id}>
//                           <td className="border p-2">
//                             <input
//                               type="text"
//                               value={row.item}
//                               onChange={(e) =>
//                                 handleItemChange(row.id, "item", e.target.value)
//                               }
//                               placeholder="Item name"
//                               className="w-full rounded border p-2"
//                             />
//                           </td>

//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               min="1"
//                               value={row.qty}
//                               onChange={(e) =>
//                                 handleItemChange(row.id, "qty", e.target.value)
//                               }
//                               className="w-20 rounded border p-2 text-right"
//                             />
//                           </td>

//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               min="0"
//                               step="0.01"
//                               value={row.price}
//                               onChange={(e) =>
//                                 handleItemChange(row.id, "price", e.target.value)
//                               }
//                               className="w-28 rounded border p-2 text-right"
//                             />
//                           </td>

//                           <td className="border p-3 text-right">
//                             {money(rowGst)}
//                           </td>

//                           <td className="border p-3 text-right">
//                             {money(baseAmount + rowGst)}
//                           </td>

//                           <td className="border p-2 text-center">
//                             <button
//                               type="button"
//                               onClick={() => handleDeleteRow(row.id)}
//                               className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
//                             >
//                               Delete
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="mt-6 ml-auto w-full space-y-2 sm:max-w-sm">
//               <div className="flex justify-between">
//                 <span>Subtotal</span>
//                 <span className="font-medium">{money(subtotal)}</span>
//               </div>

//               <div className="flex justify-between">
//                 <span>CGST 9%</span>
//                 <span>{money(cgst)}</span>
//               </div>

//               <div className="flex justify-between">
//                 <span>SGST 9%</span>
//                 <span>{money(sgst)}</span>
//               </div>

//               <div className="flex justify-between border-t pt-2">
//                 <span>GST Total</span>
//                 <span>{money(gstTotal)}</span>
//               </div>

//               <div className="flex justify-between border-t pt-3 text-lg font-bold">
//                 <span>Grand Total</span>
//                 <span>{money(grandTotal)}</span>
//               </div>
//             </div>

//             <div className="mt-7 flex flex-wrap justify-end gap-3">
//               <button
//                 type="button"
//                 onClick={handleNew}
//                 className="rounded border border-gray-300 px-5 py-2 hover:bg-gray-100"
//               >
//                 Clear
//               </button>

//               <button
//                 type="button"
//                 onClick={handleSave}
//                 disabled={saving}
//                 className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {saving
//                   ? "Saving..."
//                   : editingId !== null
//                     ? "Update Quotation"
//                     : "Save Quotation"}
//               </button>
//             </div>
//           </section>
//         )}

//         {showTable && (
//           <section className="rounded-lg bg-white p-5 shadow sm:p-7">
//             <h2 className="mb-5 text-xl font-bold">All Quotations</h2>

//             {loadingList ? (
//               <p className="py-6 text-center text-gray-500">
//                 Loading quotations...
//               </p>
//             ) : quotations.length === 0 ? (
//               <p className="py-6 text-center text-gray-500">
//                 No quotations found.
//               </p>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[700px] border-collapse border border-gray-300 text-sm">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-3 text-left">Quote No</th>
//                       <th className="border p-3 text-left">Date</th>
//                       <th className="border p-3 text-left">Name</th>
//                       <th className="border p-3 text-left">Mobile Number</th>
//                       <th className="border p-3 text-center">Action</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {quotations.map((record, index) => (
//                       <tr key={record.id ?? index} className="hover:bg-gray-50">
//                         <td className="border p-3">
//                           {getQuoteNumber(record) || "-"}
//                         </td>

//                         <td className="border p-3">
//                           {formatDate(getQuoteDate(record))}
//                         </td>

//                         <td className="border p-3">{record.name || "-"}</td>

//                         <td className="border p-3">
//                           {record.mobile ??
//                             record.mobile_number ??
//                             record.mobileNumber ??
//                             "-"}
//                         </td>

//                         <td className="border p-3">
//                           <div className="flex justify-center gap-2">
//                             <button
//                               type="button"
//                               onClick={() => handleEdit(record)}
//                               className="rounded bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600"
//                             >
//                               Edit
//                             </button>

//                             <button
//                               type="button"
//                               onClick={() => handleDelete(Number(record.id))}
//                               disabled={
//                                 deletingId === Number(record.id) ||
//                                 record.id == null
//                               }
//                               className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
//                             >
//                               {deletingId === Number(record.id)
//                                 ? "Deleting..."
//                                 : "Delete"}
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}
//       </div>
//     </main>
//   );
// }

// Ok Style and Code this Section

// "use client";

// import { useState } from "react";
// import { apiRequest } from "@/lib/api";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// type QuotationItem = {
//   id?: number;
//   item: string;
//   qty: number;
//   price: number;
//   gst18: number | null;
//   amount?: number;
// };

// type QuotationRecord = {
//   id: number;
//   quote_no: number;
//   quote_date: string;
//   name: string;
//   location: string | null;
//   mobile: string;
//   items?: QuotationItem[];
// };

// export default function Home() {
//   // CURRENT DATE
//   const getCurrentDate = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, "0");
//     const day = String(now.getDate()).padStart(2, "0");

//     return `${year}-${month}-${day}`;
//   };

//   // CUSTOMER DETAILS
//   const [quoteNo, setQuoteNo] = useState("1001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // GST TYPE
//   const [gstType, setGstType] = useState("");

//   // API STATES
//   const [saving, setSaving] = useState(false);
//   const [loadingList, setLoadingList] = useState(false);
//   const [deletingId, setDeletingId] = useState<number | null>(null);
//   const [editingId, setEditingId] = useState<number | null>(null);

//   // QUOTATION LIST
//   const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
//   const [showTable, setShowTable] = useState(false);

//   // ITEMS
//   const [items, setItems] = useState<ItemRow[]>([
//     {
//       id: 1,
//       item: "",
//       qty: 1,
//       price: 0,
//     },
//   ]);

//   // RESET FORM
//   const handleNew = () => {
//     setEditingId(null);
//     setQuoteNo("");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");

//     setItems([
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);

//     setShowTable(false);
//   };

//   // SHOW ALL QUOTATIONS - GET API
//   const handleShow = async () => {
//     try {
//       setLoadingList(true);
//       setShowTable(true);

//       const result = await apiRequest("/quotations", {
//         method: "GET",
//       });

//       const records: QuotationRecord[] = Array.isArray(result)
//         ? result
//         : result?.data;

//       if (!Array.isArray(records)) {
//         throw new Error("GET API did not return a quotation array");
//       }

//       setQuotations(records);
//     } catch (error) {
//       console.error("Get quotations error:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to load quotations"
//       );
//     } finally {
//       setLoadingList(false);
//     }
//   };

//   // ADD ITEM ROW
//   const handleAddRow = () => {
//     setItems((previousItems) => [
//       ...previousItems,
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // DELETE ITEM ROW
//   const handleDeleteRow = (id: number) => {
//     setItems((previousItems) =>
//       previousItems.filter((row) => row.id !== id)
//     );
//   };

//   // UPDATE ITEM ROW
//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string | number
//   ) => {
//     setItems((previousItems) =>
//       previousItems.map((row) =>
//         row.id === id ? { ...row, [field]: value } : row
//       )
//     );
//   };

//   // CALCULATIONS
//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );

//   const cgst =
//     gstType === "with-gst" ? subtotal * 0.09 : 0;

//   const sgst =
//     gstType === "with-gst" ? subtotal * 0.09 : 0;

//   const gstTotal = cgst + sgst;
//   const totalAmount = subtotal + gstTotal;

//   // SAVE OR UPDATE
//   const handleSave = async () => {
//     if (saving) return;

//     const numericQuoteNo = Number(quoteNo);

//     if (
//       !quoteNo.trim() ||
//       !Number.isSafeInteger(numericQuoteNo) ||
//       numericQuoteNo <= 0
//     ) {
//       alert("Please enter a valid numeric Quote No, e.g. 1001");
//       return;
//     }

//     if (!date) {
//       alert("Please select Date");
//       return;
//     }

//     if (!name.trim()) {
//       alert("Please enter Name");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type");
//       return;
//     }

//     if (items.length === 0) {
//       alert("Please add at least one item");
//       return;
//     }

//     for (const row of items) {
//       if (!row.item.trim()) {
//         alert("Please enter an item name for every row");
//         return;
//       }

//       if (!Number.isFinite(row.qty) || row.qty <= 0) {
//         alert("Quantity must be greater than zero");
//         return;
//       }

//       if (!Number.isFinite(row.price) || row.price < 0) {
//         alert("Price cannot be negative");
//         return;
//       }
//     }

//     const payload = {
//       quote_no: numericQuoteNo,
//       quote_date: date,
//       name: name.trim(),
//       location: location.trim(),
//       mobile: mobile.trim(),

//       items: items.map((row) => {
//         const qty = Number(row.qty);
//         const price = Number(row.price);
//         const baseAmount = qty * price;

//         const gst18 =
//           gstType === "with-gst"
//             ? Number((baseAmount * 0.18).toFixed(2))
//             : null;

//         const amount =
//           gstType === "with-gst"
//             ? Number((baseAmount + (gst18 ?? 0)).toFixed(2))
//             : Number(baseAmount.toFixed(2));

//         return {
//           item: row.item.trim(),
//           qty,
//           price,
//           gst18,
//           amount,
//         };
//       }),
//     };

//     try {
//       setSaving(true);

//       const isEditing = editingId !== null;

//       const result = isEditing
//         ? await apiRequest(`/quotations/${editingId}`, {
//             method: "PUT",
//             body: JSON.stringify(payload),
//           })
//         : await apiRequest("/quotations", {
//             method: "POST",
//             body: JSON.stringify(payload),
//           });

//       console.log("Quotation API response:", result);

//       alert(
//         isEditing
//           ? "Quotation updated successfully!"
//           : "Quotation saved successfully!"
//       );

//       // Clear the form after success.
//       setEditingId(null);
//       setQuoteNo("");
//       setDate(getCurrentDate());
//       setName("");
//       setLocation("");
//       setMobile("");
//       setGstType("");
//       setItems([
//         {
//           id: Date.now(),
//           item: "",
//           qty: 1,
//           price: 0,
//         },
//       ]);

//       // Refresh list when it is visible.
//       if (showTable) {
//         await handleShow();
//       }
//     } catch (error) {
//       console.error("Save/update error:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to save quotation"
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // EDIT QUOTATION
//   const handleEdit = async (record: QuotationRecord) => {
//     try {
//       let quotation = record;

//       // Fetch the full record if the list doesn't contain items.
//       if (!Array.isArray(record.items)) {
//         quotation = await apiRequest(
//           `/quotations/${record.id}`,
//           { method: "GET" }
//         );
//       }

//       if (!Array.isArray(quotation.items)) {
//         throw new Error(
//           "Quotation items were not returned by the API"
//         );
//       }

//       setEditingId(quotation.id);
//       setQuoteNo(String(quotation.quote_no));
//       setDate(String(quotation.quote_date).slice(0, 10));
//       setName(quotation.name ?? "");
//       setLocation(quotation.location ?? "");
//       setMobile(quotation.mobile ?? "");

//       const hasGst = quotation.items.some(
//         (item) => item.gst18 !== null && item.gst18 !== undefined
//       );

//       setGstType(hasGst ? "with-gst" : "without-gst");

//       setItems(
//         quotation.items.map((item, index) => ({
//           id: item.id ?? Date.now() + index,
//           item: item.item,
//           qty: Number(item.qty),
//           price: Number(item.price),
//         }))
//       );

//       setShowTable(false);

//       window.scrollTo({ top: 0, behavior: "smooth" });
//     } catch (error) {
//       console.error("Edit quotation error:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to load quotation"
//       );
//     }
//   };

//   // DELETE QUOTATION
//   const handleDelete = async (id: number) => {
//     if (
//       !window.confirm(
//         "Are you sure you want to delete this quotation?"
//       )
//     ) {
//       return;
//     }

//     try {
//       setDeletingId(id);

//       await apiRequest(`/quotations/${id}`, {
//         method: "DELETE",
//       });

//       setQuotations((previous) =>
//         previous.filter((quotation) => quotation.id !== id)
//       );

//       alert("Quotation deleted successfully!");
//     } catch (error) {
//       console.error("Delete quotation error:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to delete quotation"
//       );
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">
//       {/* TOP BUTTONS */}
//       <div className="mb-5 flex justify-end gap-4">
//         <button
//           type="button"
//           onClick={handleNew}
//           disabled={saving}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
//         >
//           New
//         </button>

//         <button
//           type="button"
//           onClick={handleShow}
//           disabled={loadingList}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {loadingList ? "Loading..." : "Show"}
//         </button>
//       </div>

//       {/* QUOTATION FORM */}
//       <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">
//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           {editingId !== null ? "Edit Quotation" : "Quotation Form"}
//         </h1>

//         {/* CUSTOMER DETAILS */}
//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>
//             <input
//               type="number"
//               min="1"
//               step="1"
//               value={quoteNo}
//               onChange={(e) => setQuoteNo(e.target.value)}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>
//             <input
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>
//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>
//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) => setMobile(e.target.value)}
//               maxLength={10}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div className="md:col-span-2">
//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>
//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               rows={4}
//               className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>
//             <select
//               value={gstType}
//               onChange={(e) => setGstType(e.target.value)}
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
//             >
//               <option value="">Select GST Type</option>
//               <option value="with-gst">With GST</option>
//               <option value="without-gst">Without GST</option>
//             </select>
//           </div>
//         </div>

//         {/* ITEM TABLE */}
//         {gstType && (
//           <div className="mt-8">
//             <div className="mb-4">
//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//               >
//                 + Add
//               </button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[950px] border-collapse border border-gray-300">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border border-gray-300 px-3 py-3 text-left">
//                       Item
//                     </th>
//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       QTY
//                     </th>
//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Price
//                     </th>

//                     {gstType === "with-gst" && (
//                       <th className="border border-gray-300 px-3 py-3 text-right">
//                         GST 18%
//                       </th>
//                     )}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Amount
//                     </th>
//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {items.map((row) => {
//                     const rowSubtotal = row.qty * row.price;

//                     const rowGst =
//                       gstType === "with-gst"
//                         ? Number((rowSubtotal * 0.18).toFixed(2))
//                         : 0;

//                     const rowAmount = rowSubtotal + rowGst;

//                     return (
//                       <tr key={row.id}>
//                         <td className="border border-gray-300 p-2">
//                           <input
//                             type="text"
//                             placeholder="Enter Item"
//                             value={row.item}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "item",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//                           />
//                         </td>

//                         <td className="border border-gray-300 p-2">
//                           <input
//                             type="number"
//                             min="1"
//                             value={row.qty}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "qty",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
//                           />
//                         </td>

//                         <td className="border border-gray-300 p-2">
//                           <input
//                             type="number"
//                             min="0"
//                             value={row.price}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "price",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
//                           />
//                         </td>

//                         {gstType === "with-gst" && (
//                           <td className="border border-gray-300 px-3 py-2 text-right">
//                             ₹{rowGst.toFixed(2)}
//                           </td>
//                         )}

//                         <td className="border border-gray-300 px-3 py-2 text-right font-medium">
//                           ₹{rowAmount.toFixed(2)}
//                         </td>

//                         <td className="border border-gray-300 p-2 text-center">
//                           <button
//                             type="button"
//                             onClick={() => handleDeleteRow(row.id)}
//                             className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                           >
//                             Delete
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             {/* TOTAL SECTION */}
//             <div className="mt-5 flex justify-end">
//               <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">
//                 <div className="mb-2 flex justify-between">
//                   <span className="text-gray-600">Subtotal</span>
//                   <span className="font-medium">
//                     ₹{subtotal.toFixed(2)}
//                   </span>
//                 </div>

//                 {gstType === "with-gst" && (
//                   <>
//                     <div className="mb-2 flex justify-between">
//                       <span className="text-gray-600">CGST 9%</span>
//                       <span className="font-medium">
//                         ₹{cgst.toFixed(2)}
//                       </span>
//                     </div>

//                     <div className="mb-2 flex justify-between">
//                       <span className="text-gray-600">SGST 9%</span>
//                       <span className="font-medium">
//                         ₹{sgst.toFixed(2)}
//                       </span>
//                     </div>

//                     <div className="mb-2 flex justify-between border-t border-gray-300 pt-2">
//                       <span className="font-medium text-gray-700">
//                         GST Total
//                       </span>
//                       <span className="font-medium">
//                         ₹{gstTotal.toFixed(2)}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">
//                   <span>Total Amount</span>
//                   <span>₹{totalAmount.toFixed(2)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* SAVE / UPDATE BUTTON */}
//         <div className="mt-8 flex justify-end gap-3">
//           {editingId !== null && (
//             <button
//               type="button"
//               onClick={handleNew}
//               disabled={saving}
//               className="rounded-md border border-gray-400 px-6 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
//             >
//               Cancel Edit
//             </button>
//           )}

//           <button
//             type="button"
//             onClick={handleSave}
//             disabled={saving}
//             className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {saving
//               ? "Saving..."
//               : editingId !== null
//                 ? "Update"
//                 : "Save"}
//           </button>
//         </div>
//       </div>

//       {/* ALL QUOTATIONS TABLE */}
//       {showTable && (
//         <div className="mx-auto mt-8 max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">
//           <div className="mb-5 flex items-center justify-between">
//             <h2 className="text-xl font-bold text-gray-800">
//               All Quotations
//             </h2>

//             <button
//               type="button"
//               onClick={handleShow}
//               disabled={loadingList}
//               className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
//             >
//               {loadingList ? "Loading..." : "Refresh"}
//             </button>
//           </div>

//           {loadingList ? (
//             <p className="py-6 text-center text-gray-600">
//               Loading quotations...
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[800px] border-collapse border border-gray-300">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border border-gray-300 px-4 py-3 text-left">
//                       Quote No
//                     </th>
//                     <th className="border border-gray-300 px-4 py-3 text-left">
//                       Date
//                     </th>
//                     <th className="border border-gray-300 px-4 py-3 text-left">
//                       Name
//                     </th>
//                     <th className="border border-gray-300 px-4 py-3 text-left">
//                       Mobile Number
//                     </th>
//                     <th className="border border-gray-300 px-4 py-3 text-center">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {quotations.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={5}
//                         className="border border-gray-300 px-4 py-6 text-center text-gray-500"
//                       >
//                         No quotations found.
//                       </td>
//                     </tr>
//                   ) : (
//                     quotations.map((quotation) => (
//                       <tr key={quotation.id}>
//                         <td className="border border-gray-300 px-4 py-3">
//                           {quotation.quote_no}
//                         </td>

//                         <td className="border border-gray-300 px-4 py-3">
//                           {String(quotation.quote_date).slice(0, 10)}
//                         </td>

//                         <td className="border border-gray-300 px-4 py-3">
//                           {quotation.name}
//                         </td>

//                         <td className="border border-gray-300 px-4 py-3">
//                           {quotation.mobile}
//                         </td>

//                         <td className="border border-gray-300 px-4 py-3">
//                           <div className="flex justify-center gap-2">
//                             <button
//                               type="button"
//                               onClick={() => handleEdit(quotation)}
//                               className="rounded-md bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
//                             >
//                               Edit
//                             </button>

//                             <button
//                               type="button"
//                               disabled={deletingId === quotation.id}
//                               onClick={() => handleDelete(quotation.id)}
//                               className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
//                             >
//                               {deletingId === quotation.id
//                                 ? "Deleting..."
//                                 : "Delete"}
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}
//     </main>
//   );
// }


// "use client";

// import { useState } from "react";
// import { apiRequest } from "@/lib/api";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// export default function Home() {
//   // CURRENT DATE - local YYYY-MM-DD
//   const getCurrentDate = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, "0");
//     const day = String(now.getDate()).padStart(2, "0");

//     return `${year}-${month}-${day}`;
//   };

//   // CUSTOMER DETAILS
//   const [quoteNo, setQuoteNo] = useState("1001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // GST TYPE
//   const [gstType, setGstType] = useState("");

//   // API LOADING STATE
//   const [saving, setSaving] = useState(false);

//   // ITEMS
//   const [items, setItems] = useState<ItemRow[]>([
//     {
//       id: 1,
//       item: "",
//       qty: 1,
//       price: 0,
//     },
//   ]);

//   // NEW QUOTATION
//   const handleNew = () => {
//     setQuoteNo("");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");

//     setItems([
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // SHOW
//   const handleShow = () => {
//     console.log("Quotation Details", {
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       cgst,
//       sgst,
//       gstTotal,
//       totalAmount,
//     });
//   };

//   // ADD ITEM ROW
//   const handleAddRow = () => {
//     setItems((previousItems) => [
//       ...previousItems,
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // DELETE ITEM ROW
//   const handleDeleteRow = (id: number) => {
//     setItems((previousItems) =>
//       previousItems.filter((row) => row.id !== id)
//     );
//   };

//   // UPDATE ITEM ROW
//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string | number
//   ) => {
//     setItems((previousItems) =>
//       previousItems.map((row) =>
//         row.id === id
//           ? { ...row, [field]: value }
//           : row
//       )
//     );
//   };

//   // CALCULATIONS
//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );

//   const cgst =
//     gstType === "with-gst" ? subtotal * 0.09 : 0;

//   const sgst =
//     gstType === "with-gst" ? subtotal * 0.09 : 0;

//   const gstTotal = cgst + sgst;
//   const totalAmount = subtotal + gstTotal;

//   // SAVE - CALL NESTJS API
//   const handleSave = async () => {
//     if (saving) return;

//     const numericQuoteNo = Number(quoteNo);

//     if (
//       !quoteNo.trim() ||
//       !Number.isSafeInteger(numericQuoteNo) ||
//       numericQuoteNo <= 0
//     ) {
//       alert("Please enter a valid numeric Quote No, e.g. 1001");
//       return;
//     }

//     if (!date) {
//       alert("Please select Date");
//       return;
//     }

//     if (!name.trim()) {
//       alert("Please enter Name");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type");
//       return;
//     }

//     if (items.length === 0) {
//       alert("Please add at least one item");
//       return;
//     }

//     for (const row of items) {
//       if (!row.item.trim()) {
//         alert("Please enter an item name for every row");
//         return;
//       }

//       if (!Number.isFinite(row.qty) || row.qty <= 0) {
//         alert("Item quantity must be greater than zero");
//         return;
//       }

//       if (!Number.isFinite(row.price) || row.price < 0) {
//         alert("Item price cannot be negative");
//         return;
//       }
//     }

//     // Build the exact JSON format expected by the API.
//     const payload = {
//       quote_no: numericQuoteNo,
//       quote_date: date,
//       name: name.trim(),
//       location: location.trim(),
//       mobile: mobile.trim(),

//       items: items.map((row) => {
//         const qty = Number(row.qty);
//         const price = Number(row.price);
//         const baseAmount = qty * price;

//         const gst18 =
//           gstType === "with-gst"
//             ? Number((baseAmount * 0.18).toFixed(2))
//             : null;

//         const amount =
//           gstType === "with-gst"
//             ? Number((baseAmount + (gst18 ?? 0)).toFixed(2))
//             : Number(baseAmount.toFixed(2));

//         return {
//           item: row.item.trim(),
//           qty,
//           price,
//           gst18,
//           amount,
//         };
//       }),
//     };

//     try {
//       setSaving(true);

//       console.log("Quotation API Request:", payload);

//       const result = await apiRequest("/quotations", {
//         method: "POST",
//         body: JSON.stringify(payload),
//       });

//       console.log("Quotation API Response:", result);

//       alert("Quotation saved successfully!");
//       // Clear all fields after successful save
//       handleNew();
//     } catch (error) {
//       console.error("Save quotation error:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to save quotation"
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">
//       {/* TOP BUTTONS */}
//       <div className="mb-5 flex justify-end gap-4">
//         <button
//           type="button"
//           onClick={handleNew}
//           disabled={saving}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
//         >
//           New
//         </button>

//         <button
//           type="button"
//           onClick={handleShow}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700"
//         >
//           Show
//         </button>
//       </div>

//       {/* QUOTATION FORM */}
//       <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">
//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           Quotation Form
//         </h1>

//         {/* CUSTOMER DETAILS */}
//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>
//             <input
//               type="number"
//               min="1"
//               step="1"
//               value={quoteNo}
//               onChange={(e) => setQuoteNo(e.target.value)}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>
//             <input
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>
//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>
//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) => setMobile(e.target.value)}
//               maxLength={10}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div className="md:col-span-2">
//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>
//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               rows={4}
//               className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>
//             <select
//               value={gstType}
//               onChange={(e) => setGstType(e.target.value)}
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
//             >
//               <option value="">Select GST Type</option>
//               <option value="with-gst">With GST</option>
//               <option value="without-gst">Without GST</option>
//             </select>
//           </div>
//         </div>

//         {/* ITEM TABLE */}
//         {gstType && (
//           <div className="mt-8">
//             <div className="mb-4">
//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//               >
//                 + Add
//               </button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[950px] border-collapse border border-gray-300">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border border-gray-300 px-3 py-3 text-left">
//                       Item
//                     </th>
//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       QTY
//                     </th>
//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Price
//                     </th>

//                     {gstType === "with-gst" && (
//                       <th className="border border-gray-300 px-3 py-3 text-right">
//                         GST 18%
//                       </th>
//                     )}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Amount
//                     </th>
//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {items.map((row) => {
//                     const rowSubtotal = row.qty * row.price;

//                     const rowGst =
//                       gstType === "with-gst"
//                         ? Number((rowSubtotal * 0.18).toFixed(2))
//                         : 0;

//                     const rowAmount =
//                       rowSubtotal + rowGst;

//                     return (
//                       <tr key={row.id}>
//                         <td className="border border-gray-300 p-2">
//                           <input
//                             type="text"
//                             placeholder="Enter Item"
//                             value={row.item}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "item",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//                           />
//                         </td>

//                         <td className="border border-gray-300 p-2">
//                           <input
//                             type="number"
//                             min="1"
//                             value={row.qty}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "qty",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
//                           />
//                         </td>

//                         <td className="border border-gray-300 p-2">
//                           <input
//                             type="number"
//                             min="0"
//                             value={row.price}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "price",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
//                           />
//                         </td>

//                         {gstType === "with-gst" && (
//                           <td className="border border-gray-300 px-3 py-2 text-right">
//                             ₹{rowGst.toFixed(2)}
//                           </td>
//                         )}

//                         <td className="border border-gray-300 px-3 py-2 text-right font-medium">
//                           ₹{rowAmount.toFixed(2)}
//                         </td>

//                         <td className="border border-gray-300 p-2 text-center">
//                           <button
//                             type="button"
//                             onClick={() => handleDeleteRow(row.id)}
//                             className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                           >
//                             Delete
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             {/* TOTAL SECTION */}
//             <div className="mt-5 flex justify-end">
//               <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">
//                 <div className="mb-2 flex justify-between">
//                   <span className="text-gray-600">Subtotal</span>
//                   <span className="font-medium">
//                     ₹{subtotal.toFixed(2)}
//                   </span>
//                 </div>

//                 {gstType === "with-gst" && (
//                   <>
//                     <div className="mb-2 flex justify-between">
//                       <span className="text-gray-600">CGST 9%</span>
//                       <span className="font-medium">
//                         ₹{cgst.toFixed(2)}
//                       </span>
//                     </div>

//                     <div className="mb-2 flex justify-between">
//                       <span className="text-gray-600">SGST 9%</span>
//                       <span className="font-medium">
//                         ₹{sgst.toFixed(2)}
//                       </span>
//                     </div>

//                     <div className="mb-2 flex justify-between border-t border-gray-300 pt-2">
//                       <span className="font-medium text-gray-700">
//                         GST Total
//                       </span>
//                       <span className="font-medium">
//                         ₹{gstTotal.toFixed(2)}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">
//                   <span>Total Amount</span>
//                   <span>₹{totalAmount.toFixed(2)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* SAVE BUTTON */}
//         <div className="mt-8 flex justify-end">
//           <button
//             type="button"
//             onClick={handleSave}
//             disabled={saving}
//             className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {saving ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </div>
//     </main>
//   );
// }



// "use client";

// import { useState } from "react";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// export default function Home() {
//   // ==================================================
//   // CURRENT DATE
//   // ==================================================

//   const getCurrentDate = () => {
//     return new Date().toISOString().split("T")[0];
//   };

//   // ==================================================
//   // CUSTOMER DETAILS
//   // ==================================================

//   const [quoteNo, setQuoteNo] = useState("QT-0001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // ==================================================
//   // GST TYPE
//   // ==================================================

//   const [gstType, setGstType] = useState("");

//   // ==================================================
//   // ITEMS
//   // ==================================================

//   const [items, setItems] = useState<ItemRow[]>([
//     {
//       id: 1,
//       item: "",
//       qty: 1,
//       price: 0,
//     },
//   ]);

//   // ==================================================
//   // NEW QUOTATION
//   // ==================================================

//   const handleNew = () => {
//     setQuoteNo("");
//     // setQuoteNo("QT-0001");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");

//     setItems([
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // ==================================================
//   // SHOW
//   // ==================================================

//   const handleShow = () => {
//     console.log("Quotation Details");

//     console.log({
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       cgst,
//       sgst,
//       gstTotal,
//       totalAmount,
//     });
//   };

//   // ==================================================
//   // ADD ITEM ROW
//   // ==================================================

//   const handleAddRow = () => {
//     const newRow: ItemRow = {
//       id: Date.now(),
//       item: "",
//       qty: 1,
//       price: 0,
//     };

//     setItems((previousItems) => [
//       ...previousItems,
//       newRow,
//     ]);
//   };

//   // ==================================================
//   // DELETE ITEM ROW
//   // ==================================================

//   const handleDeleteRow = (id: number) => {
//     setItems((previousItems) =>
//       previousItems.filter((row) => row.id !== id)
//     );
//   };

//   // ==================================================
//   // UPDATE ITEM ROW
//   // ==================================================

//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string | number
//   ) => {
//     setItems((previousItems) =>
//       previousItems.map((row) =>
//         row.id === id
//           ? {
//               ...row,
//               [field]: value,
//             }
//           : row
//       )
//     );
//   };

//   // ==================================================
//   // CALCULATIONS
//   // ==================================================

//   // Subtotal
//   const subtotal = items.reduce(
//     (total, row) => {
//       return total + row.qty * row.price;
//     },
//     0
//   );

//   // CGST 9%
//   const cgst =
//     gstType === "with-gst"
//       ? subtotal * 0.09
//       : 0;

//   // SGST 9%
//   const sgst =
//     gstType === "with-gst"
//       ? subtotal * 0.09
//       : 0;

//   // GST Total = CGST + SGST
//   const gstTotal = cgst + sgst;

//   // Total Amount
//   const totalAmount =
//     subtotal + gstTotal;

//   // ==================================================
//   // SAVE
//   // ==================================================

//   const handleSave = () => {
//     if (!name.trim()) {
//       alert("Please enter Name");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type");
//       return;
//     }

//     const quotation = {
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       cgst,
//       sgst,
//       gstTotal,
//       totalAmount,
//     };

//     console.log(
//       "Saved Quotation:",
//       quotation
//     );

//     alert("Quotation saved successfully!");
//   };

//   // ==================================================
//   // PAGE
//   // ==================================================

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">

//       {/* ==================================================
//           TOP BUTTONS
//       ================================================== */}

//       <div className="mb-5 flex justify-end gap-4">

//         {/* NEW */}

//         <button
//           type="button"
//           onClick={handleNew}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700"
//         >
//           New
//         </button>

//         {/* SHOW */}

//         <button
//           type="button"
//           onClick={handleShow}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700"
//         >
//           Show
//         </button>

//       </div>

//       {/* ==================================================
//           QUOTATION FORM
//       ================================================== */}

//       <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">

//         {/* TITLE */}

//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           Quotation Form
//         </h1>

//         {/* ==================================================
//             CUSTOMER DETAILS
//         ================================================== */}

//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

//           {/* QUOTE NO */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>

//             <input
//               type="text"
//               value={quoteNo}
//               onChange={(e) =>
//                 setQuoteNo(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* DATE */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>

//             <input
//               type="date"
//               value={date}
//               onChange={(e) =>
//                 setDate(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* NAME */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>

//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) =>
//                 setName(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* MOBILE */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>

//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) =>
//                 setMobile(e.target.value)
//               }
//               maxLength={10}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* LOCATION */}

//           <div className="md:col-span-2">

//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>

//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) =>
//                 setLocation(e.target.value)
//               }
//               rows={4}
//               className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* GST */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>

//             <select
//               value={gstType}
//               onChange={(e) =>
//                 setGstType(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
//             >

//               <option value="">
//                 Select GST Type
//               </option>

//               <option value="with-gst">
//                 With GST
//               </option>

//               <option value="without-gst">
//                 Without GST
//               </option>

//             </select>

//           </div>

//         </div>

//         {/* ==================================================
//             ITEM TABLE
//         ================================================== */}

//         {gstType && (

//           <div className="mt-8">

//             {/* ADD BUTTON */}

//             <div className="mb-4">

//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//               >
//                 + Add
//               </button>

//             </div>

//             {/* ==================================================
//                 TABLE
//             ================================================== */}

//             <div className="overflow-x-auto">

//               <table className="w-full min-w-[950px] border-collapse border border-gray-300">

//                 {/* TABLE HEADER */}

//                 <thead>

//                   <tr className="bg-gray-100">

//                     {/* ITEM */}

//                     <th className="border border-gray-300 px-3 py-3 text-left">
//                       Item
//                     </th>

//                     {/* QTY */}

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       QTY
//                     </th>

//                     {/* PRICE */}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Price
//                     </th>

//                     {/* GST 18% */}

//                     {gstType === "with-gst" && (

//                       <th className="border border-gray-300 px-3 py-3 text-right">
//                         GST 18%
//                       </th>

//                     )}

//                     {/* AMOUNT */}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Amount
//                     </th>

//                     {/* ACTION */}

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       Action
//                     </th>

//                   </tr>

//                 </thead>

//                 {/* TABLE BODY */}

//                 <tbody>

//                   {items.map((row) => {

//                     // Row subtotal

//                     const rowSubtotal =
//                       row.qty * row.price;

//                     // Row GST 18%

//                     const rowGst =
//                       gstType === "with-gst"
//                         ? rowSubtotal * 0.18
//                         : 0;

//                     // Row amount

//                     const rowAmount =
//                       rowSubtotal + rowGst;

//                     return (

//                       <tr key={row.id}>

//                         {/* ITEM */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="text"
//                             placeholder="Enter Item"
//                             value={row.item}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "item",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* QTY */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="1"
//                             value={row.qty}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "qty",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* PRICE */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="0"
//                             value={row.price}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "price",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* GST 18% */}

//                         {gstType === "with-gst" && (

//                           <td className="border border-gray-300 px-3 py-2 text-right">

//                             ₹{rowGst.toFixed(2)}

//                           </td>

//                         )}

//                         {/* AMOUNT */}

//                         <td className="border border-gray-300 px-3 py-2 text-right font-medium">

//                           ₹{rowAmount.toFixed(2)}

//                         </td>

//                         {/* ACTION */}

//                         <td className="border border-gray-300 p-2 text-center">

//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleDeleteRow(row.id)
//                             }
//                             className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                           >
//                             Delete
//                           </button>

//                         </td>

//                       </tr>

//                     );

//                   })}

//                 </tbody>

//               </table>

//             </div>

//             {/* ==================================================
//                 TOTAL SECTION
//             ================================================== */}

//             <div className="mt-5 flex justify-end">

//               <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">

//                 {/* SUBTOTAL */}

//                 <div className="mb-2 flex justify-between">

//                   <span className="text-gray-600">
//                     Subtotal
//                   </span>

//                   <span className="font-medium">
//                     ₹{subtotal.toFixed(2)}
//                   </span>

//                 </div>

//                 {/* CGST 9% */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       CGST 9%
//                     </span>

//                     <span className="font-medium">
//                       ₹{cgst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}

//                 {/* SGST 9% */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       SGST 9%
//                     </span>

//                     <span className="font-medium">
//                       ₹{sgst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}

//                 {/* GST TOTAL */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between border-t border-gray-300 pt-2">

//                     <span className="font-medium text-gray-700">
//                       GST Total
//                     </span>

//                     <span className="font-medium">
//                       ₹{gstTotal.toFixed(2)}
//                     </span>

//                   </div>

//                 )}

//                 {/* TOTAL AMOUNT */}

//                 <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">

//                   <span>
//                     Total Amount
//                   </span>

//                   <span>
//                     ₹{totalAmount.toFixed(2)}
//                   </span>

//                 </div>

//               </div>

//             </div>

//           </div>

//         )}

//         {/* ==================================================
//             SAVE BUTTON
//         ================================================== */}

//         <div className="mt-8 flex justify-end">

//           <button
//             type="button"
//             onClick={handleSave}
//             className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700"
//           >
//             Save
//           </button>

//         </div>

//       </div>

//     </main>
//   );
// }




// "use client";

// import { useState } from "react";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// export default function Home() {
//   // ==================================================
//   // CURRENT DATE
//   // ==================================================

//   const getCurrentDate = () => {
//     return new Date().toISOString().split("T")[0];
//   };

//   // ==================================================
//   // CUSTOMER DETAILS
//   // ==================================================

//   const [quoteNo, setQuoteNo] = useState("QT-0001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // ==================================================
//   // GST TYPE
//   // ==================================================

//   const [gstType, setGstType] = useState("");

//   // ==================================================
//   // ITEMS
//   // ==================================================

//   const [items, setItems] = useState<ItemRow[]>([
//     {
//       id: 1,
//       item: "",
//       qty: 1,
//       price: 0,
//     },
//   ]);

//   // ==================================================
//   // NEW
//   // ==================================================

//   const handleNew = () => {
//     setQuoteNo("QT-0001");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");

//     setItems([
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // ==================================================
//   // SHOW
//   // ==================================================

//   const handleShow = () => {
//     console.log("Quotation Details");

//     console.log({
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       cgst,
//       sgst,
//       gst,
//       totalAmount,
//     });
//   };

//   // ==================================================
//   // ADD ROW
//   // ==================================================

//   const handleAddRow = () => {
//     const newRow: ItemRow = {
//       id: Date.now(),
//       item: "",
//       qty: 1,
//       price: 0,
//     };

//     setItems((previousItems) => [
//       ...previousItems,
//       newRow,
//     ]);
//   };

//   // ==================================================
//   // DELETE ROW
//   // ==================================================

//   const handleDeleteRow = (id: number) => {
//     setItems((previousItems) =>
//       previousItems.filter((row) => row.id !== id)
//     );
//   };

//   // ==================================================
//   // CHANGE ITEM
//   // ==================================================

//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string | number
//   ) => {
//     setItems((previousItems) =>
//       previousItems.map((row) =>
//         row.id === id
//           ? {
//               ...row,
//               [field]: value,
//             }
//           : row
//       )
//     );
//   };

//   // ==================================================
//   // CALCULATIONS
//   // ==================================================

//   // Subtotal
//   const subtotal = items.reduce(
//     (total, row) => {
//       return total + row.qty * row.price;
//     },
//     0
//   );

//   // CGST 9%
//   const cgst =
//     gstType === "with-gst"
//       ? subtotal * 0.09
//       : 0;

//   // SGST 9%
//   const sgst =
//     gstType === "with-gst"
//       ? subtotal * 0.09
//       : 0;

//   // GST 18%
//   const gst = cgst + sgst;

//   // Total
//   const totalAmount =
//     subtotal + cgst + sgst;

//   // ==================================================
//   // SAVE
//   // ==================================================

//   const handleSave = () => {
//     if (!name.trim()) {
//       alert("Please enter Name");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type");
//       return;
//     }

//     const quotation = {
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       cgst,
//       sgst,
//       gst,
//       totalAmount,
//     };

//     console.log("Saved Quotation:", quotation);

//     alert("Quotation saved successfully!");
//   };

//   // ==================================================
//   // PAGE
//   // ==================================================

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">

//       {/* ==================================================
//           TOP BUTTONS
//       ================================================== */}

//       <div className="mb-5 flex justify-end gap-4">

//         <button
//           type="button"
//           onClick={handleNew}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700"
//         >
//           New
//         </button>

//         <button
//           type="button"
//           onClick={handleShow}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700"
//         >
//           Show
//         </button>

//       </div>

//       {/* ==================================================
//           QUOTATION FORM
//       ================================================== */}

//       <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">

//         {/* TITLE */}

//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           Quotation Form
//         </h1>

//         {/* ==================================================
//             CUSTOMER DETAILS
//         ================================================== */}

//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

//           {/* QUOTE NO */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>

//             <input
//               type="text"
//               value={quoteNo}
//               onChange={(e) =>
//                 setQuoteNo(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* DATE */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>

//             <input
//               type="date"
//               value={date}
//               onChange={(e) =>
//                 setDate(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* NAME */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>

//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) =>
//                 setName(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* MOBILE */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>

//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) =>
//                 setMobile(e.target.value)
//               }
//               maxLength={10}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* LOCATION */}

//           <div className="md:col-span-2">

//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>

//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) =>
//                 setLocation(e.target.value)
//               }
//               rows={4}
//               className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* GST */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>

//             <select
//               value={gstType}
//               onChange={(e) =>
//                 setGstType(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
//             >

//               <option value="">
//                 Select GST Type
//               </option>

//               <option value="with-gst">
//                 With GST
//               </option>

//               <option value="without-gst">
//                 Without GST
//               </option>

//             </select>

//           </div>

//         </div>

//         {/* ==================================================
//             ITEM TABLE
//         ================================================== */}

//         {gstType && (

//           <div className="mt-8">

//             {/* ADD */}

//             <div className="mb-4">

//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//               >
//                 + Add
//               </button>

//             </div>

//             {/* TABLE */}

//             <div className="overflow-x-auto">

//               <table className="w-full min-w-[950px] border-collapse border border-gray-300">

//                 {/* HEADER */}

//                 <thead>

//                   <tr className="bg-gray-100">

//                     <th className="border border-gray-300 px-3 py-3 text-left">
//                       Item
//                     </th>

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       QTY
//                     </th>

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Price
//                     </th>

//                     {/* ONE GST FIELD */}

//                     {gstType === "with-gst" && (

//                       <th className="border border-gray-300 px-3 py-3 text-right">
//                         GST 18%
//                       </th>

//                     )}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Amount
//                     </th>

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       Action
//                     </th>

//                   </tr>

//                 </thead>

//                 {/* BODY */}

//                 <tbody>

//                   {items.map((row) => {

//                     const rowSubtotal =
//                       row.qty * row.price;

//                     // Row GST 18%
//                     const rowGst =
//                       gstType === "with-gst"
//                         ? rowSubtotal * 0.18
//                         : 0;

//                     const rowAmount =
//                       rowSubtotal + rowGst;

//                     return (

//                       <tr key={row.id}>

//                         {/* ITEM */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="text"
//                             placeholder="Enter Item"
//                             value={row.item}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "item",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* QTY */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="1"
//                             value={row.qty}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "qty",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* PRICE */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="0"
//                             value={row.price}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "price",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* GST 18% */}

//                         {gstType === "with-gst" && (

//                           <td className="border border-gray-300 px-3 py-2 text-right">

//                             ₹{rowGst.toFixed(2)}

//                           </td>

//                         )}

//                         {/* AMOUNT */}

//                         <td className="border border-gray-300 px-3 py-2 text-right font-medium">

//                           ₹{rowAmount.toFixed(2)}

//                         </td>

//                         {/* ACTION */}

//                         <td className="border border-gray-300 p-2 text-center">

//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleDeleteRow(row.id)
//                             }
//                             className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                           >
//                             Delete
//                           </button>

//                         </td>

//                       </tr>

//                     );

//                   })}

//                 </tbody>

//               </table>

//             </div>

//             {/* ==================================================
//                 TOTAL SECTION
//             ================================================== */}

//             <div className="mt-5 flex justify-end">

//               <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">

//                 {/* SUBTOTAL */}

//                 <div className="mb-2 flex justify-between">

//                   <span className="text-gray-600">
//                     Subtotal
//                   </span>

//                   <span className="font-medium">
//                     ₹{subtotal.toFixed(2)}
//                   </span>

//                 </div>

//                 {/* CGST 9% */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       CGST 9%
//                     </span>

//                     <span className="font-medium">
//                       ₹{cgst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}

//                 {/* SGST 9% */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       SGST 9%
//                     </span>

//                     <span className="font-medium">
//                       ₹{sgst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}

//                 {/* TOTAL */}

//                 <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">

//                   <span>
//                     Total Amount
//                   </span>

//                   <span>
//                     ₹{totalAmount.toFixed(2)}
//                   </span>

//                 </div>

//               </div>

//             </div>

//           </div>

//         )}

//         {/* ==================================================
//             SAVE
//         ================================================== */}

//         <div className="mt-8 flex justify-end">

//           <button
//             type="button"
//             onClick={handleSave}
//             className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700"
//           >
//             Save
//           </button>

//         </div>

//       </div>

//     </main>
//   );
// }

// "use client";

// import { useState } from "react";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// export default function Home() {
//   // ==================================================
//   // CURRENT DATE
//   // ==================================================

//   const getCurrentDate = () => {
//     return new Date().toISOString().split("T")[0];
//   };

//   // ==================================================
//   // CUSTOMER DETAILS
//   // ==================================================

//   const [quoteNo, setQuoteNo] = useState("QT-0001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // ==================================================
//   // GST
//   // ==================================================

//   const [gstType, setGstType] = useState("");

//   // ==================================================
//   // ITEMS
//   // ==================================================

//   const [items, setItems] = useState<ItemRow[]>([
//     {
//       id: 1,
//       item: "",
//       qty: 1,
//       price: 0,
//     },
//   ]);

//   // ==================================================
//   // NEW QUOTATION
//   // ==================================================

//   const handleNew = () => {
//     setQuoteNo("QT-0001");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");

//     setItems([
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // ==================================================
//   // SHOW
//   // ==================================================

//   const handleShow = () => {
//     console.log("Quotation Details");

//     console.log({
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       gst,
//       totalAmount,
//     });
//   };

//   // ==================================================
//   // ADD ITEM ROW
//   // ==================================================

//   const handleAddRow = () => {
//     const newRow: ItemRow = {
//       id: Date.now(),
//       item: "",
//       qty: 1,
//       price: 0,
//     };

//     setItems((previousItems) => [
//       ...previousItems,
//       newRow,
//     ]);
//   };

//   // ==================================================
//   // DELETE ITEM ROW
//   // ==================================================

//   const handleDeleteRow = (id: number) => {
//     setItems((previousItems) =>
//       previousItems.filter((item) => item.id !== id)
//     );
//   };

//   // ==================================================
//   // UPDATE ITEM ROW
//   // ==================================================

//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string | number
//   ) => {
//     setItems((previousItems) =>
//       previousItems.map((row) =>
//         row.id === id
//           ? {
//               ...row,
//               [field]: value,
//             }
//           : row
//       )
//     );
//   };

//   // ==================================================
//   // CALCULATIONS
//   // ==================================================

//   // Subtotal
//   const subtotal = items.reduce(
//     (total, row) =>
//       total + row.qty * row.price,
//     0
//   );

//   // GST 18%
//   const gst =
//     gstType === "with-gst"
//       ? subtotal * 0.18
//       : 0;

//   // Total Amount
//   const totalAmount =
//     subtotal + gst;

//   // ==================================================
//   // SAVE
//   // ==================================================

//   const handleSave = () => {
//     if (!name.trim()) {
//       alert("Please enter Name");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type");
//       return;
//     }

//     const quotation = {
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       gst,
//       totalAmount,
//     };

//     console.log(
//       "Saved Quotation:",
//       quotation
//     );

//     alert(
//       "Quotation saved successfully!"
//     );
//   };

//   // ==================================================
//   // UI
//   // ==================================================

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">

//       {/* ==================================================
//           TOP BUTTONS
//       ================================================== */}

//       <div className="mb-5 flex justify-end gap-4">

//         {/* NEW */}

//         <button
//           type="button"
//           onClick={handleNew}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700"
//         >
//           New
//         </button>

//         {/* SHOW */}

//         <button
//           type="button"
//           onClick={handleShow}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700"
//         >
//           Show
//         </button>

//       </div>

//       {/* ==================================================
//           QUOTATION FORM
//       ================================================== */}

//       <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">

//         {/* ==================================================
//             TITLE
//         ================================================== */}

//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           Quotation Form
//         </h1>

//         {/* ==================================================
//             CUSTOMER DETAILS
//         ================================================== */}

//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

//           {/* ==================================================
//               QUOTE NUMBER
//           ================================================== */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>

//             <input
//               type="text"
//               value={quoteNo}
//               onChange={(e) =>
//                 setQuoteNo(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* ==================================================
//               DATE
//           ================================================== */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>

//             <input
//               type="date"
//               value={date}
//               onChange={(e) =>
//                 setDate(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* ==================================================
//               NAME
//           ================================================== */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>

//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) =>
//                 setName(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* ==================================================
//               MOBILE NUMBER
//           ================================================== */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>

//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) =>
//                 setMobile(e.target.value)
//               }
//               maxLength={10}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* ==================================================
//               LOCATION
//           ================================================== */}

//           <div className="md:col-span-2">

//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>

//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) =>
//                 setLocation(e.target.value)
//               }
//               rows={4}
//               className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* ==================================================
//               GST DROPDOWN
//           ================================================== */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>

//             <select
//               value={gstType}
//               onChange={(e) =>
//                 setGstType(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
//             >

//               <option value="">
//                 Select GST Type
//               </option>

//               <option value="with-gst">
//                 With GST
//               </option>

//               <option value="without-gst">
//                 Without GST
//               </option>

//             </select>

//           </div>

//         </div>

//         {/* ==================================================
//             ITEM TABLE
//         ================================================== */}

//         {gstType && (

//           <div className="mt-8">

//             {/* ==================================================
//                 ADD BUTTON
//             ================================================== */}

//             <div className="mb-4">

//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//               >
//                 + Add
//               </button>

//             </div>

//             {/* ==================================================
//                 TABLE
//             ================================================== */}

//             <div className="overflow-x-auto">

//               <table className="w-full min-w-[950px] border-collapse border border-gray-300">

//                 {/* ==================================================
//                     TABLE HEADER
//                 ================================================== */}

//                 <thead>

//                   <tr className="bg-gray-100">

//                     {/* ITEM */}

//                     <th className="border border-gray-300 px-3 py-3 text-left">
//                       Item
//                     </th>

//                     {/* QTY */}

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       QTY
//                     </th>

//                     {/* PRICE */}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Price
//                     </th>

//                     {/* GST 18% */}

//                     {gstType === "with-gst" && (

//                       <th className="border border-gray-300 px-3 py-3 text-right">
//                         GST 18%
//                       </th>

//                     )}

//                     {/* AMOUNT */}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Amount
//                     </th>

//                     {/* ACTION */}

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       Action
//                     </th>

//                   </tr>

//                 </thead>

//                 {/* ==================================================
//                     TABLE BODY
//                 ================================================== */}

//                 <tbody>

//                   {items.map((row) => {

//                     // Row Subtotal
//                     const rowSubtotal =
//                       row.qty * row.price;

//                     // Row GST 18%
//                     const rowGst =
//                       gstType === "with-gst"
//                         ? rowSubtotal * 0.18
//                         : 0;

//                     // Row Amount
//                     const rowAmount =
//                       rowSubtotal + rowGst;

//                     return (

//                       <tr key={row.id}>

//                         {/* ==================================================
//                             ITEM
//                         ================================================== */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="text"
//                             placeholder="Enter Item"
//                             value={row.item}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "item",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* ==================================================
//                             QTY
//                         ================================================== */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="1"
//                             value={row.qty}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "qty",
//                                 Number(
//                                   e.target.value
//                                 )
//                               )
//                             }
//                             className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* ==================================================
//                             PRICE
//                         ================================================== */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="0"
//                             value={row.price}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "price",
//                                 Number(
//                                   e.target.value
//                                 )
//                               )
//                             }
//                             className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* ==================================================
//                             GST 18%
//                         ================================================== */}

//                         {gstType === "with-gst" && (

//                           <td className="border border-gray-300 px-3 py-2 text-right">

//                             ₹
//                             {rowGst.toFixed(2)}

//                           </td>

//                         )}

//                         {/* ==================================================
//                             AMOUNT
//                         ================================================== */}

//                         <td className="border border-gray-300 px-3 py-2 text-right font-medium">

//                           ₹
//                           {rowAmount.toFixed(2)}

//                         </td>

//                         {/* ==================================================
//                             DELETE
//                         ================================================== */}

//                         <td className="border border-gray-300 p-2 text-center">

//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleDeleteRow(
//                                 row.id
//                               )
//                             }
//                             className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                           >
//                             Delete
//                           </button>

//                         </td>

//                       </tr>

//                     );

//                   })}

//                 </tbody>

//               </table>

//             </div>

//             {/* ==================================================
//                 TOTAL
//             ================================================== */}

//             <div className="mt-5 flex justify-end">

//               <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">

//                 {/* ==================================================
//                     SUBTOTAL
//                 ================================================== */}

//                 <div className="mb-2 flex justify-between">

//                   <span className="text-gray-600">
//                     Subtotal
//                   </span>

//                   <span className="font-medium">
//                     ₹
//                     {subtotal.toFixed(2)}
//                   </span>

//                 </div>

//                 {/* ==================================================
//                     GST 18%
//                 ================================================== */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       GST 18%
//                     </span>

//                     <span className="font-medium">
//                       ₹
//                       {gst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}

//                 {/* ==================================================
//                     TOTAL AMOUNT
//                 ================================================== */}

//                 <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">

//                   <span>
//                     Total Amount
//                   </span>

//                   <span>
//                     ₹
//                     {totalAmount.toFixed(2)}
//                   </span>

//                 </div>

//               </div>

//             </div>

//           </div>

//         )}

//         {/* ==================================================
//             SAVE BUTTON
//         ================================================== */}

//         <div className="mt-8 flex justify-end">

//           <button
//             type="button"
//             onClick={handleSave}
//             className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700"
//           >
//             Save
//           </button>

//         </div>

//       </div>

//     </main>
//   );
// }



// "use client";

// import { useState } from "react";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// export default function Home() {
//   // ==================================================
//   // CURRENT DATE
//   // ==================================================

//   const getCurrentDate = () => {
//     return new Date().toISOString().split("T")[0];
//   };

//   // ==================================================
//   // CUSTOMER DETAILS
//   // ==================================================

//   const [quoteNo, setQuoteNo] = useState("QT-0001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // ==================================================
//   // GST
//   // ==================================================

//   const [gstType, setGstType] = useState("");

//   // ==================================================
//   // ITEMS
//   // ==================================================

//   const [items, setItems] = useState<ItemRow[]>([
//     {
//       id: 1,
//       item: "",
//       qty: 1,
//       price: 0,
//     },
//   ]);

//   // ==================================================
//   // NEW QUOTATION
//   // ==================================================

//   const handleNew = () => {
//     setQuoteNo("QT-0001");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");

//     setItems([
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // ==================================================
//   // SHOW
//   // ==================================================

//   const handleShow = () => {
//     console.log("Quotation Details");

//     console.log({
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       gst,
//       totalAmount,
//     });
//   };

//   // ==================================================
//   // ADD ITEM ROW
//   // ==================================================

//   const handleAddRow = () => {
//     const newRow: ItemRow = {
//       id: Date.now(),
//       item: "",
//       qty: 1,
//       price: 0,
//     };

//     setItems((previousItems) => [
//       ...previousItems,
//       newRow,
//     ]);
//   };

//   // ==================================================
//   // DELETE ITEM ROW
//   // ==================================================

//   const handleDeleteRow = (id: number) => {
//     setItems((previousItems) =>
//       previousItems.filter((item) => item.id !== id)
//     );
//   };

//   // ==================================================
//   // UPDATE ITEM ROW
//   // ==================================================

//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string | number
//   ) => {
//     setItems((previousItems) =>
//       previousItems.map((row) =>
//         row.id === id
//           ? {
//               ...row,
//               [field]: value,
//             }
//           : row
//       )
//     );
//   };

//   // ==================================================
//   // CALCULATIONS
//   // ==================================================

//   // Subtotal
//   const subtotal = items.reduce(
//     (total, row) => total + row.qty * row.price,
//     0
//   );

//   // GST 18%
//   const gst =
//     gstType === "with-gst"
//       ? subtotal * 0.18
//       : 0;

//   // Total
//   const totalAmount = subtotal + gst;

//   // ==================================================
//   // SAVE
//   // ==================================================

//   const handleSave = () => {
//     if (!name.trim()) {
//       alert("Please enter Name");
//       return;
//     }

//     if (!mobile.trim()) {
//       alert("Please enter Mobile Number");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type");
//       return;
//     }

//     const quotation = {
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       gst,
//       totalAmount,
//     };

//     console.log("Saved Quotation:", quotation);

//     alert("Quotation saved successfully!");
//   };

//   // ==================================================
//   // PAGE
//   // ==================================================

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">

//       {/* ==================================================
//           TOP BUTTONS
//       ================================================== */}

//       <div className="mb-5 flex justify-end gap-4">

//         {/* NEW */}

//         <button
//           type="button"
//           onClick={handleNew}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700"
//         >
//           New
//         </button>

//         {/* SHOW */}

//         <button
//           type="button"
//           onClick={handleShow}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700"
//         >
//           Show
//         </button>

//       </div>

//       {/* ==================================================
//           QUOTATION FORM
//       ================================================== */}

//       <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">

//         {/* TITLE */}

//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           Quotation Form
//         </h1>

//         {/* ==================================================
//             CUSTOMER DETAILS
//         ================================================== */}

//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

//           {/* QUOTE NUMBER */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>

//             <input
//               type="text"
//               value={quoteNo}
//               onChange={(e) =>
//                 setQuoteNo(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* DATE */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>

//             <input
//               type="date"
//               value={date}
//               onChange={(e) =>
//                 setDate(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* NAME */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>

//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) =>
//                 setName(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* MOBILE NUMBER */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>

//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) =>
//                 setMobile(e.target.value)
//               }
//               maxLength={10}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* LOCATION */}

//           <div className="md:col-span-2">

//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>

//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) =>
//                 setLocation(e.target.value)
//               }
//               rows={4}
//               className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />

//           </div>

//           {/* GST DROPDOWN */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>

//             <select
//               value={gstType}
//               onChange={(e) =>
//                 setGstType(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
//             >

//               <option value="">
//                 Select GST Type
//               </option>

//               <option value="with-gst">
//                 With GST
//               </option>

//               <option value="without-gst">
//                 Without GST
//               </option>

//             </select>

//           </div>

//         </div>

//         {/* ==================================================
//             ITEM TABLE
//         ================================================== */}

//         {gstType && (

//           <div className="mt-8">

//             {/* ADD BUTTON */}

//             <div className="mb-4">

//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//               >
//                 + Add
//               </button>

//             </div>

//             {/* TABLE */}

//             <div className="overflow-x-auto">

//               <table className="w-full min-w-[950px] border-collapse border border-gray-300">

//                 {/* TABLE HEADER */}

//                 <thead>

//                   <tr className="bg-gray-100">

//                     {/* ITEM */}

//                     <th className="border border-gray-300 px-3 py-3 text-left">
//                       Item
//                     </th>

//                     {/* QTY */}

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       QTY
//                     </th>

//                     {/* PRICE */}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Price
//                     </th>

//                     {/* GST 18% */}

//                     {gstType === "with-gst" && (

//                       <th className="border border-gray-300 px-3 py-3 text-right">
//                         GST 18%
//                       </th>

//                     )}

//                     {/* AMOUNT */}

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Amount
//                     </th>

//                     {/* ACTION */}

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       Action
//                     </th>

//                   </tr>

//                 </thead>

//                 {/* TABLE BODY */}

//                 <tbody>

//                   {items.map((row) => {

//                     // Row subtotal

//                     const rowSubtotal =
//                       row.qty * row.price;

//                     // Row GST 18%

//                     const rowGst =
//                       gstType === "with-gst"
//                         ? rowSubtotal * 0.18
//                         : 0;

//                     // Row total

//                     const rowAmount =
//                       rowSubtotal + rowGst;

//                     return (

//                       <tr key={row.id}>

//                         {/* ITEM */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="text"
//                             placeholder="Enter Item"
//                             value={row.item}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "item",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* QTY */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="1"
//                             value={row.qty}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "qty",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* PRICE */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="0"
//                             value={row.price}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "price",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
//                           />

//                         </td>

//                         {/* GST 18% */}

//                         {gstType === "with-gst" && (

//                           <td className="border border-gray-300 px-3 py-2 text-right">

//                             ₹{rowGst.toFixed(2)}

//                           </td>

//                         )}

//                         {/* AMOUNT */}

//                         <td className="border border-gray-300 px-3 py-2 text-right font-medium">

//                           ₹{rowAmount.toFixed(2)}

//                         </td>

//                         {/* DELETE */}

//                         <td className="border border-gray-300 p-2 text-center">

//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleDeleteRow(row.id)
//                             }
//                             className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                           >
//                             Delete
//                           </button>

//                         </td>

//                       </tr>

//                     );

//                   })}

//                 </tbody>

//               </table>

//             </div>

//             {/* ==================================================
//                 TOTAL
//             ================================================== */}

//             <div className="mt-5 flex justify-end">

//               <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">

//                 {/* SUBTOTAL */}

//                 <div className="mb-2 flex justify-between">

//                   <span className="text-gray-600">
//                     Subtotal
//                   </span>

//                   <span className="font-medium">
//                     ₹{subtotal.toFixed(2)}
//                   </span>

//                 </div>

//                 {/* GST 18% */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       GST 18%
//                     </span>

//                     <span className="font-medium">
//                       ₹{gst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}

//                 {/* TOTAL */}

//                 <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">

//                   <span>
//                     Total Amount
//                   </span>

//                   <span>
//                     ₹{totalAmount.toFixed(2)}
//                   </span>

//                 </div>

//               </div>

//             </div>

//           </div>

//         )}

//         {/* ==================================================
//             SAVE BUTTON
//         ================================================== */}

//         <div className="mt-8 flex justify-end">

//           <button
//             type="button"
//             onClick={handleSave}
//             className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700"
//           >
//             Save
//           </button>

//         </div>

//       </div>

//     </main>
//   );
// }

// "use client";

// import { useState } from "react";

// type ItemRow = {
//   id: number;
//   item: string;
//   qty: number;
//   price: number;
// };

// export default function Home() {
//   // Current date
//   const getCurrentDate = () => {
//     return new Date().toISOString().split("T")[0];
//   };

//   // Customer details
//   const [quoteNo, setQuoteNo] = useState("QT-0001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // GST
//   const [gstType, setGstType] = useState("");

//   // Items
//   const [items, setItems] = useState<ItemRow[]>([
//     {
//       id: 1,
//       item: "",
//       qty: 1,
//       price: 0,
//     },
//   ]);

//   // --------------------------------------------------
//   // NEW QUOTATION
//   // --------------------------------------------------

//   const handleNew = () => {
//     setQuoteNo("QT-0001");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//     setGstType("");

//     setItems([
//       {
//         id: Date.now(),
//         item: "",
//         qty: 1,
//         price: 0,
//       },
//     ]);
//   };

//   // --------------------------------------------------
//   // SHOW
//   // --------------------------------------------------

//   const handleShow = () => {
//     console.log("Quotation Details");

//     console.log({
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//     });
//   };

//   // --------------------------------------------------
//   // ADD ITEM ROW
//   // --------------------------------------------------

//   const handleAddRow = () => {
//     const newRow: ItemRow = {
//       id: Date.now(),
//       item: "",
//       qty: 1,
//       price: 0,
//     };

//     setItems((previousItems) => [
//       ...previousItems,
//       newRow,
//     ]);
//   };

//   // --------------------------------------------------
//   // DELETE ITEM ROW
//   // --------------------------------------------------

//   const handleDeleteRow = (id: number) => {
//     setItems((previousItems) =>
//       previousItems.filter((item) => item.id !== id)
//     );
//   };

//   // --------------------------------------------------
//   // UPDATE ITEM ROW
//   // --------------------------------------------------

//   const handleItemChange = (
//     id: number,
//     field: "item" | "qty" | "price",
//     value: string | number
//   ) => {
//     setItems((previousItems) =>
//       previousItems.map((row) =>
//         row.id === id
//           ? {
//               ...row,
//               [field]: value,
//             }
//           : row
//       )
//     );
//   };

//   // --------------------------------------------------
//   // CALCULATIONS
//   // --------------------------------------------------

//   const subtotal = items.reduce(
//     (total, row) =>
//       total + row.qty * row.price,
//     0
//   );

//   const cgst =
//     gstType === "with-gst"
//       ? subtotal * 0.09
//       : 0;

//   const sgst =
//     gstType === "with-gst"
//       ? subtotal * 0.09
//       : 0;

//   const totalAmount =
//     subtotal + cgst + sgst;

//   // --------------------------------------------------
//   // SAVE
//   // --------------------------------------------------

//   const handleSave = () => {
//     if (!name) {
//       alert("Please enter Name");
//       return;
//     }

//     if (!mobile) {
//       alert("Please enter Mobile Number");
//       return;
//     }

//     if (!gstType) {
//       alert("Please select GST Type");
//       return;
//     }

//     const quotation = {
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//       gstType,
//       items,
//       subtotal,
//       cgst,
//       sgst,
//       totalAmount,
//     };

//     console.log("Saved Quotation:", quotation);

//     alert("Quotation saved successfully!");
//   };

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">

//       {/* ==================================================
//           TOP BUTTONS
//       ================================================== */}

//       <div className="mb-5 flex justify-end gap-4">

//         <button
//           type="button"
//           onClick={handleNew}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700"
//         >
//           New
//         </button>

//         <button
//           type="button"
//           onClick={handleShow}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700"
//         >
//           Show
//         </button>

//       </div>


//       {/* ==================================================
//           QUOTATION FORM
//       ================================================== */}

//       <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">

//         {/* Title */}

//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           Quotation Form
//         </h1>


//         {/* ==================================================
//             CUSTOMER DETAILS
//         ================================================== */}

//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


//           {/* Quote Number */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>

//             <input
//               type="text"
//               value={quoteNo}
//               onChange={(e) =>
//                 setQuoteNo(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>


//           {/* Date */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>

//             <input
//               type="date"
//               value={date}
//               onChange={(e) =>
//                 setDate(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>


//           {/* Name */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>

//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) =>
//                 setName(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>


//           {/* Mobile Number */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>

//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) =>
//                 setMobile(e.target.value)
//               }
//               maxLength={10}
//               className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />

//           </div>


//           {/* ==================================================
//               LOCATION
//           ================================================== */}

//           <div className="md:col-span-2">

//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>

//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) =>
//                 setLocation(e.target.value)
//               }
//               rows={4}
//               className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />

//           </div>


//           {/* ==================================================
//               GST DROPDOWN
//           ================================================== */}

//           <div>

//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>

//             <select
//               value={gstType}
//               onChange={(e) =>
//                 setGstType(e.target.value)
//               }
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
//             >

//               <option value="">
//                 Select GST Type
//               </option>

//               <option value="with-gst">
//                 With GST
//               </option>

//               <option value="without-gst">
//                 Without GST
//               </option>

//             </select>

//           </div>

//         </div>


//         {/* ==================================================
//             ITEM TABLE
//         ================================================== */}

//         {gstType && (

//           <div className="mt-8">

//             {/* ADD BUTTON */}

//             <div className="mb-4">

//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
//               >
//                 + Add
//               </button>

//             </div>


//             {/* TABLE */}

//             <div className="overflow-x-auto">

//               <table className="w-full min-w-[950px] border-collapse border border-gray-300">

//                 {/* TABLE HEADER */}

//                 <thead>

//                   <tr className="bg-gray-100">

//                     <th className="border border-gray-300 px-3 py-3 text-left">
//                       Item
//                     </th>

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       QTY
//                     </th>

//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Price
//                     </th>


//                     {/* WITH GST ONLY */}

//                     {gstType === "with-gst" && (
//                       <>

//                         <th className="border border-gray-300 px-3 py-3 text-right">
//                           CGST 9%
//                         </th>

//                         <th className="border border-gray-300 px-3 py-3 text-right">
//                           SGST 9%
//                         </th>

//                       </>
//                     )}


//                     <th className="border border-gray-300 px-3 py-3 text-right">
//                       Amount
//                     </th>

//                     <th className="border border-gray-300 px-3 py-3 text-center">
//                       Action
//                     </th>

//                   </tr>

//                 </thead>


//                 {/* TABLE BODY */}

//                 <tbody>

//                   {items.map((row) => {

//                     const rowSubtotal =
//                       row.qty * row.price;

//                     const rowCgst =
//                       gstType === "with-gst"
//                         ? rowSubtotal * 0.09
//                         : 0;

//                     const rowSgst =
//                       gstType === "with-gst"
//                         ? rowSubtotal * 0.09
//                         : 0;

//                     const rowAmount =
//                       rowSubtotal +
//                       rowCgst +
//                       rowSgst;


//                     return (

//                       <tr key={row.id}>


//                         {/* ITEM */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="text"
//                             placeholder="Enter Item"
//                             value={row.item}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "item",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//                           />

//                         </td>


//                         {/* QTY */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="1"
//                             value={row.qty}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "qty",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
//                           />

//                         </td>


//                         {/* PRICE */}

//                         <td className="border border-gray-300 p-2">

//                           <input
//                             type="number"
//                             min="0"
//                             value={row.price}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 row.id,
//                                 "price",
//                                 Number(e.target.value)
//                               )
//                             }
//                             className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
//                           />

//                         </td>


//                         {/* CGST */}

//                         {gstType === "with-gst" && (

//                           <td className="border border-gray-300 px-3 py-2 text-right">

//                             ₹{rowCgst.toFixed(2)}

//                           </td>

//                         )}


//                         {/* SGST */}

//                         {gstType === "with-gst" && (

//                           <td className="border border-gray-300 px-3 py-2 text-right">

//                             ₹{rowSgst.toFixed(2)}

//                           </td>

//                         )}


//                         {/* AMOUNT */}

//                         <td className="border border-gray-300 px-3 py-2 text-right font-medium">

//                           ₹{rowAmount.toFixed(2)}

//                         </td>


//                         {/* DELETE */}

//                         <td className="border border-gray-300 p-2 text-center">

//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleDeleteRow(row.id)
//                             }
//                             className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                           >
//                             Delete
//                           </button>

//                         </td>

//                       </tr>

//                     );

//                   })}

//                 </tbody>

//               </table>

//             </div>


//             {/* ==================================================
//                 TOTAL
//             ================================================== */}

//             <div className="mt-5 flex justify-end">

//               <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">


//                 {/* SUBTOTAL */}

//                 <div className="mb-2 flex justify-between">

//                   <span className="text-gray-600">
//                     Subtotal
//                   </span>

//                   <span className="font-medium">
//                     ₹{subtotal.toFixed(2)}
//                   </span>

//                 </div>


//                 {/* CGST */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       CGST 9%
//                     </span>

//                     <span className="font-medium">
//                       ₹{cgst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}


//                 {/* SGST */}

//                 {gstType === "with-gst" && (

//                   <div className="mb-2 flex justify-between">

//                     <span className="text-gray-600">
//                       SGST 9%
//                     </span>

//                     <span className="font-medium">
//                       ₹{sgst.toFixed(2)}
//                     </span>

//                   </div>

//                 )}


//                 {/* TOTAL */}

//                 <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">

//                   <span>
//                     Total Amount
//                   </span>

//                   <span>
//                     ₹{totalAmount.toFixed(2)}
//                   </span>

//                 </div>

//               </div>

//             </div>

//           </div>

//         )}


//         {/* ==================================================
//             SAVE BUTTON
//         ================================================== */}

//         <div className="mt-8 flex justify-end">

//           <button
//             type="button"
//             onClick={handleSave}
//             className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700"
//           >
//             Save
//           </button>

//         </div>

//       </div>

//     </main>
//   );
// }



// "use client";

// import { useState } from "react";

// export default function Home() {
//   const getCurrentDate = () => {
//     return new Date().toISOString().split("T")[0];
//   };

//   const [quoteNo, setQuoteNo] = useState("QT-0001");
//   const [date, setDate] = useState(getCurrentDate());
//   const [name, setName] = useState("");
//   const [location, setLocation] = useState("");
//   const [mobile, setMobile] = useState("");

//   // New button
//   const handleNew = () => {
//     setQuoteNo("QT-0001");
//     setDate(getCurrentDate());
//     setName("");
//     setLocation("");
//     setMobile("");
//   };

//   // Show button
//   const handleShow = () => {
//     // Form is already visible
//     console.log("Show quotation");
//   };

//   const handleSave = () => {
//     const quotation = {
//       quoteNo,
//       date,
//       name,
//       location,
//       mobile,
//     };

//     console.log(quotation);

//     alert("Quotation saved successfully!");
//   };

//   return (
//     <main className="min-h-screen bg-gray-100 p-6">

//       {/* Top Right New / Show Buttons */}

//       {/* Top Right Buttons */}
//       <div className="mb-4 flex justify-end gap-4">
//         <button
//           onClick={handleNew}
//           className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 text-white hover:bg-blue-700"
//         >
//           New
//         </button>

//         <button
//           onClick={handleShow}
//           className="rounded-md border border-green-600 bg-green-600 px-7 py-2 text-white hover:bg-green-700"
//         >
//           Show
//         </button>
//       </div>



//       {/* Quotation Form - Automatically Visible */}
//       <div className="mx-auto max-w-4xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">

//         {/* Form Title */}
//         <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
//           Quotation Form
//         </h1>

//         {/* Fields */}
//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

//           {/* Quote No */}
//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Quote No
//             </label>

//             <input
//               type="text"
//               value={quoteNo}
//               onChange={(e) => setQuoteNo(e.target.value)}
//               className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           {/* Date */}
//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Date
//             </label>

//             <input
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           {/* Name */}
//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Name
//             </label>

//             <input
//               type="text"
//               placeholder="Enter Name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>

//           {/* Mobile Number */}
//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               Mobile Number
//             </label>

//             <input
//               type="tel"
//               placeholder="Enter Mobile Number"
//               value={mobile}
//               onChange={(e) => setMobile(e.target.value)}
//               maxLength={10}
//               className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//             />
//           </div>


//           {/* Location */}
//           <div className="md:col-span-2">
//             <label className="mb-1 block font-medium text-gray-700">
//               Location
//             </label>

//             <textarea
//               placeholder="Enter Location"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               rows={4}
//               className="w-full resize-none rounded border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
//             />
//           </div>


//           {/* GST Type */}
//           <div>
//             <label className="mb-1 block font-medium text-gray-700">
//               GST
//             </label>

//             <select
//               className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
//               defaultValue=""
//             >
//               <option value="" disabled>
//                 Select GST Type
//               </option>

//               <option value="with-gst">
//                 With GST
//               </option>

//               <option value="without-gst">
//                 Without GST
//               </option>
//             </select>
//           </div>



//         </div>

//         {/* Save Button */}
//         <div className="mt-6 flex justify-end">
//           <button
//             onClick={handleSave}
//             className="rounded bg-purple-600 px-8 py-2 font-medium text-white hover:bg-purple-700"
//           >
//             Save
//           </button>
//         </div>

//       </div>
//     </main>
//   );
// }

