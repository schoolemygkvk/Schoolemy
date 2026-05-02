import React, { useEffect, useState, useCallback } from "react";
import axios from "../../../Utils/api";
import { getToken } from "../../../Hooks/useToken";
import { useNavigate } from "react-router-dom";

const STATUSES = ["draft", "scheduled", "active", "paused", "completed"];

const MarketingCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    integrationWebhookUrl: "",
  });

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await axios.get("/api/marketing/campaigns", authHeaders());
      setCampaigns(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await axios.post(
        "/api/marketing/campaigns",
        {
          name: form.name.trim(),
          description: form.description.trim(),
          status: "draft",
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          integrationWebhookUrl: form.integrationWebhookUrl.trim() || undefined,
        },
        authHeaders()
      );
      setMessage("Campaign created.");
      setForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        integrationWebhookUrl: "",
      });
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const patchStatus = async (id, status) => {
    setError("");
    try {
      await axios.patch(
        `/api/marketing/campaigns/${id}/status`,
        { status },
        authHeaders()
      );
      setMessage(`Status set to ${status}`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Status update failed");
    }
  };

  const removeCampaign = async (id) => {
    if (!window.confirm("Delete this campaign? Ads will be unlinked.")) return;
    try {
      await axios.delete(`/api/marketing/campaigns/${id}`, authHeaders());
      setMessage("Campaign deleted");
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
        padding: "2rem 1.25rem",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            marginBottom: 16,
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>

        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
          Ad campaigns
        </h1>
        <p style={{ color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
          Plan lifecycle (draft → scheduled → active → paused / completed). Optional HTTPS webhook URL
          receives a JSON POST when status changes (Zapier, Slack, or your automation).
        </p>

        {message && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#dcfce7",
              color: "#166534",
              marginBottom: 16,
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#fee2e2",
              color: "#991b1b",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "1.5rem",
            marginBottom: 28,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: 16 }}>New campaign</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="Campaign name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={inp}
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{ ...inp, resize: "vertical" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                style={inp}
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                style={inp}
              />
            </div>
            <input
              placeholder="Integration webhook URL (https only, optional)"
              value={form.integrationWebhookUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, integrationWebhookUrl: e.target.value }))
              }
              style={inp}
            />
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Create draft campaign"}
            </button>
          </div>
        </form>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading…</p>
        ) : campaigns.length === 0 ? (
          <p style={{ color: "#64748b" }}>No campaigns yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {campaigns.map((c) => (
              <div
                key={c._id}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "1.25rem 1.5rem",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>{c.name}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                      Status: <strong>{c.status}</strong>
                      {c.adCount != null && (
                        <>
                          {" "}
                          · {c.adCount} ad(s) · {c.totalImpressions ?? 0} impressions ·{" "}
                          {c.totalClicks ?? 0} clicks
                        </>
                      )}
                    </div>
                    {c.description ? (
                      <p style={{ margin: "8px 0 0", color: "#475569", fontSize: "0.9rem" }}>
                        {c.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCampaign(c._id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={c.status === st}
                      onClick={() => patchStatus(c._id, st)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border:
                          c.status === st
                            ? "2px solid #4f46e5"
                            : "1px solid #cbd5e1",
                        background: c.status === st ? "#eef2ff" : "#fff",
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                        cursor: c.status === st ? "default" : "pointer",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const inp = {
  width: "100%",
  maxWidth: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

export default MarketingCampaigns;
