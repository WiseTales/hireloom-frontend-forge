# HireLoom Path-Based Routing MVP

## 🎯 Goal
Refactor the platform to use standard path parameters for multi-tenancy, removing the complexity of subdomains and wildcard DNS.

## 🏗️ Architecture
- **Next.js 15 App Router**: Utilizing dynamic route segments.
- **Dynamic Routing**: `app/careers/[company]/page.tsx` handles all company-specific career portals.
- **Simplified Deployment**: Works on any hosting provider out-of-the-box.

## 🛠️ Implementation Details
1. **Dynamic Segment (`[company]`)**:
   - The folder `app/careers/[company]` captures the company name from the URL.
   - Example: `/careers/nexacore` -> `params.company` is `nexacore`.

2. **Careers Page Component**:
   - Reads `params` from the route.
   - Displays "Hello World" and the identified company.
   - Clean, minimalistic UI built with TailwindCSS.

3. **Cleanup**:
   - Removed `middleware.ts` (subdomain logic).
   - Removed `vercel.json` (unnecessary routing rules).
   - Maintains zero database dependency for the MVP.

## 🚀 Usage
- Visit `/careers/nexacore`
- Visit `/careers/acme`
- Visit `/careers/test`
