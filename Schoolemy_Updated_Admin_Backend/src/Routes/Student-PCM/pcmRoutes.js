import express from "express";
import {
  createPostclass,
  listPostclasses,
  updatePostclass,
  deletePostclass,
} from "../../Controllers/Student-PCM/PCM-controllers.js";
import {
  getAllSubjects,
  getSubjectByCode,
  createSubject,
  updateSubject,
  deleteSubject,
  seedDefaultSubjects,
} from "../../Controllers/Student-PCM/SubjectController.js";

const router = express.Router();

// ============ Subject Routes (Dynamic Subject Management) ============
// Register static paths before /subjects/:code so "seed" is never captured as a code.

router.get("/subjects", getAllSubjects);

router.post("/subjects", createSubject);

// Seed must be registered before GET /subjects/:code (otherwise GET /subjects/seed would match :code = "seed")
router.post("/subjects/seed", seedDefaultSubjects);

router.get("/subjects/:code", getSubjectByCode);

router.put("/subjects/:id", updateSubject);

router.delete("/subjects/:id", deleteSubject);

// ============ PCM Class Routes ============

router.post("/classes", createPostclass);

router.get("/classes-all", listPostclasses);

router.put("/classes/:id", updatePostclass);

router.delete("/classes/:id", deletePostclass);

export default router;
