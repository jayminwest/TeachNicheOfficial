export default function AssetStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-mono text-sm">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        {children}
      </div>
    </div>
  );
}
