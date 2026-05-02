import { useState, useEffect, useMemo } from "react";
import api from "../Utils/api";


export function usePcmSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // api client automatically handles httpOnly cookie in requests
        const res = await api.get("/api/pcm/subjects");
        if (!cancelled && res.data?.success) {
          setSubjects(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch {
        if (!cancelled) setSubjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const subjectNamesSentence = useMemo(() => {
    const names = subjects.map((s) => s.name).filter(Boolean);
    if (names.length === 0) return "Physics, Chemistry, and Mathematics";
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }, [subjects]);

  const subjectByCode = useMemo(() => {
    const m = {};
    subjects.forEach((s) => {
      if (s.code) m[String(s.code).toLowerCase()] = s;
    });
    return m;
  }, [subjects]);

  return { subjects, loading, subjectNamesSentence, subjectByCode };
}

export function subjectColor(subjectByCode, code) {
  if (!code) return "#666";
  const s = subjectByCode[String(code).toLowerCase()];
  return s?.color || "#666";
}

export function subjectLabel(subjectByCode, code) {
  if (!code) return "—";
  const k = String(code).toLowerCase();
  const s = subjectByCode[k];
  if (s?.name) return s.name;
  return k.charAt(0).toUpperCase() + k.slice(1);
}

export function subjectAvatarLetter(subjectByCode, code) {
  const label = subjectLabel(subjectByCode, code);
  return label && label !== "—" ? label.charAt(0).toUpperCase() : "?";
}
