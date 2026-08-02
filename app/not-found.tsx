import Link from "next/link";

export default function NotFound() {
  const year = new Date().getUTCFullYear();
  return <main className="error-page"><div><span className="eyebrow">That date got away</span><h1>Calendar not found.</h1><p>Try a valid year and month, and we’ll forge it fresh.</p><Link className="button button-accent" href={`/calendar/${year}`}>Open {year}</Link></div></main>;
}
