import React, { useEffect, useState } from "react";
import axios from "../../../Utils/api";

const TaskManagement = () => {
  const [taskList, setTaskList] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    meeting_id: "",
    assigned_to: "",
    description: "",
    due_date: "",
    status: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [filterStatus, setFilterStatus] = useState("all");

  // Status options
  const statusOptions = [
    { value: "pending", label: "Pending", color: "#f59e0b" },
    { value: "in-progress", label: "In Progress", color: "#3b82f6" },
    { value: "completed", label: "Completed", color: "#10b981" },
    { value: "overdue", label: "Overdue", color: "#ef4444" },
  ];

  // Fetch all tasks
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/gettasks");
      setTaskList(res.data.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setMessage("Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSelect = (task) => {
    setSelectedTask(task);
    setFormData({
      meeting_id: task.meeting_id,
      assigned_to: task.assigned_to,
      description: task.description,
      due_date: task.due_date ? task.due_date.slice(0, 16) : "",
      status: task.status,
    });
    setViewMode("view");
    setMessage("");
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`/deletetask/${taskId}`);
      setMessage("Task deleted successfully");
      fetchTasks();
      setViewMode("list");
      setSelectedTask(null);
    } catch (err) {
      setMessage("Failed to delete task");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/updatetask/${selectedTask.task_id}`, formData);
      setMessage("Task updated successfully");
      fetchTasks();
      setViewMode("list");
      setSelectedTask(null);
    } catch (err) {
      setMessage("Failed to update task");
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await axios.patch(`/updatetask/${taskId}/status`, { status: newStatus });
      setMessage("Task status updated successfully");
      fetchTasks();
    } catch (err) {
      setMessage("Failed to update task status");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    return statusOption ? statusOption.color : "#6b7280";
  };


  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== "completed";
  };

  const filteredTasks = taskList.filter((task) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "overdue") {
      return isOverdue(task.due_date, task.status);
    }
    return task.status === filterStatus;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "2rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 0.5rem 0",
            }}
          >
            Task Management
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#64748b",
              margin: 0,
            }}
          >
            View, update, and manage BOS tasks
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              background: message.includes("successfully")
                ? "#dcfce7"
                : "#fee2e2",
              color: message.includes("successfully") ? "#166534" : "#dc2626",
              border: `1px solid ${
                message.includes("successfully") ? "#bbf7d0" : "#fecaca"
              }`,
            }}
          >
            {message}
          </div>
        )}

        {viewMode === "list" && (
          <>
            {/* Filter Bar */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Filter by status:
              </span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => setFilterStatus("all")}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "2px solid #e5e7eb",
                    background: filterStatus === "all" ? "#667eea" : "white",
                    color: filterStatus === "all" ? "white" : "#374151",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  All ({taskList.length})
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setFilterStatus(status.value)}
                    style={{
                      padding: "0.5rem 1rem",
                      border: `2px solid ${
                        filterStatus === status.value ? status.color : "#e5e7eb"
                      }`,
                      background:
                        filterStatus === status.value ? status.color : "white",
                      color:
                        filterStatus === status.value ? "white" : "#374151",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {status.label} (
                    {taskList.filter((task) => task.status === status.value).length})
                  </button>
                ))}
                <button
                  onClick={() => setFilterStatus("overdue")}
                  style={{
                    padding: "0.5rem 1rem",
                    border: `2px solid ${
                      filterStatus === "overdue" ? "#ef4444" : "#e5e7eb"
                    }`,
                    background:
                      filterStatus === "overdue" ? "#ef4444" : "white",
                    color: filterStatus === "overdue" ? "white" : "#374151",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Overdue (
                  {
                    taskList.filter((task) =>
                      isOverdue(task.due_date, task.status)
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            {/* Task List */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading tasks...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  No tasks found
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Task ID
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Meeting ID
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Assigned To
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Description
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Due Date
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task, index) => {
                        const taskIsOverdue = isOverdue(task.due_date, task.status);
                        return (
                          <tr
                            key={task.task_id}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: taskIsOverdue ? "#fef2f2" : "white",
                            }}
                          >
                            <td
                              style={{
                                padding: "1rem",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                color: "#1e293b",
                              }}
                            >
                              {task.task_id}
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                fontSize: "0.9rem",
                                color: "#64748b",
                              }}
                            >
                              {task.meeting_id}
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                fontSize: "0.9rem",
                                color: "#64748b",
                              }}
                            >
                              {task.assigned_to}
                            </td>
                            <td
                              title={task.description || ""}
                              style={{
                                padding: "1rem",
                                fontSize: "0.9rem",
                                color: "#64748b",
                                maxWidth: "280px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                lineHeight: 1.5,
                              }}
                            >
                              {task.description}
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                fontSize: "0.9rem",
                                color: taskIsOverdue ? "#dc2626" : "#64748b",
                                fontWeight: taskIsOverdue ? "600" : "normal",
                              }}
                            >
                              {new Date(task.due_date).toLocaleDateString()}
                              <br />
                              <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                                {new Date(task.due_date).toLocaleTimeString()}
                              </span>
                            </td>
                            <td style={{ padding: "1rem" }}>
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusUpdate(task.task_id, e.target.value)
                                }
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "0.8rem",
                                  fontWeight: "600",
                                  color: "white",
                                  background: getStatusColor(task.status),
                                  cursor: "pointer",
                                }}
                              >
                                {statusOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                    style={{ color: "black" }}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  justifyContent: "center",
                                }}
                              >
                                <button
                                  onClick={() => handleSelect(task)}
                                  style={{
                                    padding: "0.4rem 0.8rem",
                                    background: "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "0.8rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDelete(task.task_id)}
                                  style={{
                                    padding: "0.4rem 0.8rem",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "0.8rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === "view" && selectedTask && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Task Details & Update
              </h2>
              <button
                onClick={() => {
                  setViewMode("list");
                  setSelectedTask(null);
                  setMessage("");
                }}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Back to List
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Task ID
                  </label>
                  <input
                    type="text"
                    value={selectedTask.task_id}
                    disabled
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      background: "#f9fafb",
                      color: "#6b7280",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Meeting ID *
                  </label>
                  <input
                    type="text"
                    name="meeting_id"
                    value={formData.meeting_id}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      transition: "border-color 0.2s",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Assigned To *
                  </label>
                  <input
                    type="text"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      transition: "border-color 0.2s",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Due Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      transition: "border-color 0.2s",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      transition: "border-color 0.2s",
                      outline: "none",
                      background: "white",
                    }}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={Math.max(8, (formData.description || "").split("\n").length + 2)}
                  style={{
                    width: "100%",
                    minHeight: "180px",
                    padding: "0.75rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    transition: "border-color 0.2s",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    setSelectedTask(null);
                    setMessage("");
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    border: "2px solid #e5e7eb",
                    background: "white",
                    color: "#374151",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>
        {`
          input:focus, textarea:focus, select:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          table tbody tr:hover {
            background-color: #f8fafc !important;
          }
        `}
      </style>
    </div>
  );
};

export default TaskManagement;
