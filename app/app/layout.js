export const metadata = {
  title: "The Comparative Truth",
  description: "History Repeats Itself, But… Are You Listening?"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
