import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BUCKET_NAME = "student-meet-materials";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// CORS configuration for the S3 bucket
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "https://admin.schoolemy.com",
        "https://schoolemy.com",
        "https://www.schoolemy.com"
      ],
      ExposeHeaders: [
        "ETag",
        "x-amz-server-side-encryption",
        "x-amz-request-id",
        "x-amz-id-2"
      ],
      MaxAgeSeconds: 3600
    }
  ]
};

async function setupBucketCors() {
  try {
    console.log(`\n🔧 Setting up CORS for bucket: ${BUCKET_NAME}\n`);

    // First, try to get existing CORS configuration
    try {
      const existingCors = await s3Client.send(
        new GetBucketCorsCommand({ Bucket: BUCKET_NAME })
      );
      console.log("📋 Existing CORS Configuration:");
      console.log(JSON.stringify(existingCors.CORSRules, null, 2));
      console.log("\n");
    } catch (error) {
      if (error.name === "NoSuchCORSConfiguration") {
        console.log("ℹ️  No existing CORS configuration found.\n");
      } else {
        throw error;
      }
    }

    // Apply new CORS configuration
    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);

    console.log("✅ CORS configuration applied successfully!\n");
    console.log("📋 New CORS Configuration:");
    console.log(JSON.stringify(corsConfiguration, null, 2));
    console.log("\n");

    // Verify the configuration
    const newCors = await s3Client.send(
      new GetBucketCorsCommand({ Bucket: BUCKET_NAME })
    );
    console.log("✅ Verification - Current CORS Rules:");
    console.log(JSON.stringify(newCors.CORSRules, null, 2));
    console.log("\n✨ CORS setup completed successfully!\n");

  } catch (error) {
    console.error("❌ Error setting up CORS:", error);
    console.error("\nError Details:");
    console.error(`  Name: ${error.name}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.name === "AccessDenied") {
      console.error("\n⚠️  Access Denied: Your AWS credentials may not have permission to modify bucket CORS.");
      console.error("   Required permissions: s3:PutBucketCORS, s3:GetBucketCORS");
    }
    
    process.exit(1);
  }
}

// Run the setup
console.log("🚀 Starting S3 CORS Configuration Setup...");
console.log(`   Bucket: ${BUCKET_NAME}`);
console.log(`   Region: ${process.env.AWS_REGION || "ap-south-1"}\n`);

setupBucketCors();
