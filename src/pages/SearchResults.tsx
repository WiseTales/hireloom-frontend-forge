import { useSearchParams, Navigate } from 'react-router-dom';
import { JobCard } from '@/components/JobCard';
import { mockJobs } from '@/data/mockJobs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState } from 'react';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput });
    }
  };

  const filteredJobs = mockJobs.filter((job) => {
    const searchLower = query.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower) ||
      job.category.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 bg-background border rounded-lg">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Job title, skills, or company..."
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
          </h1>
          {query && (
            <p className="text-muted-foreground">
              Showing results for "{query}"
            </p>
          )}
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">No jobs found matching your search</p>
            <p className="text-muted-foreground">Try adjusting your search terms or browse all jobs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
