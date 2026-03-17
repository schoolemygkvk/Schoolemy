import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./FinancialStyles.css";
import {
  createExpense,
  updateExpense,
  getExpense,
} from "../../../Utils/expenseApi";

const ExpenseForm = () => {
  const { expenseId } = useParams();
  const editMode = Boolean(expenseId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Supplies",
    subCategory: "",
    paymentMethod: "Cash",
    transactionId: "",
    vendorName: "",
    vendorContact: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
    status: "Pending",
    department: "",
    isRecurring: false,
    recurringPeriod: "None",
  });

  const fetchExpense = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getExpense(expenseId);
      if (response?.data?.data) {
        const expense = response.data.data;
        setForm({
          title: expense.title || "",
          amount: expense.amount || "",
          category: expense.category || "Supplies",
          subCategory: expense.subCategory || "",
          paymentMethod: expense.paymentMethod || "Cash",
          transactionId: expense.transactionId || "",
          vendorName: expense.vendorName || "",
          vendorContact: expense.vendorContact || "",
          date: expense.date
            ? new Date(expense.date).toISOString().split("T")[0]
            : "",
          dueDate: expense.dueDate
            ? new Date(expense.dueDate).toISOString().split("T")[0]
            : "",
          description: expense.description || "",
          status: expense.status || "Pending",
          department: expense.department || "",
          isRecurring: expense.isRecurring || false,
          recurringPeriod: expense.recurringPeriod || "None",
        });
      }
    } catch (error) {
      console.error("Error fetching expense:", error);
      alert("Failed to fetch expense details");
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    if (editMode) {
      fetchExpense();
    }
  }, [editMode, fetchExpense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode) {
        await updateExpense(expenseId, form);
        alert("Expense updated successfully");
      } else {
        await createExpense(form);
        alert("Expense created successfully");
      }
      navigate("/schoolemy/financial-auditing");
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>
          {editMode ? "Edit Expense" : "Add New Expense"}
        </h2>

        {loading && <div style={styles.loading}>Loading...</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Enter expense title"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Amount (₹) <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={styles.input}
                placeholder="Enter amount"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Category <span style={styles.required}>*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="Salary">Salary</option>
                <option value="Website Maintenance">Website Maintenance</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Utilities">Utilities</option>
                <option value="Supplies">Supplies</option>
                <option value="Marketing">Marketing</option>
                <option value="Events">Events</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Transport">Transport</option>
                <option value="Technology">Technology</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sub Category</label>
              <input
                type="text"
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter sub category"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Payment Method <span style={styles.required}>*</span>
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction ID</label>
              <input
                type="text"
                name="transactionId"
                value={form.transactionId}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter transaction ID"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Vendor Name</label>
              <input
                type="text"
                name="vendorName"
                value={form.vendorName}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter vendor name"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Vendor Contact</label>
              <input
                type="text"
                name="vendorContact"
                value={form.vendorContact}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter vendor contact"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Date <span style={styles.required}>*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Department</label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter department"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={form.isRecurring}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Recurring Expense
              </label>
            </div>

            {form.isRecurring && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Recurring Period</label>
                <select
                  name="recurringPeriod"
                  value={form.recurringPeriod}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="None">None</option>
                </select>
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={styles.textarea}
              placeholder="Enter expense details"
            />
          </div>

          <div style={styles.buttonRow}>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(14, 165, 233, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
              }}
            >
              {editMode ? "Update Expense" : "Create Expense"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={styles.cancelButton}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(108, 117, 125, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.3)';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
    padding: "40px 20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: "36px",
    letterSpacing: "-1px",
    textAlign: "center",
  },
  loading: {
    textAlign: "center",
    padding: "24px",
    fontSize: "16px",
    color: "#666",
    backgroundColor: "#fff",
    borderRadius: "12px",
    marginBottom: "24px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    fontWeight: "600",
  },
  form: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "28px",
    marginBottom: "28px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  required: {
    color: "#ef4444",
    marginLeft: "4px",
  },
  input: {
    padding: "14px 18px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
    fontWeight: "500",
    backgroundColor: "#f9fafb",
  },
  select: {
    padding: "14px 18px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    cursor: "pointer",
    fontWeight: "500",
    backgroundColor: "#f9fafb",
    transition: "all 0.3s ease",
  },
  textarea: {
    padding: "14px 18px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    fontWeight: "500",
    backgroundColor: "#f9fafb",
    transition: "all 0.3s ease",
    minHeight: "120px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
    color: "#374151",
    cursor: "pointer",
    padding: "14px 18px",
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    transition: "all 0.3s ease",
  },
  checkbox: {
    marginRight: "12px",
    width: "20px",
    height: "20px",
    cursor: "pointer",
    accentColor: "#0ea5e9",
  },
  buttonRow: {
    display: "flex",
    gap: "16px",
    marginTop: "36px",
    justifyContent: "center",
  },
  submitButton: {
    padding: "16px 40px",
    background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(14, 165, 233, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minWidth: "200px",
  },
  cancelButton: {
    padding: "16px 40px",
    background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(108, 117, 125, 0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minWidth: "160px",
  },
};

export default ExpenseForm;
