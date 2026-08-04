import React from "react";
import "./ProfileCard.css";
import {
  FiHeart,
  FiMail,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";

const ProfileCard = () => {
  return (
    <div className="profile-card">

      {/* Top Labels */}
      <div className="card-header">
        <div className="tag ignore">
          <FiXCircle />
          Ignore
        </div>

        <div className="tag interested">
          <FiHeart />
          Interested
        </div>
      </div>

      <div className="card-content">

        {/* Left Side */}
        <div className="profile-details">
          <h1>Daniel</h1>

          <div className="info">
            <FiMail />
            <span>daniel@gmail.com</span>
          </div>

          <div className="status">
            <span className="dot"></span>
            Available to connect
          </div>

          <div className="connect-card">
            <div className="connect-icon">✨</div>

            <div>
              <h3>Open to connect</h3>
              <p>Send a request to start a conversation.</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="profile-image">
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600"
            alt="profile"
          />
        </div>

      </div>

      {/* Buttons */}
      <div className="actions">

        <button className="ignore-btn">
          <FiXCircle />
          Ignore
        </button>

        <button className="interest-btn">
          <FiHeart />
          Interested
        </button>

      </div>

    </div>
  );
};

export default ProfileCard;