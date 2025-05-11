import React from "react";
import image from "../images/aboutimg.jpg";

const AboutUs = () => {
  return (
    <>
      <section className="container">
        <h2 className="page-heading about-heading">About Us</h2>
        <div className="about">
          <div className="hero-img">
            <img
              src={image}
              alt="hero"
            />
          </div>
          <div className="hero-content">
            <p>
            At MedConnect, we prioritize your health by offering comprehensive healthcare solutions that empower you to take charge of your well-being.
            With a dedicated team of professionals and a focus on innovation, we provide expert guidance tailored to your needs.
            Together, we aim to create a healthier future for everyone.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutUs;
