import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import job from "../models/jobModel.js";

// ✅ Unified createJob with Socket.io Broadcasting
export const createJob = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    const isAuth = req.oidc.isAuthenticated() || (user && user.email);

    if (!isAuth || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      title,
      description,
      location,
      salary,
      jobType,
      tags,
      skills,
      salaryType,
      negotiable,
    } = req.body;

    // Validation
    if (!title || !description || !location || !salary) {
      return res.status(400).json({ message: "Required fields are missing" });
    }
    
    if (!Array.isArray(jobType) || jobType.length === 0) {
      return res.status(400).json({ message: "At least one job type is required" });
    }

    const Newjob = new job({
      title,
      description,
      location,
      salary,
      jobType,
      tags,
      skills,
      salaryType,
      negotiable,
      createdBy: user._id,
    });

    await Newjob.save();

    // 📢 Broadcast to all connected users via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("newJobAvailable", Newjob);
    }

    return res.status(201).json({ message: "Job created successfully", Newjob });
  } catch (error) {
    console.log("Error in createJob:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

// get all jobs
export const getJobs = asyncHandler(async (req, res) => {
  try {
    const jobs = await job
      .find({})
      .populate("createdBy", "name profilePicture")
      .sort({ createdAt: -1 }); // Changed to -1 to show newest first
    return res.status(200).json(jobs);
  } catch (error) {
    console.log("Error in getJobs:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// get jobs by user
export const getJobsByUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const jobs = await job
      .find({ createdBy: user._id })
      .populate("createdBy", "name profilePicture");
    return res.status(200).json(jobs);
  } catch (error) {
    console.log("Error in getJobsByUser:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

// search jobs
export const searchJobs = asyncHandler(async (req, res) => {
  try {
    const { tags, location, title } = req.query;
    let query = {};
    if (tags) {
      query.tags = { $in: tags.split(",") };
    }
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }
    const jobs = await job.find(query).populate("createdBy", "name profilePicture");
    return res.status(200).json(jobs);
  } catch (error) {
    console.log("Error in searchJobs:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// apply for job
export const applyJob = asyncHandler(async (req, res) => {
  try {
    const jobDoc = await job.findById(req.params.id);
    if (!jobDoc) {
      return res.status(404).json({ message: "Job not found" });
    }
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (jobDoc.applicants.includes(user._id)) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }
    jobDoc.applicants.push(user._id);
    await jobDoc.save();
    return res.status(200).json(jobDoc);
  } catch (error) {
    console.log("Error in applyJob:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// like/unlike job
export const likeJob = asyncHandler(async (req, res) => {
  try {
    const jobDoc = await job.findById(req.params.id);
    if (!jobDoc) {
      return res.status(404).json({ message: "Job not found" });
    }
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isLiked = jobDoc.likes.includes(user._id);
    if (isLiked) {
      jobDoc.likes = jobDoc.likes.filter((like) => !like.equals(user._id));
    } else {
      jobDoc.likes.push(user._id);
    }
    await jobDoc.save();
    return res.status(200).json(jobDoc);
  } catch (error) {
    console.log("Error in likeJob:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// get job by id
export const jobById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const jobDoc = await job.findById(id).populate("createdBy", "name profilePicture");
    if (!jobDoc) {
      return res.status(404).json({ message: "Job not found" });
    }
    return res.status(200).json(jobDoc);
  } catch (error) {
    console.log("Error in jobById:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// delete job
export const deleteJob = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const jobDoc = await job.findById(id);
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!jobDoc) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await jobDoc.deleteOne({ _id: id });
    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.log("Error in deleteJob:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});