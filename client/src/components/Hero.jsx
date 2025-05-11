import React from "react";
import image from "../images/heroimg.jpg";
import "../styles/hero.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
      <h1>
        Your Health,<br/> Our Commitment
        </h1>
        <p>
        Empowering you with comprehensive healthcare solutions and expert support for a healthier future.
        Together, we take proactive steps towards your well-being.
        </p>
      </div>
      <div className="hero-img">
        <img
          src={image}
          alt="hero"
        />
      </div>
    </section>
  );
};

export default Hero;
