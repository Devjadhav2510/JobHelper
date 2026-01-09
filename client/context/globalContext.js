import React, {createContext,  useContext, useEffect, useState} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";



const GlobalContext = createContext();

axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true;


export const GlobalContextProvider =({children})   => {

    const router = useRouter();

    const [isAuthenticated, setIsAuthenticated] = useState(false);   
    const [auth0User, setAuth0User] = useState(null);
    const [userProfile, setUserProfile] =useState({});
    const [loading, setLoading] = useState(false);


    // input state
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [salary, setSalary] = useState(0);
    const[activeEmploymentTypes, setActiveEmploymentTypes] = useState([]);
    const [salaryRange, setSalaryRange] = useState([0,0]);
    const [salaryType, setSalaryType] = useState("Year");
    const [negotiable, setNegotiable] = useState(false);
    const [skills, setSkills] = useState([]);
    const [location, setLocation] = useState({
        country: "",
        city: "",
        address: "",
    });
    
    useEffect(() => {
        const checkAuth = async () => {
            setLoading(true);
            try {
                const res = await axios.get("/api/v1/check-auth"); 
                setIsAuthenticated(res.data.isAuthenticated);
                setAuth0User(res.data.user );
                setLoading(false);
            } catch (error) {
                console.error("Error checking authentication", error);
                
            } finally {
                setLoading(false);
            }
        };
        checkAuth();    
    }, []);
    const [tags, setTags] = useState({
    });

    const getUserProfile = async (id) => {
        
        try {
            const res = await axios.get(`/api/v1/user/${id}`);           
            //console.log("Response:", res.data);
            setUserProfile(res.data);
        } catch (error) {
            console.error("Error fetching user profile", error);
            // Set empty profile on error
            
        } 

    };
    
    // handle input changes
    const handleTitleChange = (e) => {
        setJobTitle(e.target.value.trimStart());
    }
    const handleDescriptionChange = (e) => {    
        setJobDescription(e.target.value.trimStart());
    }

    const handleSalaryChange = (e) => {
        setSalary(e.target.value);
    };


    const resetJobForm = () => {
        setJobTitle("");
        setJobDescription("");
        setSalary(0);
        setActiveEmploymentTypes([]);
        setSalaryRange([0,0]);
        setSalaryType("Year");
        setNegotiable(false);

        setSkills([]);
        setLocation({
            country: "",
            city: "",
            address: "",
        });
        setTags({
        });
    };

    

    
    useEffect(() => {
    // Only call the function if the ID actually exists
    if (isAuthenticated  && auth0User.sub) {
        getUserProfile(auth0User.sub);
    }
}, [isAuthenticated, auth0User]);
    console.log("Auth0 User:", auth0User?.name);
    return (
        <GlobalContext.Provider value={{
            isAuthenticated,
            auth0User,
            userProfile,
            getUserProfile,
            loading,
            jobTitle,
            jobDescription,
            salary,
            salaryType,
            negotiable,
            setNegotiable,
            skills,
            setSkills,
            location,
            setLocation,
            tags,
            setTags,
            salaryRange,
            setSalaryRange,
            activeEmploymentTypes, 
            salaryRange,
            handleTitleChange,
            handleDescriptionChange,
            handleSalaryChange,
            setActiveEmploymentTypes,
            setJobDescription,
            resetJobForm,
            setSalaryType,
            
            
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => {
    return useContext(GlobalContext);
};

export default useGlobalContext;