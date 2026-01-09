import React, { use,createJob,  useEffect } from "react";
import { createContext, useContext,useState } from "react";
import { useGlobalContext } from "./globalContext";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import{getUserProfile} from "./globalContext";
import { io } from "socket.io-client";




const socket = io("http://localhost:8000");





const JobsContext = createContext();
axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true;


export const JobsContextProvider =({children})   => { 
    const router = useRouter();
    const {userProfile}=useGlobalContext(); 
    const {  auth0User } = useGlobalContext();  

    const [jobs,setJobs]=useState([]);
    const [loading,setLoading]=useState(false);
    const [userJobs,setUserJobs]=useState([]);

    const [searchQuery, setSearchQuery] = useState({
        tags: "",
        location: "",
        title: "",
    });

      //filters
    const [filters, setFilters] = useState({
        fullTime: false,
        partTime: false,
        internship: false,
        contract: false,
        fullStack: false,
        backend: false,
        devOps: false,
        uiux: false,
     });
    const [minSalary, setMinSalary] = useState(30000);
    const [maxSalary, setMaxSalary] = useState(120000);

    const getJobs = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/v1/jobs");
            console.log("Current User:", JSON.stringify(auth0User, null, 2));
            setJobs(res.data );
        } catch (error) {
            console.error("Error fetching jobs", error);
           
            
        } finally {
            setLoading(false);
        }
    };
    const createJob = async (jobData) => {
        
        try {
            const res = await axios.post("/api/v1/jobs", jobData);
            toast.success("Job created successfully");
            const newJob = res.data.Newjob;

            setJobs((prevJobs) => [newJob, ...prevJobs]);
            //update userjobs
            if(userProfile._id){

                setUserJobs((prevUserJobs) => [newJob, ...prevUserJobs]);
                await getUserJobs(userProfile._id);
            }
            await getJobs();
            
            router.push(`/job/${newJob._id}`);
        } catch (error) {
            console.error("Error creating job", error);
            
        }   
    };
    
    const getUserJobs = async (userId) => {
        setLoading(true);  
        try {
            const res = await axios.get("/api/v1/jobs/user/"+userId);
            setUserJobs(res.data );
            setLoading(false);
        } catch (error) {
            console.error("Error fetching user jobs", error);
            
        }finally {
            setLoading(false);
        }
    };

    const searchJobs = async (tags, location, title) => {
        setLoading(true);
        try {
            // but query string
            const querry = new URLSearchParams(); 
            if(tags) querry.append("tags", tags);
            if(location) querry.append("location", location);
            if(title) querry.append("title", title);

            // send request
            const res = await axios.get(`/api/v1/jobs/search?${querry.toString()}`);
            setJobs(res.data);
            setLoading(false);

        } catch (error) {
            console.error("Error searching jobs", error);
            
        } finally {
            setLoading(false);
        }
    };

    //get job by id
    const getJobById = async (jobId) => {
        setLoading (true);  
        try {
            const res = await axios.get(`/api/v1/jobs/${jobId}`);
            setLoading(false);
            return res.data;
        } catch (error) {
            console.error("Error fetching job by id", error);
            
        } finally {
            setLoading(false);
        }  
    };

    //like a job
    const likeJob = async (jobId) => {
        console.log("Job liked", jobId);
        try {
            const res = await axios.put(`/api/v1/jobs/like/${jobId}`); 
            toast.success("Job liked successfully");
            getJobs();
            console.log("Like response:", res.data);

            //update jobs state
        } catch (error) {
            console.error("Error liking job", error);
            
        }   
    };

    //apply to a job
    const applyToJob = async (jobId) => {
        const job = jobs.find((job) => job._id === jobId);
        if(job && job.applicants.includes(userProfile._id)){
            toast.error("Job not found");
            return;
        }
        try {
            const res = await axios.put(`/api/v1/jobs/apply/${jobId}`);   
            toast.success("Applied to job successfully");
            getJobs();
            //update jobs state
        } catch (error) {
            console.error("Error applying to job", error);
            toast.error(error.response?.data?.message || "Error applying to job");
        }   
    };
    //delete a job
    const deleteJob = async (jobId) => {
        try {

            const res = await axios.delete(`/api/v1/jobs/${jobId}`);
            setJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
            setUserJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));

            toast.success("Job deleted successfully");
        } catch (error) {
            console.error("Error deleting job", error);
            toast.error(error.response?.data?.message || "Error deleting job");
        }   
    };

    const handleSearchChange = (searchName, value) => {
        setSearchQuery((prev) => ({ ...prev, [searchName]: value }));
    };

    const handleFilterChange = (filterName) => {
        setFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
    };

    useEffect (() => {
        getJobs();
        // searchJobs("","","test data 2");
    },[]);

    useEffect(() => {
        // 👂 Listen for the "newJobAvailable" event
        socket.on("newJobAvailable", (newJob) => {
          setJobs((prevJobs) => [newJob, ...prevJobs]);
          toast.success("New job posted just now!");
    });

    // Clean up when the user leaves the page
     return () => socket.off("newJobAvailable");
     }, []);

    useEffect(() => {   
        if(userProfile?._id){
            getUserJobs (userProfile._id);
            //getUserProfile(userProfile.auth0Id);
        }   
    }, [userProfile._id]);
    //console.log("search Jobs:", jobs);
    

    return (
        <JobsContext.Provider value={{jobs,  loading,  userJobs, createJob,  searchJobs, getJobById, likeJob, applyToJob, deleteJob, handleFilterChange, filters, minSalary, setMinSalary, maxSalary, setMaxSalary, searchQuery, handleSearchChange, setFilters,setSearchQuery,}}>
            {children}
        </JobsContext.Provider>
    );      
    
}

export const useJobsContext =() => {
    return useContext(JobsContext);
}
