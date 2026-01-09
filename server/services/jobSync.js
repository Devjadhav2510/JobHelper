import axios from 'axios';
import Job from '../models/jobModel.js';

/**
 * Fetches jobs from JSearch API and saves them to MongoDB
 * @param {string} searchQuery - The job title/location to search for
 * @param {object} io - The Socket.io instance for real-time updates
 */
const syncExternalJobs = async (searchQuery = "Software Engineer", io) => {
    console.log(`📡 Starting API Sync for: ${searchQuery}...`);

    const options = {
        method: 'GET',
        url: 'https://jsearch.p.rapidapi.com/search',
        params: {
            query: searchQuery,
            page: '1',
            num_pages: '1'
        },
        headers: {
            'x-rapidapi-key': process.env.RAPID_API_KEY,
            'x-rapidapi-host': 'jsearch.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const apiJobs = response.data.data;

        if (!apiJobs || apiJobs.length === 0) {
            console.log("⚠️ No jobs found from API.");
            return;
        }

        for (const job of apiJobs) {
            // 1. Prepare the data object
            const jobData = {
                title: job.job_title,
                location: job.job_city && job.job_country 
                    ? `${job.job_city}, ${job.job_country}` 
                    : job.job_location || "Remote",
                salary: job.job_min_salary || 45000, 
                salaryType: "Year",
                negotiable: false,
                jobType: [job.job_employment_type || "Full Time"],
                description: job.job_description || "No description provided.",
                skills: ["Contact Recruiter"], 
                tags: [job.job_title, "API"],
                externalId: job.job_id, 
                source: job.job_publisher || "JSearch", 
                createdBy: "67307854d3a71f000523fd75" // Your verified Admin ID
            };

            // 2. Check if it's a new job or existing one
            const existingJob = await Job.findOne({ externalId: job.job_id });

            // 3. Update or Create (Upsert)
            const savedJob = await Job.findOneAndUpdate(
                { externalId: job.job_id },
                jobData,
                { upsert: true, new: true, runValidators: true }
            ).populate("createdBy", "name profilePicture");

            // 4. Emit to frontend ONLY if it's a brand new job and socket is available
            if (io && !existingJob && savedJob) {
                console.log(`🚀 Broadcasting new job: ${savedJob.title}`);
                io.emit("newJobAvailable", savedJob);
            }
        }

        console.log(`✅ Successfully synced ${apiJobs.length} jobs.`);
    } catch (error) {
        console.error("❌ Sync Logic Error:", error.message);
    }
};

export default syncExternalJobs;