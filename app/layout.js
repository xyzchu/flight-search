import './globals.css'

export const metadata = {
  title: 'Flight Search',
  description: 'Multi-stop flight search with price history',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
