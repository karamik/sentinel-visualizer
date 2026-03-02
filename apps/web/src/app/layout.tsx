export const metadata = {
  title: 'Sentinel Visualizer — ZK Circuit Debugger',
  description: 'See the Unseen in ZK Circuits',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-gray-200">{children}</body>
    </html>
  )
}
