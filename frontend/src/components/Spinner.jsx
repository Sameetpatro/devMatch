export default function Spinner({ size = 24 }) {
  const px = `${size}px`;
  return (
    <div
      className="animate-spin rounded-full border-2 border-amber-200 border-t-pink-500 border-r-amber-400"
      style={{ width: px, height: px }}
      role="status"
      aria-label="Loading"
    />
  );
}
