// frontend/src/components/FeedbackModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types'; // Good practice for prop type validation
import '../styling/notification.css'; // Contains styling for the modal itself

/**
 * FeedbackModal component allows users to submit a star rating and an optional description
 * for a specific complaint.
 * @param {object} props - The component props.
 * @param {object} props.complaint - The complaint object for which feedback is being given.
 * @param {string} props.notificationId - The ID of the notification linked to this feedback, used to update its status.
 * @param {function} props.onClose - Function to call when the modal is to be closed (e.g., by clicking Cancel).
 * @param {function} props.onFeedbackSubmitted - Function to call after successful feedback submission.
 */
const FeedbackModal = ({ complaint, notificationId, onClose, onFeedbackSubmitted }) => {
    const [rating, setRating] = useState(0); // State for the selected star rating (0-5)
    const [description, setDescription] = useState(''); // State for the feedback description
    const [message, setMessage] = useState(''); // State for displaying messages (success/error)
    const [loading, setLoading] = useState(false); // State to indicate submission is in progress

    /**
     * Handles clicking on a star to set the rating.
     * @param {number} starValue - The numerical value of the star clicked (1 to 5).
     */
    const handleStarClick = (starValue) => {
        setRating(starValue);
    };

    /**
     * Handles the submission of the feedback form.
     * Sends the feedback data to the backend API.
     * @param {Object} e - The event object from the form submission.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setMessage('');     // Clear previous messages
        setLoading(true);   // Start loading indicator

        // Basic client-side validation
        if (rating === 0) {
            setMessage('Please provide a star rating.');
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('You must be logged in to submit feedback.');
            setLoading(false);
            return;
        }

        try {
            // Send feedback data to your backend API
            const response = await fetch('http://localhost:4000/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include JWT token for authentication
                },
                body: JSON.stringify({
                    complaintId: complaint._id, // The ID of the complaint being reviewed
                    rating,                     // The star rating
                    description,                // The feedback description
                    notificationId              // Pass the notification ID to backend to update its 'feedbackGiven' status
                })
            });

            const data = await response.json(); // Parse the response

            if (response.ok) {
                setMessage(data.message || 'Feedback submitted successfully!');
                // Call the parent component's callback function to handle success (e.g., close modal, update notification state)
                onFeedbackSubmitted();
            } else {
                setMessage(data.message || 'Failed to submit feedback.');
                console.error('Feedback submission error:', data);
            }
        } catch (err) {
            setMessage('Network error: Could not submit feedback.');
            console.error('Network error submitting feedback:', err);
        } finally {
            setLoading(false); // End loading indicator
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content feedback-modal">
                <h3>Provide Feedback for Complaint:</h3>
                <h4>"{complaint.title}"</h4> {/* Display the complaint's title */}
                {message && (
                    <div className={`form-message ${message.includes('successful') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="feedback-form">
                    <div className="form-group rating-group">
                        <label>Your Rating:</label>
                        <div className="stars">
                            {/* Render 5 star icons. 'filled' class applies styling if star is less than or equal to current rating */}
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`star ${star <= rating ? 'filled' : ''}`}
                                    onClick={() => handleStarClick(star)}
                                >
                                    &#9733; {/* Unicode star character */}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Comments (Optional):</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell us more about your experience..."
                            rows="4" // Sets initial height
                            maxLength="500" // Limits character count
                        ></textarea>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-confirm" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Define PropTypes for type-checking props (good for development and debugging)
FeedbackModal.propTypes = {
    complaint: PropTypes.object.isRequired,
    notificationId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onFeedbackSubmitted: PropTypes.func.isRequired,
};

export default FeedbackModal;