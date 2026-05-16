import type { Metadata } from "next"
import "../styles/globals.css"
export const metadata: Metadata = { title: "Xo So Mien Nam On-Chain" }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>
}
