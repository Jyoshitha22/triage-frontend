import "./Button.css";

function Button({ children, onClick, variant = "primary", type = "button" }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;