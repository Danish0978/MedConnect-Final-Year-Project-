// Doctors.js (updated)
import React, { useEffect, useState } from "react";
import DoctorCard from "../components/DoctorCard";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "../styles/doctors.css";
import fetchData from "../helper/apiCall";
import Loading from "../components/Loading";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../redux/reducers/rootSlice";
import Empty from "../components/Empty";
import { toast } from "react-hot-toast";
import { FaSearch, FaStar } from "react-icons/fa";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState(null);
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);

  const fetchAllDocs = async () => {
    dispatch(setLoading(true));
    try {
      const response = await fetchData(`/doctor/getalldoctors`);
      if (response && response.success && Array.isArray(response.data)) {
        setDoctors(response.data);
        setFilteredDoctors(response.data);
      } else {
        console.error("Invalid data format:", response);
        toast.error("Failed to fetch doctors: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to fetch doctors");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchAllDocs();
  }, []);

  // Filter doctors based on search term and rating
  useEffect(() => {
    let filtered = [...doctors];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((doctor) => {
        const name = `${doctor.userId?.firstname || ''} ${doctor.userId?.lastname || ''}`.toLowerCase();
        const specialization = doctor.specialization?.toLowerCase() || '';
        const clinicName = doctor.clinicId?.name?.toLowerCase() || '';
        const clinicAddress = doctor.clinicId?.address?.toLowerCase() || '';
        const fee = doctor.feePerConsultation?.toString() || '';
        const experience = doctor.experience?.toString() || '';

        return (
          name.includes(searchLower) ||
          specialization.includes(searchLower) ||
          clinicName.includes(searchLower) ||
          clinicAddress.includes(searchLower) ||
          fee.includes(searchLower) ||
          experience.includes(searchLower)
  )});
    }

    if (ratingFilter !== null) {
      filtered = filtered.filter(doctor => 
        parseFloat(doctor.averageRating || 0) >= ratingFilter
      );
    }

    setFilteredDoctors(filtered);
  }, [searchTerm, ratingFilter, doctors]);

  return (
    <>
      <Navbar />
      {loading && <Loading />}
      {!loading && (
        <section className="container doctors">
          <h2 className="page-heading">Our Doctors</h2>
          
          <div className="search-and-filter">
            {/* Search Bar */}
            <div className="doctor-search-container">
              <div className="doctor-search-bar">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, specialization, clinic, etc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="rating-filter">
              <span>Filter by rating: </span>
              {[4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  className={`rating-btn ${ratingFilter === rating ? 'active' : ''}`}
                  onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                >
                  {rating}+ <FaStar className="star-icon" />
                </button>
              ))}
              {ratingFilter && (
                <button 
                  className="clear-filter"
                  onClick={() => setRatingFilter(null)}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredDoctors.length > 0 ? (
            <div className="doctors-card-container">
              {filteredDoctors.map((ele) => (
                <DoctorCard ele={ele} key={ele._id} />
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </section>
      )}
      <Footer />
    </>
  );
};

export default Doctors;