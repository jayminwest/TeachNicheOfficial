export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
      {/* Client components will be loaded by the browser */}
    </div>
  )
}
