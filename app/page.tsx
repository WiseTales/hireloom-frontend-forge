export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
      <h1 className="text-6xl font-black mb-4 tracking-tighter">HIRELOOM</h1>
      <p className="text-slate-400 text-xl font-medium">The Multi-Tenant Talent Engine</p>
      <div className="mt-12 p-4 border border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur-sm">
        <p className="text-sm text-slate-500">Visit <code className="text-indigo-400">companyname.hireloom1234.com/careers</code> to see the tenant portal.</p>
      </div>
    </main>
  );
}
