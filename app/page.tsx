import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-black mb-6 tracking-tighter">
          HIRELOOM
        </h1>
        <p className="text-slate-300 text-2xl font-medium mb-12">
          Multi-Tenant Job Posting System
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-xl font-bold mb-4">For HR Teams</h2>
            <p className="text-slate-300 mb-6 text-sm">
              Manage job postings for your company with our secure HR dashboard
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-white text-slate-900 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-xl font-bold mb-4">Public Career Pages</h2>
            <p className="text-slate-300 mb-6 text-sm">
              Explore open positions from our partner companies
            </p>
            <div className="space-y-3">
              <Link
                href="/careers/nexacore-technologies"
                className="block w-full bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors text-sm"
              >
                NexaCore Technologies
              </Link>
              <Link
                href="/careers/acme-corporation"
                className="block w-full bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors text-sm"
              >
                Acme Corporation
              </Link>
              <Link
                href="/careers/future-labs-inc"
                className="block w-full bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors text-sm"
              >
                Future Labs Inc
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-3">
            Path-Based Multi-Tenancy
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Each company gets their own career page:
          </p>
          <code className="block bg-slate-900 px-4 py-3 rounded-lg text-sm font-mono text-slate-300">
            /careers/[company-slug]
          </code>
        </div>
      </div>
    </main>
  )
}
