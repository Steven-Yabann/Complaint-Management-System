import React from "react";
import { Link } from "react-router-dom";
import '../styling/home.css';

const Home= () => {
    return(
        <div className="home-container">
        <header className="hero-section">
          <h1>Welcome to the Strathmore Complaint Management System</h1>
          <p className="subtitle">
            A platform for students and staff to report and track complaints efficiently
          </p>
          
          <div className="cta-buttons">
            <Link to="/login" className="btn primary">Log In</Link>
            <Link to="/register" className="btn secondary">Register</Link>
          </div>
        </header>
  
        <section className="features-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>File Complaints</h3>
              <p>Easily submit complaints with detailed descriptions and categories</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Track Status</h3>
              <p>Monitor the progress of your complaints in real-time</p>
            </div>
            
            <div className="feature-card">
             <div className="feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>Real-time tracking of complaint resolution rates and department performance metrics</p>
            </div>
          </div>
        </section>
  
        <section className="about-section">
          <h2>About the System</h2>
          <p>
            The Strathmore Complaint Management System is designed to streamline the process
            of reporting and resolving issues within the university. Our goal is to provide
            a transparent, efficient, and user-friendly platform for all members of the
            Strathmore community.
          </p>
        </section>
      </div>
    );
};

export default Home;