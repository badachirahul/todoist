/** Round avatar: the user's image if present, else a colored initial circle. */
export default function Avatar({ name, avatarUrl, size = 28, className = "" }) {
  const initial = (name?.[0] || "?").toUpperCase();
  const style = { width: size, height: size };
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || ""}
        referrerPolicy="no-referrer"
        style={style}
        className={`flex-none rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
      className={`flex flex-none items-center justify-center rounded-full bg-emerald-600 font-semibold text-white ${className}`}
    >
      {initial}
    </span>
  );
}
