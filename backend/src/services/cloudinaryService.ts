import { v2 as cloudinary } from "cloudinary";

// Lazy init — dotenv hasn't run yet at import time
let configured = false;
function ensureConfig() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
    console.log("[Cloudinary] Configured with cloud:", process.env.CLOUDINARY_CLOUD_NAME);
  }
}

export interface ScreenshotUrls {
  desktop: string;
}

async function uploadBuffer(buffer: Buffer, publicId: string): Promise<string> {
  ensureConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "dental-leads/screenshots",
        resource_type: "image",
        format: "jpg",
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function uploadScreenshots(
  desktopBuffer: Buffer,
  leadId: string
): Promise<ScreenshotUrls> {
  try {
    const desktop = await uploadBuffer(desktopBuffer, `${leadId}-desktop`);
    return { desktop };
  } catch (error) {
    console.error(`Cloudinary upload failed for lead ${leadId}:`, error);
    return { desktop: "" };
  }
}
