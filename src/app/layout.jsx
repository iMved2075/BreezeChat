import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context.jsx";
import { ThemeProvider } from "@/context/theme-context.jsx";
import { CallProvider } from "@/context/call-context.jsx";
import "./globals.css";

// Increase max listeners in development
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  process.setMaxListeners(0);
}

export const metadata = {
  title: "BreezeChat",
  description: "A modern messaging app for instant communication.",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="breezechat-ui-theme"
          disableTransitionOnChange
        >
          <AuthProvider>
            <CallProvider>
              {children}
              <Toaster />
            </CallProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
