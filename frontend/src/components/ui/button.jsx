const Button = ({ children, type = "button", variant = "primary", ...props }) => {
    const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors";
    const variants = {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      outline: "border border-gray-300 hover:bg-gray-50",
      destructive: "bg-red-500 text-white hover:bg-red-600"
    };
  
    return (
      <button
        type={type}
        className={`${baseStyles} ${variants[variant]}`}
        {...props}
      >
        {children}
      </button>
    );
  };
  
  export { Button };