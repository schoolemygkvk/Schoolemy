

const SCHEMA_VERSIONS = {
  Course: 2, // Current version
  Wishlist: 1,
  Progress: 1,
  // Add more as needed
};

const CourseMigrations = {
  // Migrate from v1 (coursename) to v2 (title + coursename)
  1: (doc) => {
    if (!doc.title && doc.coursename) {
      doc.title = doc.coursename;
    }
    doc.schemaVersion = 2;
    return doc;
  },
};


export const migrateDocument = (document, modelName, currentVersion) => {
  if (!document) return document;

  const docVersion = document.schemaVersion || 0;
  const migrations = CourseMigrations[modelName] || {};

  // Apply migrations sequentially
  let migratedDoc = { ...document.toObject ? document.toObject() : document };

  for (let v = docVersion; v < currentVersion; v++) {
    if (migrations[v]) {
      migratedDoc = migrations[v](migratedDoc);
    }
  }

  return migratedDoc;
};


export const createAutoMigrateMiddleware = (modelName, targetVersion) => {
  return function (next) {
    // For findOne, find, etc.
    const originalExec = this.exec;

    this.exec = async function () {
      const results = await originalExec.call(this);

      if (!results) return results;

      if (Array.isArray(results)) {
        return results.map((doc) =>
          migrateDocument(doc, modelName, targetVersion),
        );
      }

      return migrateDocument(results, modelName, targetVersion);
    };

    next();
  };
};


export const createVersioningPreSave = (targetVersion) => {
  return function (next) {
    if (!this.schemaVersion) {
      this.schemaVersion = targetVersion;
    }
    next();
  };
};


export const batchMigrate = async (Model, modelName, targetVersion, batchSize = 100) => {
  let processed = 0;
  let migrated = 0;
  let errors = 0;

  try {
    // Find all documents that need migration
    const query = {
      $or: [
        { schemaVersion: { $lt: targetVersion } },
        { schemaVersion: { $exists: false } },
      ],
    };

    let continueLoop = true;
    let skip = 0;

    while (continueLoop) {
      const documents = await Model.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean();

      if (documents.length === 0) {
        continueLoop = false;
        break;
      }

      for (const doc of documents) {
        try {
          const migratedDoc = migrateDocument(doc, modelName, targetVersion);
          await Model.updateOne(
            { _id: doc._id },
            { $set: migratedDoc },
          );
          migrated++;
        } catch (err) {
          logger.error(`Error migrating document ${doc._id}:`, err);
          errors++;
        }
        processed++;
      }

      skip += batchSize;
      logger.debug(
        `Migrated: ${processed} documents (${migrated} updated, ${errors} errors)`,
      );
    }

    return {
      total: processed,
      migrated,
      errors,
      success: errors === 0,
    };
  } catch (error) {
    logger.error("Batch migration failed:", error);
    return {
      total: processed,
      migrated,
      errors: errors + 1,
      success: false,
      error: error.message,
    };
  }
};


export const createFlexibleSchema = (fieldDefinitions = {}) => {
  const baseSchema = {
    schemaVersion: { type: Number, default: 1 },
    ...fieldDefinitions,
    // Allow any additional fields
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  };

  return baseSchema;
};


export const getFlexibleField = (doc, fieldPath, defaultValue = undefined) => {
  const parts = fieldPath.split(".");
  let current = doc;

  for (const part of parts) {
    if (current == null) return defaultValue;
    current = current[part];
  }

  return current !== undefined ? current : defaultValue;
};


export const setFlexibleField = (doc, fieldPath, value) => {
  const parts = fieldPath.split(".");
  let current = doc;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
  return doc;
};

export default {
  SCHEMA_VERSIONS,
  migrateDocument,
  createAutoMigrateMiddleware,
  createVersioningPreSave,
  batchMigrate,
  createFlexibleSchema,
  getFlexibleField,
  setFlexibleField,
};
