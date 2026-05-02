#!/usr/bin/env node



import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Running dependency security audit...\n');

try {
  // Run npm audit with JSON output
  const auditOutput = execSync('npm audit --json 2>&1', {
    cwd: projectRoot,
    encoding: 'utf-8',
  });

  const audit = JSON.parse(auditOutput);

  // Extract vulnerability data
  const metadata = audit.metadata || {};
  const vulnerabilities = audit.vulnerabilities || {};

  console.log('📊 Audit Summary:');
  console.log(`   Total packages: ${metadata.totalDependencies || 'Unknown'}`);
  console.log(`   Vulnerabilities found: ${metadata.vulnerabilities || 0}`);
  console.log(`   Critical: ${metadata.audit?.metadata?.vulnerabilities?.critical || 0}`);
  console.log(`   High: ${metadata.audit?.metadata?.vulnerabilities?.high || 0}`);
  console.log(`   Medium: ${metadata.audit?.metadata?.vulnerabilities?.medium || 0}`);
  console.log(`   Low: ${metadata.audit?.metadata?.vulnerabilities?.low || 0}`);

  // List vulnerabilities
  if (Object.keys(vulnerabilities).length > 0) {
    console.log('\n🚨 Vulnerabilities Details:\n');

    // Group by severity
    const bySeverity = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const [pkg, vulnData] of Object.entries(vulnerabilities)) {
      if (vulnData.severity) {
        const severity = vulnData.severity.toLowerCase();
        if (bySeverity[severity]) {
          bySeverity[severity].push({ pkg, ...vulnData });
        }
      }
    }

    // Display critical vulnerabilities
    if (bySeverity.critical.length > 0) {
      console.log('🔴 CRITICAL (FIX IMMEDIATELY):');
      bySeverity.critical.forEach((vuln) => {
        console.log(`   - ${vuln.pkg}: ${vuln.via || 'Unknown vulnerability'}`);
        if (vuln.fixAvailable) {
          console.log(`     Fix: npm install ${vuln.pkg}@${vuln.fixAvailable.version}`);
        }
      });
      console.log();
    }

    // Display high severity vulnerabilities
    if (bySeverity.high.length > 0) {
      console.log('🟠 HIGH (FIX SOON):');
      bySeverity.high.forEach((vuln) => {
        console.log(`   - ${vuln.pkg}: ${vuln.via || 'Unknown vulnerability'}`);
        if (vuln.fixAvailable) {
          console.log(`     Fix: npm install ${vuln.pkg}@${vuln.fixAvailable.version}`);
        }
      });
      console.log();
    }

    // Display medium/low (summary)
    const mediumLow = bySeverity.medium.length + bySeverity.low.length;
    if (mediumLow > 0) {
      console.log(
        `🟡 MEDIUM/LOW: ${mediumLow} issues (review in next sprint)`
      );
    }
  } else {
    console.log('\n✅ No known vulnerabilities found!');
  }

  // Generate report file
  const reportPath = path.join(projectRoot, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2));
  console.log(`\n📄 Full report saved to: audit-report.json`);

  // Exit with error if critical vulnerabilities exist
  if ((metadata.audit?.metadata?.vulnerabilities?.critical || 0) > 0) {
    console.log('\n❌ CRITICAL VULNERABILITIES FOUND - BLOCKING DEPLOYMENT');
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error('❌ Error running audit:', error.message);
  process.exit(1);
}
