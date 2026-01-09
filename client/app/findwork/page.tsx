"use client";
import React from "react";
import Image from "next/image";
import Filters from "@/component/Filters";
import Header from "@/component/Header";
import Footer from "@/component/Footer";
import JobCard from "@/component/jobItem/jobCard";
import SearchForm from "@/component/SearchForm";
import { useJobsContext } from "@/context/jobContext";
import { Job } from "@/types/custom";

function Page() {
  const { jobs, filters, searchQuery } = useJobsContext();
  const [columns, setColumns] = React.useState(3);

  const toggleGridColumns = () => {
    setColumns((prev) => (prev === 3 ? 2 : prev === 2 ? 1 : 3));
  };

  // ✅ Comprehensive filtering logic for Manual + API Jobs
  const filteredJobs = jobs.filter((job: Job) => {
    // 1. Search Bar Filter (Title and Location)
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.title.toLowerCase()) &&
      job.location.toLowerCase().includes(searchQuery.location.toLowerCase());

    // 2. Job Type Filters (Checkbox logic)
    const noTypeFilters = !filters.fullTime && !filters.partTime && !filters.contract && !filters.internship;
    
    const matchesType = noTypeFilters || 
      (filters.fullTime && job.jobType.some(t => t.toLowerCase().includes("full"))) ||
      (filters.partTime && job.jobType.some(t => t.toLowerCase().includes("part"))) ||
      (filters.contract && job.jobType.some(t => t.toLowerCase().includes("contract"))) ||
      (filters.internship && job.jobType.some(t => t.toLowerCase().includes("intern")));

    // 3. Category Filters (Tags/Skills logic)
    const noCategoryFilters = !filters.fullStack && !filters.backend && !filters.devOps && !filters.uiux;
    
    const matchesCategory = noCategoryFilters ||
      (filters.fullStack && job.tags.some(tag => tag.toLowerCase().includes("stack"))) ||
      (filters.backend && job.tags.some(tag => tag.toLowerCase().includes("backend"))) ||
      (filters.devOps && job.tags.some(tag => tag.toLowerCase().includes("devops"))) ||
      (filters.uiux && job.tags.some(tag => tag.toLowerCase().includes("ui")));

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <main className="bg-gray-50 min-h-screen">
      <Header />

      {/* Hero Section */}
      <div className="relative px-6 md:px-16 bg-[#D7DEDC] overflow-hidden py-12">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-black font-bold text-3xl md:text-5xl mb-8">
            Find Your Next Job Here
          </h1>
          <SearchForm />
        </div>

        {/* Responsive Hero Image */}
        <div className="hidden lg:block">
          <Image
            src="/woman-on-phone.jpg"
            alt="hero"
            width={220}
            height={500}
            className="absolute top-0 right-20 h-full object-cover opacity-80"
            style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          />
        </div>
      </div>

      <div className="w-[95%] max-w-[1400px] mx-auto py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Recent Jobs</h2>
            <p className="text-gray-500 text-sm">Showing {filteredJobs.length} results</p>
          </div>
          
          <button 
            onClick={toggleGridColumns} 
            className="hidden md:flex items-center gap-2 border px-4 py-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium">
              {columns === 3 ? "Grid View" : columns === 2 ? "Table View" : "List View"}
            </span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-[280px] shrink-0">
            <Filters />
          </div>

          {/* Jobs Grid */}
          <div className="flex-1">
            {filteredJobs.length > 0 ? (
              <div className={`grid gap-6 ${
                columns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : 
                columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              }`}>
                {filteredJobs.map((job: Job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium">No jobs found matching your criteria.</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 text-[#7263f3] text-sm underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default Page;