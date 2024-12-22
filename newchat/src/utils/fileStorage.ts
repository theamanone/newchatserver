import FormData from "form-data";
import axios from "axios";

export async function uploadFileToAPI(file: File | Blob) {
  try {
    // Convert File/Blob to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create form data
    const form = new FormData();
    form.append("file", buffer, {
      filename: (file as File).name || 'file',
      contentType: file.type || 'application/octet-stream'
    });

    const response = await axios.post(
      `${process.env.NEXT_BUCKET_BASE_URL}/api/storage/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          "x-api-key": process.env.NEXTBUCKET_API_KEY!,
          "x-user-name": process.env.NEXTBUCKET_CLOUD_NAME!,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error uploading file:", error.message || error);
    throw error;
  }
}

export async function deleteFileFromAPI(fileUrl: string) {
  try {
    const response = await axios.delete(
      `${process.env.NEXT_BUCKET_BASE_URL}/api/storage/delete/file?fileName=${fileUrl}`,
      {
        headers: {
          "x-api-key": process.env.NEXTBUCKET_API_KEY!,
          "x-user-name": process.env.NEXTBUCKET_CLOUD_NAME!,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error deleting file:", error.message || error);
    throw error;
  }
}
