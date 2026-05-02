import React, { useEffect, useState, useCallback } from "react";
import axios from "../../../Utils/api";
import { getToken } from "../../../Hooks/useToken";
import { useNavigate } from "react-router-dom";

const MarketingAdAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await axios.get("/api/advertisements/analytics/summary", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
        padding: "2rem 1.25rem",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
          Ad performance
        </h1>
        <p style={{ color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
          Impressions and clicks are incremented via{" "}
          <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
            POST /api/advertisements/track
          </code>{" "}
          from your landing app (e.g. when the banner is shown or clicked).
        </p>

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

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading…</p>
        ) : t ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 28,
              }}
            >
              <Kpi label="Total ads" value={t.totalAds} />
              <Kpi label="Active" value={t.activeAds} />
              <Kpi label="Impressions" value={t.totalImpressions} />
              <Kpi label="Clicks" value={t.totalClicks} />
              <Kpi label="CTR %" value={t.ctrPercent} />
            </div>

            <section style={section}>
              <h2 style={h2}>Top ads</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Title</th>
                      <th style={th}>Impressions</th>
                      <th style={th}>Clicks</th>
                      <th style={th}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topAds || []).map((ad) => (
                      <tr key={ad._id}>
                        <td style={td}>{ad.title || "—"}</td>
                        <td style={td}>{ad.impressionCount ?? 0}</td>
                        <td style={td}>{ad.clickCount ?? 0}</td>
                        <td style={td}>{ad.is_active ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ ...section, marginTop: 20 }}>
              <h2 style={h2}>By campaign</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Campaign</th>
                      <th style={th}>Ads</th>
                      <th style={th}>Impressions</th>
                      <th style={th}>Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.byCampaign || []).map((row, i) => (
                      <tr key={row.campaignId || `none-${i}`}>
                        <td style={td}>
                          {row.campaignName ||
                            (row.campaignId ? "Unknown" : "Unassigned")}
                        </td>
                        <td style={td}>{row.ads}</td>
                        <td style={td}>{row.impressions}</td>
                        <td style={td}>{row.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

function Kpi({ label, value }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>{label}</div>
    </div>
  );
}

const section = {
  background: "#fff",
  borderRadius: 16,
  padding: "1.25rem",
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const h2 = { fontSize: "1.05rem", marginBottom: 12, color: "#0f172a" };

const table = { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" };
const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "2px solid #e2e8f0",
  color: "#64748b",
};
const td = { padding: "10px 8px", borderBottom: "1px solid #f1f5f9" };

export default MarketingAdAnalytics;
