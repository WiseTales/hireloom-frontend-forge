'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface JobPostingFormProps {
  companyId: string
  userId: string
  companyName: string
}

export default function JobPostingForm({ companyId, userId, companyName }: JobPostingFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [category, setCategory] = useState('Engineering')
  const [visibility, setVisibility] = useState<'external' | 'internal'>('external')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('jobs').insert({
      company_id: companyId,
      company: companyName,
      posted_by: userId,
      title,
      description,
      location,
      salary,
      type: jobType,
      category,
      visibility,
      is_published: publish,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      setTitle('')
      setDescription('')
      setLocation('')
      setSalary('')
      setJobType('Full-time')
      setCategory('Engineering')
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
          Job Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
          placeholder="e.g. Senior Software Engineer"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
          placeholder="e.g. San Francisco, CA (Remote)"
        />
      </div>

      <div>
        <label htmlFor="salary" className="block text-sm font-medium text-slate-700 mb-2">
          Salary Range
        </label>
        <input
          id="salary"
          type="text"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
          placeholder="e.g. $120k - $180k"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="jobType" className="block text-sm font-medium text-slate-700 mb-2">
            Job Type
          </label>
          <select
            id="jobType"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
          >
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Internship</option>
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
          >
            <option>Engineering</option>
            <option>Design</option>
            <option>Marketing</option>
            <option>Sales</option>
            <option>Operations</option>
            <option>HR</option>
            <option>Finance</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-slate-700 mb-2">
          Visibility
        </label>
        <select
          id="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'external' | 'internal')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
        >
          <option value="external">External (Public Career Page)</option>
          <option value="internal">Internal Only</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none text-slate-900"
          placeholder="Describe the role, responsibilities, and requirements..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publishing...' : 'Publish Job'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={(e) => handleSubmit(e as any, false)}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50"
        >
          Save Draft
        </button>
      </div>
    </form>
  )
}
