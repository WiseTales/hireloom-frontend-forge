import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import JobPostingForm from '@/components/JobPostingForm'
import JobsList from '@/components/JobsList'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                HR Dashboard
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {profile.companies?.name}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Post New Job
              </h2>
              <JobPostingForm companyId={profile.company_id} userId={user.id} companyName={profile.companies?.name || ''} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Your Job Postings
                </h2>
                <span className="text-sm text-slate-600">
                  {jobs?.length || 0} total
                </span>
              </div>
              <JobsList jobs={jobs || []} />
            </div>

            <div className="mt-6 bg-slate-800 text-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">
                Your Public Career Page
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                Share this link with candidates to view your job listings:
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-slate-900 px-4 py-3 rounded-lg text-sm font-mono">
                  {`${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/careers/${profile.companies?.slug}`}
                </code>
                <a
                  href={`/careers/${profile.companies?.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  View Page
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
