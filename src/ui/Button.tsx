export function Button({
  children,
  onClick,
  color = "primary",
  className = "",
  ...rest
}: any) {
  const colors: any = {
    primary: "bg-hsmBlue hover:bg-hsmCyan text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    gray: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition font-semibold ${colors[color]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
