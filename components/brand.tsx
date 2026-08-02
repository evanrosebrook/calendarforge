import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Calendar Forge home">
      <span className="brand-mark" aria-hidden="true"><span>31</span></span>
      <span>Calendar Forge</span>
    </Link>
  );
}
