import type { NextConfig } from "next";

// Cabeçalhos de segurança em todas as páginas.
const cabecalhos = [
  { key: "X-Frame-Options", value: "DENY" }, // ninguém embute o site/painel num iframe (clickjacking)
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  devIndicators: false, // esconde o botão "N" do modo de desenvolvimento (cobria o pé da barra lateral)
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: cabecalhos }];
  },
};

export default nextConfig;
