import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.comparativetruth.com"),

  title: {
    default: "The Comparative Truth | Where Past Meets Present",
    template: "%s | The Comparative Truth",
  },

  description:
    "The Comparative Truth explores historical parallels behind today's questions, examining history, evidence, and the present to ask: Have we seen this before?",

  keywords: [
    "The Comparative Truth",
    "history podcast",
    "historical comparisons",
    "history and current events",
    "current events podcast",
    "historical context",
    "Comparative Truth Productions",
    "Where Past Meets Present",
  ],

  authors: [
    {
      name: "The Comparative Truth",
    },
  ],

  creator: "Comparative Truth Productions",
  publisher: "Comparative Truth Productions",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "The Comparative Truth | Where Past Meets Present",

    description:
      "History gives us another lens. Explore the past, compare it with the present, and follow the evidence wherever it leads.",

    url: "https://www.comparativetruth.com",

    siteName: "The Comparative Truth",

    type: "website",

    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",

    title: "The Comparative Truth | Where Past Meets Present",

    description:
      "Explore the past, compare it with the present, and follow the evidence wherever it leads.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
