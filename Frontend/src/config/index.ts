// Backend API base URL from the frontend .env file
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_URL is missing. Please define it in your Frontend/.env file."
  );
}

export const config = {
  appName: "Student 360°",

  api: {
    baseUrl: API_BASE_URL,
    authPrefix: "/api/auth",
  },
} as const;