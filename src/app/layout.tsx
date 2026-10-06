import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import TouchNotice from "@/components/TouchNotice";
import "./globals.css";

// The whole UI is monospace, so only Geist Mono is loaded (Geist Sans was never displayed)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BrightBike — Light-cycle arena",
    template: "%s · BrightBike",
  },
  description:
    "A Tron-style light-cycle game: steer a constantly moving bike, leave a trail of light, and be the last rider on the grid. Play a CPU at three difficulty levels or a friend on one keyboard.",
  applicationName: "BrightBike",
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TouchNotice />
        {children}
      </body>
    </html>
  );
}
