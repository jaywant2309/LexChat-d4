import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LexChat - Smart Legal Assistant",
  description: "AI-powered legal document analysis and Q&A system using Google Gemini",
  keywords: ["legal", "document", "analysis", "AI", "Gemini", "assistant"],
  authors: [{ name: "LexChat Team" }],
  creator: "LexChat Team",
  publisher: "LexChat",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lexchat.vercel.app",
    title: "LexChat - Smart Legal Assistant",
    description: "AI-powered legal document analysis and Q&A system",
    siteName: "LexChat",
  },
  twitter: {
    card: "summary_large_image",
    title: "LexChat - Smart Legal Assistant",
    description: "AI-powered legal document analysis and Q&A system",
    creator: "@lexchat",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
