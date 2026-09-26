

"use client";

import { useState } from "react";

type ItemRow = {
  id: number;
  item: string;
  qty: number;
  price: number;
};

export default function Home() {
  // ==================================================
  // CURRENT DATE
  // ==================================================

  const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // ==================================================
  // CUSTOMER DETAILS
  // ==================================================

  const [quoteNo, setQuoteNo] = useState("QT-0001");
  const [date, setDate] = useState(getCurrentDate());
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [mobile, setMobile] = useState("");

  // ==================================================
  // GST TYPE
  // ==================================================

  const [gstType, setGstType] = useState("");

  // ==================================================
  // ITEMS
  // ==================================================

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: 1,
      item: "",
      qty: 1,
      price: 0,
    },
  ]);

  // ==================================================
  // NEW QUOTATION
  // ==================================================

  const handleNew = () => {
    setQuoteNo("QT-0001");
    setDate(getCurrentDate());
    setName("");
    setLocation("");
    setMobile("");
    setGstType("");

    setItems([
      {
        id: Date.now(),
        item: "",
        qty: 1,
        price: 0,
      },
    ]);
  };

  // ==================================================
  // SHOW
  // ==================================================

  const handleShow = () => {
    console.log("Quotation Details");

    console.log({
      quoteNo,
      date,
      name,
      location,
      mobile,
      gstType,
      items,
      subtotal,
      cgst,
      sgst,
      gstTotal,
      totalAmount,
    });
  };

  // ==================================================
  // ADD ITEM ROW
  // ==================================================

  const handleAddRow = () => {
    const newRow: ItemRow = {
      id: Date.now(),
      item: "",
      qty: 1,
      price: 0,
    };

    setItems((previousItems) => [
      ...previousItems,
      newRow,
    ]);
  };

  // ==================================================
  // DELETE ITEM ROW
  // ==================================================

  const handleDeleteRow = (id: number) => {
    setItems((previousItems) =>
      previousItems.filter((row) => row.id !== id)
    );
  };

  // ==================================================
  // UPDATE ITEM ROW
  // ==================================================

  const handleItemChange = (
    id: number,
    field: "item" | "qty" | "price",
    value: string | number
  ) => {
    setItems((previousItems) =>
      previousItems.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  // ==================================================
  // CALCULATIONS
  // ==================================================

  // Subtotal
  const subtotal = items.reduce(
    (total, row) => {
      return total + row.qty * row.price;
    },
    0
  );

  // CGST 9%
  const cgst =
    gstType === "with-gst"
      ? subtotal * 0.09
      : 0;

  // SGST 9%
  const sgst =
    gstType === "with-gst"
      ? subtotal * 0.09
      : 0;

  // GST Total = CGST + SGST
  const gstTotal = cgst + sgst;

  // Total Amount
  const totalAmount =
    subtotal + gstTotal;

  // ==================================================
  // SAVE
  // ==================================================

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter Name");
      return;
    }

    if (!mobile.trim()) {
      alert("Please enter Mobile Number");
      return;
    }

    if (!gstType) {
      alert("Please select GST Type");
      return;
    }

    const quotation = {
      quoteNo,
      date,
      name,
      location,
      mobile,
      gstType,
      items,
      subtotal,
      cgst,
      sgst,
      gstTotal,
      totalAmount,
    };

    console.log(
      "Saved Quotation:",
      quotation
    );

    alert("Quotation saved successfully!");
  };

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      {/* ==================================================
          TOP BUTTONS
      ================================================== */}

      <div className="mb-5 flex justify-end gap-4">

        {/* NEW */}

        <button
          type="button"
          onClick={handleNew}
          className="rounded-md border border-blue-600 bg-blue-600 px-7 py-2 font-medium text-white hover:bg-blue-700"
        >
          New
        </button>

        {/* SHOW */}

        <button
          type="button"
          onClick={handleShow}
          className="rounded-md border border-green-600 bg-green-600 px-7 py-2 font-medium text-white hover:bg-green-700"
        >
          Show
        </button>

      </div>

      {/* ==================================================
          QUOTATION FORM
      ================================================== */}

      <div className="mx-auto max-w-6xl rounded-lg border border-gray-300 bg-white p-6 shadow-md">

        {/* TITLE */}

        <h1 className="mb-6 border-b border-gray-300 pb-4 text-2xl font-bold text-gray-800">
          Quotation Form
        </h1>

        {/* ==================================================
            CUSTOMER DETAILS
        ================================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* QUOTE NO */}

          <div>

            <label className="mb-1 block font-medium text-gray-700">
              Quote No
            </label>

            <input
              type="text"
              value={quoteNo}
              onChange={(e) =>
                setQuoteNo(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />

          </div>

          {/* DATE */}

          <div>

            <label className="mb-1 block font-medium text-gray-700">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />

          </div>

          {/* NAME */}

          <div>

            <label className="mb-1 block font-medium text-gray-700">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />

          </div>

          {/* MOBILE */}

          <div>

            <label className="mb-1 block font-medium text-gray-700">
              Mobile Number
            </label>

            <input
              type="tel"
              placeholder="Enter Mobile Number"
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value)
              }
              maxLength={10}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />

          </div>

          {/* LOCATION */}

          <div className="md:col-span-2">

            <label className="mb-1 block font-medium text-gray-700">
              Location
            </label>

            <textarea
              placeholder="Enter Location"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              rows={4}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
            />

          </div>

          {/* GST */}

          <div>

            <label className="mb-1 block font-medium text-gray-700">
              GST
            </label>

            <select
              value={gstType}
              onChange={(e) =>
                setGstType(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
            >

              <option value="">
                Select GST Type
              </option>

              <option value="with-gst">
                With GST
              </option>

              <option value="without-gst">
                Without GST
              </option>

            </select>

          </div>

        </div>

        {/* ==================================================
            ITEM TABLE
        ================================================== */}

        {gstType && (

          <div className="mt-8">

            {/* ADD BUTTON */}

            <div className="mb-4">

              <button
                type="button"
                onClick={handleAddRow}
                className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
              >
                + Add
              </button>

            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] border-collapse border border-gray-300">

                {/* TABLE HEADER */}

                <thead>

                  <tr className="bg-gray-100">

                    {/* ITEM */}

                    <th className="border border-gray-300 px-3 py-3 text-left">
                      Item
                    </th>

                    {/* QTY */}

                    <th className="border border-gray-300 px-3 py-3 text-center">
                      QTY
                    </th>

                    {/* PRICE */}

                    <th className="border border-gray-300 px-3 py-3 text-right">
                      Price
                    </th>

                    {/* GST 18% */}

                    {gstType === "with-gst" && (

                      <th className="border border-gray-300 px-3 py-3 text-right">
                        GST 18%
                      </th>

                    )}

                    {/* AMOUNT */}

                    <th className="border border-gray-300 px-3 py-3 text-right">
                      Amount
                    </th>

                    {/* ACTION */}

                    <th className="border border-gray-300 px-3 py-3 text-center">
                      Action
                    </th>

                  </tr>

                </thead>

                {/* TABLE BODY */}

                <tbody>

                  {items.map((row) => {

                    // Row subtotal

                    const rowSubtotal =
                      row.qty * row.price;

                    // Row GST 18%

                    const rowGst =
                      gstType === "with-gst"
                        ? rowSubtotal * 0.18
                        : 0;

                    // Row amount

                    const rowAmount =
                      rowSubtotal + rowGst;

                    return (

                      <tr key={row.id}>

                        {/* ITEM */}

                        <td className="border border-gray-300 p-2">

                          <input
                            type="text"
                            placeholder="Enter Item"
                            value={row.item}
                            onChange={(e) =>
                              handleItemChange(
                                row.id,
                                "item",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                          />

                        </td>

                        {/* QTY */}

                        <td className="border border-gray-300 p-2">

                          <input
                            type="number"
                            min="1"
                            value={row.qty}
                            onChange={(e) =>
                              handleItemChange(
                                row.id,
                                "qty",
                                Number(e.target.value)
                              )
                            }
                            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center outline-none focus:border-blue-500"
                          />

                        </td>

                        {/* PRICE */}

                        <td className="border border-gray-300 p-2">

                          <input
                            type="number"
                            min="0"
                            value={row.price}
                            onChange={(e) =>
                              handleItemChange(
                                row.id,
                                "price",
                                Number(e.target.value)
                              )
                            }
                            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-right outline-none focus:border-blue-500"
                          />

                        </td>

                        {/* GST 18% */}

                        {gstType === "with-gst" && (

                          <td className="border border-gray-300 px-3 py-2 text-right">

                            ₹{rowGst.toFixed(2)}

                          </td>

                        )}

                        {/* AMOUNT */}

                        <td className="border border-gray-300 px-3 py-2 text-right font-medium">

                          ₹{rowAmount.toFixed(2)}

                        </td>

                        {/* ACTION */}

                        <td className="border border-gray-300 p-2 text-center">

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteRow(row.id)
                            }
                            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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

            {/* ==================================================
                TOTAL SECTION
            ================================================== */}

            <div className="mt-5 flex justify-end">

              <div className="w-80 rounded-lg border border-gray-300 bg-gray-50 p-5">

                {/* SUBTOTAL */}

                <div className="mb-2 flex justify-between">

                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    ₹{subtotal.toFixed(2)}
                  </span>

                </div>

                {/* CGST 9% */}

                {gstType === "with-gst" && (

                  <div className="mb-2 flex justify-between">

                    <span className="text-gray-600">
                      CGST 9%
                    </span>

                    <span className="font-medium">
                      ₹{cgst.toFixed(2)}
                    </span>

                  </div>

                )}

                {/* SGST 9% */}

                {gstType === "with-gst" && (

                  <div className="mb-2 flex justify-between">

                    <span className="text-gray-600">
                      SGST 9%
                    </span>

                    <span className="font-medium">
                      ₹{sgst.toFixed(2)}
                    </span>

                  </div>

                )}

                {/* GST TOTAL */}

                {gstType === "with-gst" && (

                  <div className="mb-2 flex justify-between border-t border-gray-300 pt-2">

                    <span className="font-medium text-gray-700">
                      GST Total
                    </span>

                    <span className="font-medium">
                      ₹{gstTotal.toFixed(2)}
                    </span>

                  </div>

                )}

                {/* TOTAL AMOUNT */}

                <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">

                  <span>
                    Total Amount
                  </span>

                  <span>
                    ₹{totalAmount.toFixed(2)}
                  </span>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* ==================================================
            SAVE BUTTON
        ================================================== */}

        <div className="mt-8 flex justify-end">

          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-purple-600 px-10 py-2 font-medium text-white hover:bg-purple-700"
          >
            Save
          </button>

        </div>

      </div>

    </main>
  );
}




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

