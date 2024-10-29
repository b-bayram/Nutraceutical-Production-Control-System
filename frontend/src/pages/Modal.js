import React from 'react';
import './Modal.css';

//pop up module

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>X</button>
        {children} {/* Render any content passed to the modal */}
      </div>
    </div>
  );
};

export default Modal;