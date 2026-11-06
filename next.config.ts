import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // La página del comprobante pasó a /evento/entrada (sitio central). Se conserva la query (?o=…).
    return [{ source: "/entrada", destination: "/evento/entrada", permanent: true }];
  },
};

export default nextConfig;
