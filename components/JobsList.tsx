'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Job } from '@/lib/types/database'

interface JobsListProps {
  jobs: Job[]
}

export default function JobsList({ jobs }: JobsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return
    }

    setDeletingId(jobId)
    const { error } = await supabase.from('jobs').delete().eq('id', jobId)

    if (error) {
      alert('Failed to delete job: ' + error.message)
    } else {
      router.refresh()
    }
    setDeletingId(null)
  }

  const handleToggleActive = async (job: Job) => {
    setTogglingId(job.id)
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: !job.is_active })
      .eq('id', job.id)

    if (error) {
      alert('Failed to update job: ' + error.message)
    } else {
      router.refresh()
    }
    setTogglingId(null)
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No job postings yet
        </h3>
        <p className="text-slate-600 text-sm">
          Create your first job posting using the form on the left.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className={`border rounded-lg p-5 transition-all ${
            job.is_active
              ? 'border-slate-200 bg-white'
              : 'border-slate-200 bg-slate-50 opacity-75'
          }`}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {job.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {job.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{job.location}</p>
              <p className="text-sm text-slate-700 line-clamp-2">
                {job.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
            <button
              onClick={() => handleToggleActive(job)}
              disabled={togglingId === job.id}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {togglingId === job.id
                ? 'Updating...'
                : job.is_active
                  ? 'Deactivate'
                  : 'Activate'}
            </button>
            <button
              onClick={() => handleDelete(job.id)}
              disabled={deletingId === job.id}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {deletingId === job.id ? 'Deleting...' : 'Delete'}
            </button>
            <span className="ml-auto text-xs text-slate-500">
              {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
