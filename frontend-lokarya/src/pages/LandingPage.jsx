import React from "react";

import CarouselCard from "../components/Cards/CarouselCard.jsx";
import AboutProgram from "../components/Cards/AboutCard.jsx";
import RewardsSection from "../components/BadgeCard/RewardsSection.jsx";


const LandingPage = () => {     
    return (
        <div>
            <CarouselCard />
            <AboutProgram />
            <RewardsSection />
        </div>
    );
}   
export default LandingPage;