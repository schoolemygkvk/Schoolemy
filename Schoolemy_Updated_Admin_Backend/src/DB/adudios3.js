import { S3Client } from "@aws-sdk/client-s3";

// On Lambda: always use IAM role (no explicit credentials) - more secure, no key rotation
// Local dev: use S3_* or AWS_* env vars when set
const isLambda = process.env.NODE_ENV === "lambda";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

const s3Config = {
  region: process.env.AWS_REGION || "ap-south-1",
};

// Lambda: never use explicit credentials - IAM role has S3 access
// Local: use credentials only when both are set
if (!isLambda && accessKeyId && secretAccessKey) {
  s3Config.credentials = { accessKeyId, secretAccessKey };
}

const s3 = new S3Client(s3Config);
export default s3;
