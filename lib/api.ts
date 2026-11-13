
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed: ${response.status}`
    );
  }

  return result;
}


// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// export async function apiRequest(
//   endpoint: string,
//   options: RequestInit = {}
// ) {
//   const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...options.headers,
//     },
//   });

//   const result = await response.json().catch(() => null);

//   if (!response.ok) {
//     throw new Error(
//       result?.message || `Request failed: ${response.status}`
//     );
//   }

//   return result;
// }

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// export async function apiRequest(
//   endpoint: string,
//   options: RequestInit = {}
// ) {
//   if (!API_BASE_URL) {
//     throw new Error("API URL is missing in .env.local");
//   }

//   const response = await fetch(
//     `${API_BASE_URL}${endpoint}`,
//     {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     }
//   );

//   const result = await response.json().catch(() => null);

//   if (!response.ok) {
//     throw new Error(
//       result?.message ||
//         `API request failed with status ${response.status}`
//     );
//   }

//   return result;
// }
