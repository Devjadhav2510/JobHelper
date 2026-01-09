"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useJobsContext } from "@/context/jobContext";
import { useGlobalContext } from "@/context/globalContext";
import { formatDates } from "@/utils/formatDate";
import Header from "@/component/Header";
import Footer from "@/component/Footer";
import JobCard from "@/component/jobItem/jobCard";
import { Job } from "@/types/custom";
import formatMoney from "@/utils/formatMoney";
import { Bookmark } from "lucide-react";
import { bookmark, bookmarkEmpty } from "@/utils/icons";

function Page() {
  const { jobs, likeJob, applyToJob } = useJobsContext();
  const { userProfile, isAuthenticated } = useGlobalContext();
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  // 1. Find the data
  const job = jobs.find((job: Job) => job._id === id);
  const otherJobs = jobs.filter((job: Job) => job._id !== id);

  
  if (!job) return null;
  // 2. DERIVED STATE (No useEffect or useState needed here)
  // These variables recalculate automatically whenever job or userProfile changes
  // const isLiked = job.likes.includes(userProfile?._id);
  // const isApplied = job.applicants.includes(userProfile?._id);
  // ✅ Safe arrays for likes/applicants (handles undefined/null)
  const likes = Array.isArray(job.likes) ? job.likes : [];
  const applicants = Array.isArray(job.applicants) ? job.applicants : [];

  
  // ✅ Derived booleans (no extra state/useEffect needed)
  const isLiked =
    !!userProfile?._id && likes.includes(userProfile._id);
  const isApplied =
    !!userProfile?._id && applicants.includes(userProfile._id);

  

  const {
    title,
    location,
    description,
    salary,
    createdBy,
    jobType,
    createdAt,
    salaryType,
    negotiable,
  } = job;

  const recruiterName = createdBy?.name || "JobHelper Recruiter";
const recruiterAvatar = createdBy?.profilePicture || "/user.png";

  const handleLike = (jobId: string) => {
    // Just call the context function. 
    // When the context updates, this component re-renders and isLiked updates automatically.
    likeJob(jobId);
  };

  return (
    <main>
      <Header />

      <div className="p-8 mb-8 mx-auto w-[90%] rounded-md flex gap-8">
        <div className="w-[26%] flex flex-col gap-8">
          <JobCard activeJob job={job} />

          {otherJobs.map((job: Job) => (
            <JobCard job={job} key={job._id} />
          ))}
        </div>

        <div className="flex-1 bg-white p-6 rounded-md">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 relative overflow-hidden rounded-md flex items-center justify-center bg-gray-200">
                  <Image
                    src={recruiterAvatar || "/user.png"}
                    alt={recruiterName || "User"}
                    width={45}
                    height={45}
                    className="rounded-md"
                  />
                </div>

                <div>
                  <p className="font-bold">{recruiterName}</p>
                  <p className="text-sm">Recruiter</p>
                </div>
              </div>
              <button
                className={`text-2xl ${
                  isLiked ? "text-[#7263f3]" : "text-gray-400"
                }`}
                onClick={() => {
                  isAuthenticated
                    ? handleLike(job._id)
                    : router.push("http://localhost:8000/login");
                }}
              >
                {isLiked ? bookmark : bookmarkEmpty}
              </button>
            </div>

            <h1 className="text-2xl font-semibold">{title}</h1>
            <div className="flex gap-4 items-center">
              <p className="text-gray-500">{location}</p>
            </div>

            <div className="mt-2 flex gap-4 justify-between items-center">
              <p className="flex-1 py-2 px-4 flex flex-col items-center justify-center gap-1 bg-green-500/20 rounded-xl">
                <span className="text-sm">Salary</span>
                <span>
                  <span className="font-bold">
                    {formatMoney(salary, "GBP")}
                  </span>
                  <span className="font-medium text-gray-500 text-lg">
                    /
                    {salaryType === "Yearly" ? "pa" : 
                     salaryType === "Monthly" ? "pcm" : 
                     salaryType === "Weekly" ? "pw" : "ph"}
                  </span>
                </span>
              </p>

              <p className="flex-1 py-2 px-4 flex flex-col items-center justify-center gap-1 bg-purple-500/20 rounded-xl">
                <span className="text-sm">Posted</span>
                <span className="font-bold">{formatDates(createdAt)}</span>
              </p>

              <p className="flex-1 py-2 px-4 flex flex-col items-center justify-center gap-1 bg-blue-500/20 rounded-xl">
                <span className="text-sm">Applicants</span>
                <span className="font-bold">{applicants.length}</span>
              </p>

              <p className="flex-1 py-2 px-4 flex flex-col items-center justify-center gap-1 bg-yellow-500/20 rounded-xl">
                <span className="text-sm">Job Type</span>
                <span className="font-bold">{jobType[0]}</span>
              </p>
            </div>

            <h2 className="font-bold text-2xl mt-2">Job Description</h2>
          </div>

          <div
            className="wysiwyg mt-2"
            dangerouslySetInnerHTML={{ __html: description }}
          ></div>
        </div>

        <div className="w-[26%] flex flex-col gap-8">
          <button
            className={`text-white py-4 rounded-full transition-colors ${
              isApplied ? "bg-green-500 cursor-default" : "bg-[#7263f3] hover:bg-[#7263f3]/90"
            }`}
            onClick={() => {
              if (isAuthenticated) {
                if (!isApplied) {
                  applyToJob(job._id);
                } else {
                  toast.error("You have already applied to this job");
                }
              } else {
                router.push("http://localhost:8000/login");
              }
            }}
          >
            {isApplied ? "Applied" : "Apply Now"}
          </button>

          {/* Rest of your static information blocks... */}
          <div className="p-6 flex flex-col gap-2 bg-white rounded-md">
            <h3 className="text-lg font-semibold">Other Information</h3>
            <div className="flex flex-col gap-2">
              <p><span className="font-bold">Posted:</span> {formatDates(createdAt)}</p>
              <p>
                <span className="font-bold">Salary negotiable: </span>
                <span className={negotiable ? "text-green-500" : "text-red-500"}>
                  {negotiable ? "Yes" : "No"}
                </span>
              </p>
              <p><span className="font-bold">Location:</span> {location}</p>
              <p><span className="font-bold">Job Type:</span> {jobType[0]}</p>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-2 bg-white rounded-md">
            <h3 className="text-lg font-semibold">Tags</h3>
            <p>Other relevant tags for the job position.</p>

            <div className="flex flex-wrap gap-4">
              {job.skills.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-4 py-1 rounded-full text-sm font-medium flex items-center bg-red-500/20 text-red-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-2 bg-white rounded-md">
            <h3 className="text-lg font-semibold">Skills</h3>
            <p>
              This is a full-time position. The successful candidate will be
              responsible for the following:
            </p>

            <div className="flex flex-wrap gap-4">
              {job.skills.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-4 py-1 rounded-full text-sm font-medium flex items-center bg-indigo-500/20 text-[#7263f3]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default Page; 