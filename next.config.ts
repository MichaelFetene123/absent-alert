import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Custom Next.js 16 cacheLife profiles tailored to AbsentAlert data domains
  cacheLife: {
    // 1. Attendance: Real-time accuracy critical during school hours (1 min revalidation)
    attendance: {
      stale: 30, // 30s client router cache
      revalidate: 60, // 1 minute background revalidation
      expire: 3600, // 1 hour max idle expiry
    },
    // 2. Notifications & SMS: Fast updates for dispatch status & SMSHub delivery webhooks
    notifications: {
      stale: 30, // 30s client router cache
      revalidate: 60, // 1 minute background revalidation
      expire: 3600, // 1 hour max idle expiry
    },
    // 3. Dashboard metrics & Live telemetry: High-priority operational overview
    dashboard: {
      stale: 30, // 30s client router cache
      revalidate: 60, // 1 minute background revalidation
      expire: 3600, // 1 hour max idle expiry
    },
    // 4. Directory (Students, Guardians): Enrollment & contact records
    directory: {
      stale: 300, // 5 minutes client router cache
      revalidate: 3600, // 1 hour background revalidation
      expire: 86400, // 1 day max idle expiry
    },
    // 5. Structure (Classes, Teachers, Teacher-Class Assignments, Profile): Administrative setup
    structure: {
      stale: 300, // 5 minutes client router cache
      revalidate: 7200, // 2 hours background revalidation
      expire: 86400, // 1 day max idle expiry
    },
    // 6. Institutional (Academic Calendar, Terms, Timetable, Alert Policies): Stable rules
    institutional: {
      stale: 300, // 5 minutes client router cache
      revalidate: 86400, // 1 day background revalidation
      expire: 604800, // 1 week max idle expiry
    },
    // 7. Analytics & Reports: Historical trend & chronic absentee aggregations
    analytics: {
      stale: 300, // 5 minutes client router cache
      revalidate: 1800, // 30 minutes background revalidation
      expire: 43200, // 12 hours max idle expiry
    },
  },
  partialPrefetching: false,
  experimental: {
    agentUpgrade: "security",
  },
  async redirects() {
    return [
      {
        source: "/notifications",
        destination: "/settings/notifications",
        permanent: false,
      },
      {
        source: "/notifications/templates",
        destination: "/settings/templates",
        permanent: false,
      },
      {
        source: "/attendance/overview",
        destination: "/settings/overview",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
