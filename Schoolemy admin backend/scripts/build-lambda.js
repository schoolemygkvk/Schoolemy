// Lambda Build Script - Creates deployment package
import { createWriteStream, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function buildLambdaPackage() {
  console.log('\n🔨 Building Lambda deployment package...\n');
  
  const terraformDir = join(projectRoot, 'terraform');
  const outputPath = join(terraformDir, 'lambda.zip');
  
  // Ensure terraform directory exists
  if (!existsSync(terraformDir)) {
    mkdirSync(terraformDir, { recursive: true });
  }
  
  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Lambda package created: ${sizeMB} MB`);
      console.log(`   Location: ${outputPath}\n`);
      
      if (parseFloat(sizeMB) > 50) {
        console.log('⚠️  Warning: Package exceeds 50MB direct upload limit.');
        console.log('   S3 upload will be used (configured in Terraform)\n');
      }
      
      resolve();
    });
    
    archive.on('error', (err) => {
      console.error('❌ Archive error:', err);
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add files to archive
    const filesToInclude = [
      'handler.js',
      'server.js',
      'package.json'
    ];
    
    const dirsToInclude = [
      'src',
      'node_modules'
    ];
    
    // Add individual files
    filesToInclude.forEach(file => {
      const filePath = join(projectRoot, file);
      if (existsSync(filePath)) {
        console.log(`  Adding: ${file}`);
        archive.file(filePath, { name: file });
      } else {
        console.log(`  ⚠️ Missing: ${file}`);
      }
    });
    
    // Add directories
    dirsToInclude.forEach(dir => {
      const dirPath = join(projectRoot, dir);
      if (existsSync(dirPath)) {
        console.log(`  Adding: ${dir}/`);
        archive.directory(dirPath, dir);
      } else {
        console.log(`  ⚠️ Missing: ${dir}/`);
      }
    });
    
    archive.finalize();
  });
}

buildLambdaPackage().catch(console.error);
