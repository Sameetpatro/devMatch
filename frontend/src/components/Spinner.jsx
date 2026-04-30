export default function Spinner({ size = 24 }) {
  const px = `${size}px`;
  return (
    <div
      className="animate-spin rounded-full border-2 border-brand-200 border-t-brand-500"
      style={{ width: px, height: px }}
      role="status"
      aria-label="Loading"
    />
  );
}
