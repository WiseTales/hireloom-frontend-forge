export default async function CareersPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-xl w-full bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[3rem] p-12 text-center border border-white/50 backdrop-blur-xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl mb-8 shadow-2xl shadow-indigo-200 rotate-3 transform hover:rotate-0 transition-transform duration-500">
          <span className="text-3xl font-bold text-white uppercase">{company[0]}</span>
        </div>

        <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tight">
          Hello World
        </h1>

        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-8 bg-slate-200" />
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
            Career Portal
          </p>
          <div className="h-px w-8 bg-slate-200" />
        </div>

        <div className="bg-slate-50 rounded-2xl py-6 px-8 border border-slate-100 flex flex-col items-center gap-1 group transition-all hover:bg-white hover:shadow-lg">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Connected via Path</span>
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            {company}
          </span>
        </div>

        <div className="mt-12 flex justify-center gap-6">
          {['All Jobs', 'Company Culture', 'Benefits'].map((tab) => (
            <span key={tab} className="text-slate-400 text-sm font-semibold hover:text-indigo-600 cursor-pointer transition-colors">
              {tab}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-8 text-slate-400 text-xs font-medium">
        Hireloom Dynamic Routing MVP
      </p>
    </main>
  );
}
