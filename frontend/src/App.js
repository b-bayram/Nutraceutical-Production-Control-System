import React, { useState } from 'react';
import './App.css';

function App() {
  const [info, setInfo] = useState('This is the upper section');
  const [listItems, setListItems] = useState(['Item 1', 'Item 2', 'Item 3', 'Item 4']);
  const [isDropdownOpen, setDropdownOpen] = useState(false); // State to manage dropdown visibility

  const handleOptionClick = (newInfo) => {
    setInfo(newInfo);
    setDropdownOpen(false); // Close dropdown when an option is clicked
  };

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen); // Toggle dropdown visibility
  };

  return (
    <div className="App">
      {/* Options Bar (top-left) */}
      <div className="options-bar">
        <button onClick={toggleDropdown} className="dropdown-button">
          =
        </button>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <button onClick={() => handleOptionClick('Info 1')}>Option 1</button>
            <button onClick={() => handleOptionClick('Info 2')}>Option 2</button>
            <button onClick={() => handleOptionClick('Info 3')}>Option 3</button>
            <button onClick={() => handleOptionClick('Info 4')}>Option 4</button>
          </div>
        )}
      </div>

      {/* Upper Section */}
      <div className="upper-section">
        <h1>{info}</h1>
      </div>

      {/* Lower Section - List */}
      <div className="lower-section">
        <ul>
          {listItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
