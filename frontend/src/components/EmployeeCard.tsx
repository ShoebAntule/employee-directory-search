import { ArrowUpRight } from "lucide-react";
import type { Employee } from "../types/employee";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const tones = ["blue", "violet", "amber", "teal", "pink"];

export function EmployeeCard({ employee }: { employee: Employee }) {
  const initials = employee.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const joined = dateFormatter.format(
    new Date(`${employee.date_of_joining}T00:00:00Z`),
  );

  return (
    <article className="employee-card" aria-label={employee.name}>
      <div className="person-cell">
        <span
          className={`person-avatar tone-${tones[employee.id % tones.length]}`}
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="person-details">
          <h3>{employee.name}</h3>
          <span className="person-email" title={employee.email}>
            {employee.email}
          </span>
        </div>
      </div>
      <div className="role-cell">
        <span className="cell-label">ROLE</span>
        <p>{employee.designation}</p>
        <span className="employee-id">
          ID {String(employee.id).padStart(4, "0")}
        </span>
      </div>
      <div className="department-cell">
        <span className="cell-label">DEPARTMENT</span>
        <span className="department-badge">{employee.department}</span>
      </div>
      <div className="joined-cell">
        <span className="cell-label">JOINED</span>
        <time dateTime={employee.date_of_joining}>{joined}</time>
      </div>
      <a
        className="contact-button"
        href={`mailto:${employee.email}`}
        aria-label={`Email ${employee.name}`}
        title={`Email ${employee.name}`}
      >
        <ArrowUpRight size={19} aria-hidden="true" />
      </a>
    </article>
  );
}
