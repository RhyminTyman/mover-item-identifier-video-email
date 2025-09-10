import "../styles/globals.css";
import type { Metadata } from "next";
import { ThemeRegistry } from "./theme/ThemeRegistry";

export const metadata: Metadata = {
  title: "Mover Item Identifier",
  description: "Smart AI-powered inventory system for your move. Upload photos and videos to automatically identify and catalog your belongings."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}