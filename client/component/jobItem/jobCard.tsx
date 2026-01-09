"use client";
import { useGlobalContext } from "@/context/globalContext";
import { useJobsContext } from "@/context/jobContext";
import { Job } from "@/types/custom";
import { Calendar, ExternalLink } from "lucide-react"; // Added ExternalLink icon
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react"; 
import { Separator } from "@/components/ui/separator";
import formatMoney from "@/utils/formatMoney";
import { formatDates } from "@/utils/formatDate";
import { bookmark, bookmarkEmpty } from "@/utils/icons";

interface JobProps {
  job: Job;
  activeJob?: boolean;
}

function JobCard({ job, activeJob }: JobProps) {
  const { likeJob } = useJobsContext();
  const { userProfile, isAuthenticated } = useGlobalContext();
  const router = useRouter();

  const isLiked = userProfile?._id && Array.isArray(job.likes) 
    ? job.likes.includes(userProfile._id) 
    : false;

  const {
    title,
    location,
    salaryType,
    salary,
    createdBy,
    applicants,
    jobType,
    createdAt,
    source, // ✅ Destructure the new source field
  } = job;

  const recruiterName = createdBy?.name || "JobHelper Recruiter";
const recruiterAvatar = createdBy?.profilePicture || "/user.png";

  const handleLike = (id: string) => {
    likeJob(id);
  };

  const companyDescription =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc.";

  const jobTypeBg = (type: string) => {
    switch (type) {
      case "Full Time": return "bg-green-500/20 text-green-600";
      case "Part Time": return "bg-purple-500/20 text-purple-600";
      case "Contract": return "bg-red-500/20 text-red-600";
      case "Internship": return "bg-indigo-500/20 text-indigo-600";
      default: return "bg-gray-500/20 text-gray-600";
    }
  };

  // ✅ NEW: Helper function to color-code the source badge
  const getSourceStyle = (src: string | undefined) => {
    switch (src?.toLowerCase()) {
      case 'linkedin': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'jsearch': return "bg-purple-100 text-purple-700 border-purple-200";
      case 'indeed': return "bg-blue-600 text-white border-blue-700";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div
      className={`p-8 rounded-xl flex flex-col gap-5 transition-all relative group
    ${
      activeJob
        ? "bg-gray-50 shadow-md border-b-2 border-[#7263f3]"
        : "bg-white border border-gray-100 hover:shadow-lg"
    }`}
    >
      {/* ✅ NEW: Source Badge in Top Right */}
      {source && (
        <div className={`absolute top-3 right-14 px-2 py-0.5 rounded text-[10px] font-bold border uppercase flex items-center gap-1 ${getSourceStyle(source)}`}>
          {source === 'Manual' ? 'Direct' : `via ${source}`}
          {source !== 'Manual' && <ExternalLink size={10} />}
        </div>
      )}

      <div className="flex justify-between">
        <div
          className="group flex gap-3 items-center cursor-pointer"
          onClick={() => router.push(`/job/${job._id}`)}
        >
          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
            <Image
              src={recruiterAvatar || "/user.png"}
              alt={recruiterName || "User"}
              width={40}
              height={40}
              className="rounded-md object-cover"
            />
          </div>

          <div className="flex flex-col">
            <h4 className="group-hover:text-[#7263f3] font-bold transition-colors">{title}</h4>
            <p className="text-xs text-gray-500">
              {recruiterName} • {applicants.length}{" "}
              {applicants.length === 1 ? "Applicant" : "Applicants"}
            </p>
          </div>
        </div>

        <button
          className={`text-2xl transition-transform active:scale-90 ${
            isLiked ? "text-[#7263f3]" : "text-gray-400"
          } `}
          onClick={(e) => {
            e.stopPropagation(); 
            isAuthenticated 
              ? handleLike(job._id)
              : router.push("http://localhost:8000/login");
          }}
        >
          {isLiked ? bookmark : bookmarkEmpty}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {jobType.map((type, index) => (
          <span
            key={index}
            className={`py-1 px-3 text-xs font-medium rounded-md border ${jobTypeBg(type)}`}
          >
            {type}
          </span>
        ))}
      </div>

      <p className="text-sm text-gray-600 line-clamp-2">
        {companyDescription}
      </p>

      <Separator />

      <div className="flex justify-between items-center gap-6">
        <p>
          <span className="font-bold">{formatMoney(salary, "GBP")}</span>
          <span className="font-medium text-gray-400 text-sm ml-1">
            /
            {salaryType === "Yearly" ? "pa" : 
             salaryType === "Monthly" ? "pcm" : 
             salaryType === "Weekly" ? "pw" : "ph"}
          </span>
        </p>

        <p className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar size={14} />
          {formatDates(createdAt)}
        </p>
      </div>
    </div>
  );
}

export default JobCard;