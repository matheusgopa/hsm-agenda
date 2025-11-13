export function Input(props: any) {
  return (
    <input
      {...props}
      className={`w-full border rounded-lg px-3 py-2 ${props.className}`}
    />
  );
}
