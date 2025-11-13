export function Select(props: any) {
  return (
    <select
      {...props}
      className={`w-full border rounded-lg px-3 py-2 ${props.className}`}
    />
  );
}
