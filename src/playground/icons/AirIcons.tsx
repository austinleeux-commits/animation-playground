/*
 * Icons traced from the Figma exports in this directory (Icons/Navigation&Location
 * and Icons/Status,Alerts&Presence). Path data and the 16px box are unchanged —
 * only the hardcoded stroke colors became currentColor so they can inherit and
 * animate with their row's text color.
 */

type IconProps = {
  className?: string
}

export function LightbulbIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M7.99927 1.83333C5.32959 1.83333 3.16537 3.99755 3.16537 6.66727C3.16537 8.22887 3.90588 9.6176 5.05493 10.5013C5.08043 10.5209 5.10614 10.5403 5.13205 10.5594C5.53765 10.8587 5.83183 11.3073 5.83183 11.8114V12.6659C5.83183 13.8629 6.80227 14.8333 7.99927 14.8333C9.19633 14.8333 10.1667 13.8629 10.1667 12.6659V11.8114C10.1667 11.3073 10.4609 10.8587 10.8665 10.5594C10.8925 10.5403 10.9181 10.5209 10.9437 10.5013C12.0927 9.6176 12.8332 8.22887 12.8332 6.66727C12.8332 3.99755 10.669 1.83333 7.99927 1.83333Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83203 11.8333H10.1669"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.827 5.45679L8.3624 4.24889C8.30473 4.09895 8.16067 4 8 4C7.83933 4 7.69527 4.09895 7.6376 4.24889L7.173 5.45679C7.10533 5.63285 6.9662 5.77198 6.79013 5.8397L5.58223 6.30427C5.43228 6.36195 5.33333 6.50601 5.33333 6.66667C5.33333 6.82733 5.43228 6.9714 5.58223 7.02907L6.79013 7.49367C6.9662 7.56133 7.10533 7.70047 7.173 7.87653L7.6376 9.08447C7.69527 9.2344 7.83933 9.33333 8 9.33333C8.16067 9.33333 8.30473 9.2344 8.3624 9.08447L8.827 7.87653C8.89467 7.70047 9.0338 7.56133 9.20987 7.49367L10.4178 7.02907C10.5677 6.9714 10.6667 6.82733 10.6667 6.66667C10.6667 6.50601 10.5677 6.36195 10.4178 6.30427L9.20987 5.8397C9.0338 5.77198 8.89467 5.63285 8.827 5.45679Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M5.5 3L10.5 8L5.5 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The 34px title chevron — heavier stroke, not a scaled-up ChevronIcon. */
export function TitleChevronIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden
    >
      <path
        d="M11.6875 6.375L22.3125 17L11.6875 27.625"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 8.5L7 12.5L13 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CircleIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** In-progress marker: a circle with three dots. */
export function DotsCircleIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M13.25 8C13.25 5.1005 10.8995 2.75 8 2.75C5.10051 2.75 2.75 5.10051 2.75 8C2.75 10.8995 5.1005 13.25 8 13.25C10.8995 13.25 13.25 10.8995 13.25 8ZM6.5 8C6.5 8.55227 6.0523 9 5.5 9C4.9477 9 4.5 8.55227 4.5 8C4.5 7.44773 4.9477 7 5.5 7C6.0523 7 6.5 7.44773 6.5 8ZM9 8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8C7 7.44772 7.44772 7 8 7C8.55228 7 9 7.44772 9 8ZM11.5 8C11.5 8.55228 11.0523 9 10.5 9C9.94772 9 9.5 8.55228 9.5 8C9.5 7.44772 9.94772 7 10.5 7C11.0523 7 11.5 7.44772 11.5 8ZM14.75 8C14.75 11.7279 11.7279 14.75 8 14.75C4.27208 14.75 1.25 11.7279 1.25 8C1.25 4.27208 4.27208 1.25 8 1.25C11.7279 1.25 14.75 4.27208 14.75 8Z"
        fill="currentColor"
      />
    </svg>
  )
}
