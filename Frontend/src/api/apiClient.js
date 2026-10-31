/**
 * MakeSite AI - Centralized API Client
 * 
 * Centralizes all HTTP communication with the backend API.
 * Supports configurable base URL, structured error handling, and typed helper methods.
 */

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.detail = data?.detail || data?.error || message;
  }
}

/**
 * Universal request wrapper for fetch with JSON handling and rich error mapping.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const { headers = {}, body, ...customConfig } = options;

  const config = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined && typeof body !== "string") {
    config.body = JSON.stringify(body);
  } else if (body !== undefined) {
    config.body = body;
  }

  const response = await fetch(url, config);

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      data?.detail ||
      data?.error ||
      (typeof data === "string" && data.trim() ? data : `Request failed with status ${response.status}`);
    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Dedicated API Endpoint Methods
// ---------------------------------------------------------------------------

/**
 * Check backend health and Groq API readiness.
 * GET /health
 */
export async function checkHealth() {
  return apiRequest("/health", { method: "GET" });
}

/**
 * Fetch available website templates and themes.
 * GET /templates
 */
export async function getTemplates() {
  return apiRequest("/templates", { method: "GET" });
}

/**
 * Extract structured business information from a natural language prompt/brief.
 * POST /extract
 * @param {string} description - The user description of the business
 */
export async function extractBusinessInfo(description) {
  return apiRequest("/extract", {
    method: "POST",
    body: { description },
  });
}

/**
 * Validates and updates a single missing/ambiguous business field.
 * POST /update-business
 * @param {object} businessData - The current validated business data
 * @param {string} field - The key of the field being clarified (e.g. 'contact')
 * @param {string} value - The clarified answer provided by the user
 */
export async function updateBusinessInfo(businessData, field, value) {
  return apiRequest("/update-business", {
    method: "POST",
    body: {
      business_data: businessData,
      field,
      value,
    },
  });
}

/**
 * Generate full section-by-section marketing copy for the website.
 * POST /generate-content
 * @param {object} businessData - Complete validated business details
 */
export async function generateWebsiteContent(businessData) {
  return apiRequest("/generate-content", {
    method: "POST",
    body: businessData,
  });
}

/**
 * Server-render complete production-ready HTML with responsive CSS and templates.
 * POST /generate-html
 * @param {object} businessData - Complete business data
 * @param {object} content - Section copy (hero, services, features, faqs, etc.)
 * @param {string} templateId - Target template ID (e.g. 'modern-dark')
 */
export async function generateWebsiteHtml(businessData, content, templateId) {
  return apiRequest("/generate-html", {
    method: "POST",
    body: {
      business_data: businessData,
      content,
      template_id: templateId,
    },
  });
}

/**
 * AI-assisted polish and rephrase for any copy section.
 * POST /rephrase-section
 * @param {object} params
 * @param {string} params.section - Section name (hero_title, about, etc.)
 * @param {string} params.text - Original text to polish
 * @param {string} params.businessName - Name of the business
 * @param {string} params.category - Business category
 * @param {string} [params.style] - Tone style (e.g. "modern and punchy")
 */
export async function rephraseSection({
  section,
  text,
  businessName,
  category,
  style = "modern and punchy",
}) {
  return apiRequest("/rephrase-section", {
    method: "POST",
    body: {
      section,
      text,
      business_name: businessName,
      category,
      style,
    },
  });
}

const apiClient = {
  API_BASE_URL,
  ApiError,
  request: apiRequest,
  checkHealth,
  getTemplates,
  extractBusinessInfo,
  updateBusinessInfo,
  generateWebsiteContent,
  generateWebsiteHtml,
  rephraseSection,
};

export default apiClient;
