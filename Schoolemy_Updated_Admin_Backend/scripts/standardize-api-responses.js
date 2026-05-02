#!/usr/bin/env node

/**
 * API Response Standardization Script
 *
 * Automatically converts all controller responses to use the standardized
 * responseHandler functions (sendSuccess, sendError, sendPaginated, etc.)
 *
 * Usage:
 *   node scripts/standardize-api-responses.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run   : Preview changes without writing files
 *   --verbose   : Show detailed logs for each file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const controllersDir = path.join(projectRoot, 'src', 'Controllers');

// Command line flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Stats tracking
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  importsAdded: 0,
  patternsReplaced: 0,
  errors: []
};

const importStatement = 'import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";';

/**
 * Check if file already has the responseHandler import
 */
function hasResponseHandlerImport(content) {
  return content.includes('from "../../Utils/responseHandler.js"') ||
         content.includes('from \'../../Utils/responseHandler.js\'');
}

/**
 * Add responseHandler import to file
 */
function addImport(content, filePath) {
  // Find the last import statement
  const importRegex = /^import\s+.*?from\s+['"][^'"]+['"]\s*;/gm;
  const lastImportMatch = [...content.matchAll(importRegex)].pop();

  if (!lastImportMatch) {
    // No imports found, add at the very beginning
    return importStatement + '\n\n' + content;
  }

  const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
  return content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
}

/**
 * Apply all standardization patterns
 */
function standardizeResponses(content, filePath) {
  let modified = content;
  let replacementCount = 0;

  // Pattern 1: res.status(404).json({ message: "X not found" })
  const pattern1 = /res\.status\(404\)\.json\(\{\s*message:\s*["']([^"']*not found[^"']*)["']\s*\}\);/gi;
  modified = modified.replace(pattern1, (match, msg) => {
    replacementCount++;
    return `sendError(res, 404, "${msg}");`;
  });

  // Pattern 2: res.status(404).json({ success: false, message: "X not found" })
  const pattern2 = /res\.status\(404\)\.json\(\{\s*success:\s*false,\s*message:\s*["']([^"']*)["']\s*\}\);/gi;
  modified = modified.replace(pattern2, (match, msg) => {
    replacementCount++;
    return `sendError(res, 404, "${msg}");`;
  });

  // Pattern 3: return res.status(404).json({ message: "X" })
  const pattern3 = /return\s+res\.status\(404\)\.json\(\{\s*message:\s*["']([^"']*)["']\s*\}\);/gi;
  modified = modified.replace(pattern3, (match, msg) => {
    replacementCount++;
    return `return sendError(res, 404, "${msg}");`;
  });

  // Pattern 4: Validation errors - full block replacement
  const pattern4 = /if\s*\(\s*!errors\.isEmpty\(\)\s*\)\s*\{\s*return\s+res\.status\((?:422|400)\)\.json\(\{\s*success:\s*false,\s*message:\s*["']Validation failed["'],\s*errors:\s*errors\.array\(\)\s*\}\);\s*\}/gi;
  modified = modified.replace(pattern4, (match) => {
    replacementCount++;
    return 'if (!errors.isEmpty()) {\n      return sendValidationError(res, errors.array());\n    }';
  });

  // Pattern 5: res.status(204).send()
  const pattern5 = /res\.status\(204\)\.send\(\);/gi;
  modified = modified.replace(pattern5, (match) => {
    replacementCount++;
    return 'sendNoContent(res);';
  });

  // Pattern 6: res.sendStatus(204)
  const pattern6 = /res\.sendStatus\(204\);/gi;
  modified = modified.replace(pattern6, (match) => {
    replacementCount++;
    return 'sendNoContent(res);';
  });

  // Pattern 7: res.status(201).json({ success: true, data: X })
  const pattern7 = /res\.status\(201\)\.json\(\{\s*success:\s*true,\s*(?:message:\s*["'][^"']*["'],\s*)?data:\s*([^}]+)\}\);/gi;
  modified = modified.replace(pattern7, (match, data) => {
    replacementCount++;
    return `sendSuccess(res, 201, "Created successfully", ${data});`;
  });

  // Pattern 8: res.status(200).json({ success: true, data: X })
  const pattern8 = /res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*([^}]+)\}\);/gi;
  modified = modified.replace(pattern8, (match, data) => {
    replacementCount++;
    return `sendSuccess(res, 200, "Success", ${data});`;
  });

  // Pattern 9: res.json({ success: true, data: X })
  const pattern9 = /res\.json\(\{\s*success:\s*true,\s*data:\s*([^}]+)\}\);/gi;
  modified = modified.replace(pattern9, (match, data) => {
    replacementCount++;
    return `sendSuccess(res, 200, "Success", ${data});`;
  });

  // Pattern 10: res.status(500).json({ error: error.message })
  const pattern10 = /res\.status\(500\)\.json\(\{\s*error:\s*error\.message\s*\}\);/gi;
  modified = modified.replace(pattern10, (match) => {
    replacementCount++;
    return 'sendError(res, 500, "Internal Server Error", { details: error.message });';
  });

  // Pattern 11: res.status(500).json({ message: "X", error: error.message })
  const pattern11 = /res\.status\(500\)\.json\(\{\s*message:\s*["']([^"']*)["'],\s*error:\s*error\.message\s*\}\);/gi;
  modified = modified.replace(pattern11, (match, msg) => {
    replacementCount++;
    return `sendError(res, 500, "${msg}", { details: error.message });`;
  });

  // Pattern 12: res.status(400).json({ success: false, message: "X" })
  const pattern12 = /res\.status\(400\)\.json\(\{\s*success:\s*false,\s*message:\s*["']([^"']*)["']\s*\}\);/gi;
  modified = modified.replace(pattern12, (match, msg) => {
    replacementCount++;
    return `sendError(res, 400, "${msg}");`;
  });

  // Pattern 13: Paginated responses
  const pattern13 = /res\.(?:status\(200\)\.)?json\(\{\s*success:\s*true,\s*(?:message:\s*["'][^"']*["'],\s*)?data:\s*(\w+),\s*pagination:\s*\{[^}]+\}\s*\}\);/gi;
  modified = modified.replace(pattern13, (match) => {
    replacementCount++;
    // Extract variable names - simplified approach
    if (match.includes('pagination: {')) {
      return 'sendPaginated(res, data, total, page, limit, "Items retrieved");';
    }
    return match;
  });

  // Pattern 14: Generic success responses
  const pattern14 = /res\.json\(\{\s*success:\s*true,\s*message:\s*["']([^"']*)["'],\s*data:\s*([^}]+)\}\);/gi;
  modified = modified.replace(pattern14, (match, msg, data) => {
    replacementCount++;
    return `sendSuccess(res, 200, "${msg}", ${data});`;
  });

  return { content: modified, replacementCount };
}

/**
 * Process a single controller file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    stats.filesProcessed++;

    // Check if file is empty or too small
    if (content.trim().length < 50) {
      if (isVerbose) console.log(`  ⊘ Skipped (too small): ${filePath}`);
      return;
    }

    // Skip if it's not a controller
    if (!content.includes('export const') && !content.includes('async')) {
      if (isVerbose) console.log(`  ⊘ Skipped (not a controller): ${filePath}`);
      return;
    }

    // Add import if needed
    if (!hasResponseHandlerImport(content)) {
      content = addImport(content, filePath);
      stats.importsAdded++;
    }

    // Apply standardization patterns
    const { content: standardized, replacementCount } = standardizeResponses(content, filePath);
    stats.patternsReplaced += replacementCount;

    // Check if file was modified
    if (standardized !== originalContent) {
      stats.filesModified++;

      if (isDryRun) {
        console.log(`  ✓ Would modify: ${path.relative(projectRoot, filePath)}`);
        if (isVerbose && replacementCount > 0) {
          console.log(`    → ${replacementCount} response patterns replaced`);
        }
      } else {
        fs.writeFileSync(filePath, standardized, 'utf8');
        console.log(`  ✓ Modified: ${path.relative(projectRoot, filePath)}`);
        if (isVerbose && replacementCount > 0) {
          console.log(`    → ${replacementCount} response patterns replaced`);
        }
      }
    } else {
      if (isVerbose) {
        console.log(`  ◦ No changes: ${path.relative(projectRoot, filePath)}`);
      }
    }
  } catch (error) {
    stats.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`  ✗ Error processing ${path.relative(projectRoot, filePath)}: ${error.message}`);
  }
}

/**
 * Recursively process all controller files
 */
function processDirectory(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        processDirectory(fullPath);
      } else if (file.isFile() && file.name.endsWith('.js')) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 API Response Standardization Script');
  console.log('=====================================\n');

  if (isDryRun) {
    console.log('📋 DRY RUN MODE - No files will be modified\n');
  }

  if (!fs.existsSync(controllersDir)) {
    console.error(`❌ Controllers directory not found: ${controllersDir}`);
    process.exit(1);
  }

  console.log(`📁 Processing controllers in: ${controllersDir}\n`);

  processDirectory(controllersDir);

  // Print summary
  console.log('\n=====================================');
  console.log('📊 Summary');
  console.log('=====================================');
  console.log(`✓ Files processed:      ${stats.filesProcessed}`);
  console.log(`✓ Files modified:       ${stats.filesModified}`);
  console.log(`✓ Imports added:        ${stats.importsAdded}`);
  console.log(`✓ Patterns replaced:    ${stats.patternsReplaced}`);

  if (stats.errors.length > 0) {
    console.log(`✗ Errors encountered:   ${stats.errors.length}`);
    console.log('\nErrors:');
    stats.errors.forEach(err => {
      console.log(`  • ${err.file}: ${err.error}`);
    });
  }

  if (isDryRun) {
    console.log('\n💡 Use without --dry-run to apply changes');
  } else {
    console.log('\n✅ Standardization complete!');
  }

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main();
