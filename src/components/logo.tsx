export default function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 17v-5" />
      <path d="M12 17v-1" />
      <path d="M15 17v-3" />
      <path d="m9 9-2 2" />
      <path d="m15 9 2 2" />
      <path d="M9 7h6" />
      <path d="M12 21a9 9 0 0 0 9-9" />
      <path d="M3 12a9 9 0 0 1 .1-1" />
      <path d="M4.2 4.2A9 9 0 0 0 3 12" />
      <path d="M20.9 11A9 9 0 0 1 12 21" />
    </svg>
  );
}
