export const CONFIG = {
  API_BASE:
    import.meta.env.VITE_API_BASE || "https://insuremeserver.onrender.com",
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
  USE_MOCK: import.meta.env.VITE_USE_MOCK === "true",
};
