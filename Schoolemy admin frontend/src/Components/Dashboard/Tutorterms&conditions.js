import React, { useEffect, useRef, useState } from "react";
import api from "../../Utils/api";
import { useNavigate } from "react-router-dom";
import { secureStorage } from "../../Utils/security";

const normalizeIsApproved = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    (typeof value === "string" && value.trim().toLowerCase() === "true")
  );
};

const TutorTermsAndConditions = ({ onApproved }) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const acceptBtnRef = useRef(null);
  const modalRef = useRef(null);

  // If user already approved, redirect immediately
  useEffect(() => {
    try {
      // Prefer secureStorage (source of truth for login state)
      const secureApproved = normalizeIsApproved(secureStorage.getItem("isApproved"));
      if (secureApproved) {
        navigate("/schoolemy/tutor/dashboard", { replace: true });
        return;
      }
    } catch (err) {
      console.error("Error checking user approval", err);
    }
  }, [navigate]);

  // Prevent background scrolling and keep focus inside modal
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // simple focus trap: keep focus on modal container
    const handleKey = (e) => {
      if (e.key === "Escape") {
        // don't allow closing with Escape — require acceptance
        e.preventDefault();
      }
      if (e.key === "Tab") {
        // keep focus within modal (basic)
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    // set initial focus
    setTimeout(() => {
      const focusEl = acceptBtnRef.current || modalRef.current;
      if (focusEl) focusEl.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleApprove = async () => {
    if (!accepted) {
      setMessage("Please accept the agreement to proceed.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Token is stored via secureStorage (obfuscated in localStorage)
      const token = secureStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found. Please log in again.");

      const res = await api.patch("/approve-tutor", {}, { headers: { Authorization: `Bearer ${token}` } });

      if (res?.data?.success) {
        // update secureStorage so refreshes are consistent
        secureStorage.setItem("isApproved", "true");

        if (typeof onApproved === "function") onApproved(res.data.tutor);

        setMessage("Terms accepted. Redirecting to your dashboard...");
        // navigate without back history
        navigate("/schoolemy/tutor/dashboard", { replace: true });
      } else {
        setMessage(res?.data?.message || "Unexpected response received.");
      }
    } catch (err) {
      console.error("Approve request failed", err);
      setMessage(err?.response?.data?.message || err.message || "Failed to send approval request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="tutor-terms-title"
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
    >
      <style>{`
        .ttc-backdrop {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(6,21,47,0.75), rgba(6,21,47,0.85));
          backdrop-filter: blur(6px);
          display:flex;
          align-items: center;
          justify-content: center;
        }
        .ttc-card {
          width: 92%;
          max-width: 1000px;
          max-height: 92vh;
          background: linear-gradient(180deg, #ffffff, #fbfdff);
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(8,30,63,0.45);
          padding: 26px;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 18px;
          outline: none;
        }
        .ttc-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
        }
        .ttc-brand {
          display:flex;
          gap:12px;
          align-items:center;
        }
        .ttc-logo {
          width:56px;
          height:56px;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:700;
          color:#0b3b6f;
          background:linear-gradient(180deg,#e6f0ff,#dbeeff);
          box-shadow: 0 6px 18px rgba(11,59,111,0.08);
        }
        .ttc-title {
          font-size:20px;
          font-weight:700;
          color:#05223c;
        }
        .ttc-sub {
          font-size:13px;
          color:#556a82;
        }
        .ttc-content {
          overflow:auto;
          padding:18px;
          border-radius:10px;
          border:1px solid rgba(8,30,63,0.06);
          background: linear-gradient(180deg, rgba(250,252,255,0.9), rgba(248,249,252,0.9));
        }
        .ttc-content h3 {
          margin: 12px 0 6px;
          font-size:16px;
          color:#0b3b6f;
        }
        .ttc-content p, .ttc-content li {
          color:#243b4f;
          line-height:1.5;
          font-size:14px;
        }
        .ttc-footer {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
        }
        .ttc-actions {
          display:flex;
          gap:12px;
          align-items:center;
        }
        .ttc-btn {
          padding:10px 16px;
          border-radius:8px;
          border:none;
          font-weight:600;
          cursor:pointer;
          font-size:14px;
        }
        .ttc-btn-accept {
          background: linear-gradient(90deg,#0366d6,#0b84f2);
          color:#fff;
          box-shadow: 0 8px 18px rgba(11,132,242,0.18);
        }
        .ttc-btn-disabled {
          background:#d7dbe0;
          color:#6b7280;
          cursor:not-allowed;
        }
        .ttc-checkbox {
          display:flex;
          align-items:center;
          gap:10px;
          font-size:14px;
          color:#17324a;
        }
        .ttc-note {
          font-size:13px;
          color:#4b5968;
        }

        /* Responsive */
        @media (max-width:600px) {
          .ttc-title { font-size:18px; }
          .ttc-logo { width:48px; height:48px; }
        }
      `}</style>

      <div className="ttc-backdrop">
        <div
          className="ttc-card"
          ref={modalRef}
          tabIndex={-1}
          aria-describedby="tutor-terms-desc"
        >
          <div className="ttc-header">
            <div className="ttc-brand">
              <div className="ttc-logo">S</div>
              <div>
                <div id="tutor-terms-title" className="ttc-title">
                  Tutor — Company Policy & Agreement
                </div>
                <div className="ttc-sub">Schoolemy — Terms for uploading & selling courses</div>
              </div>
            </div>

            <div className="ttc-note" aria-hidden>
              By accepting you agree to our terms. This modal blocks other actions until accepted.
            </div>
          </div>

          <div id="tutor-terms-desc" className="ttc-content" role="document">
            <h3>1. Revenue Sharing</h3>
            <ol>
              <li>The Tutor shall receive <strong>30% of the net course fee</strong> (including taxes) for every successful student purchase.</li>
              <li>The Company shall retain <strong>70% of the net course fee</strong>, which covers platform maintenance, marketing, transaction processing, and administrative costs.</li>
              <li>All taxes, including GST and applicable levies, are included in the Tutor’s 30% share.</li>
            </ol>

            <h3>2. Tutor Requirements</h3>
            <ol>
              <li>The Tutor must provide a <strong>2-minute demo video</strong> introducing the course.</li>
              <li>A detailed course description with objectives, structure, and outcomes.</li>
              <li>A professional tutor picture for profile display.</li>
              <li>Details of the Tutor’s educational qualifications and skills.</li>
              <li>The completed course content in approved video, audio, or document format.</li>
              <li>The Tutor is solely responsible for the accuracy, authenticity, originality, and maintenance of their course content.</li>
            </ol>

            <h3>3. Payment Terms</h3>
            <ol>
              <li>Tutor payments shall be released once every <strong>15 days</strong>.</li>
              <li>Payments will be made via bank transfer or other approved payment methods, after deducting any applicable processing fees.</li>
              <li>The Company is not liable for delays caused by incorrect banking details provided by the Tutor.</li>
            </ol>

            <h3>4. Content Ownership & License</h3>
            <ol>
              <li>The Tutor retains full ownership of their original course content.</li>
              <li>By uploading content, the Tutor grants Schoolemy a non-exclusive, worldwide license to host, market, distribute, and make the course available to students through the platform.</li>
              <li>The Tutor agrees not to upload any content that is illegal, harmful, defamatory, discriminatory, or violates intellectual property laws.</li>
            </ol>

            <h3>5. Marketing & Promotion</h3>
            <ol>
              <li>The Company reserves the right to market, promote, and discount courses to attract students.</li>
              <li>Discounts, offers, and promotions applied by the Company shall not alter the agreed revenue share percentage (30% Tutor / 70% Company).</li>
            </ol>

            <h3>6. Tutor Conduct & Responsibilities</h3>
            <ol>
              <li>The Tutor shall maintain professional behavior and uphold academic integrity.</li>
              <li>The Tutor shall not engage in spamming, misleading marketing, or unethical practices, contact students outside the platform for unauthorized transactions, or share false/misleading information.</li>
            </ol>

            <h3>7. Course Approval & Removal</h3>
            <ol>
              <li>All courses are subject to review and approval by the Company before publishing.</li>
              <li>The Company reserves the right to remove or suspend any course that fails to meet platform quality standards, violates copyright/legal/ethical guidelines, or receives repeated complaints or poor ratings from students.</li>
            </ol>

            <h3>8. Termination of Agreement</h3>
            <ol>
              <li>Either party may terminate this Agreement with <strong>30 days’ written notice</strong>.</li>
              <li>The Company reserves the right to immediately terminate the Tutor’s account in case of fraudulent activities, intellectual property infringement, or violation of platform policies or legal obligations.</li>
            </ol>

            <h3>9. Limitation of Liability</h3>
            <p>The Company shall not be held liable for loss of income due to low course sales, technical issues, server downtime, third-party service interruptions, or any legal dispute arising from false or misleading tutor information.</p>

            <h3>10. Governing Law</h3>
            <p>The Agreement shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the jurisdiction of the courts in [Your City/State].</p>

            <h3>11. Acceptance</h3>
            <p>By registering as a Tutor on Schoolemy, the Tutor acknowledges that they have read, understood, and agreed to all the terms and conditions of this Agreement.</p>
          </div>

          <div className="ttc-footer">
            <label className="ttc-checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  setMessage(null);
                }}
                disabled={loading}
                aria-label="I have read and accept the Terms and Conditions"
              />
              <span>I have read and accept the Terms &amp; Conditions</span>
            </label>

            <div className="ttc-actions">
              <div style={{ marginRight: 8 }} className="ttc-note">
                {message || "Payments every 15 days · 30% revenue share for tutors."}
              </div>

              <button
                ref={acceptBtnRef}
                onClick={handleApprove}
                disabled={!accepted || loading}
                className={`ttc-btn ${accepted && !loading ? "ttc-btn-accept" : "ttc-btn-disabled"}`}
                aria-disabled={!accepted || loading}
              >
                {loading ? "Saving..." : "Accept & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorTermsAndConditions;
