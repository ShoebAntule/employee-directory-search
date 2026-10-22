import { ArrowUpRight, CalendarDays, Mail } from "lucide-react";
import type { Employee } from "../types/employee";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const tones = ["sage", "sand", "lilac", "blue", "rose"];

export function EmployeeCard({ employee }: { employee: Employee }) {
  const initials = employee.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const joined = dateFormatter.format(
    new Date(`${employee.date_of_joining}T00:00:00Z`),
  );
  return (
    <article className="employee-card">
      <div className="card-top">
        <span
          className={`avatar ${tones[employee.id % tones.length]}`}
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="department-badge">{employee.department}</span>
      </div>
      <h3>{employee.name}</h3>
      <p className="designation">{employee.designation}</p>
      <a className="email-link" href={`mailto:${employee.email}`}>
        <Mail size={15} aria-hidden="true" />
        <span>{employee.email}</span>
        <ArrowUpRight className="email-arrow" size={15} aria-hidden="true" />
      </a>
      <div className="card-footer">
        <CalendarDays size={14} aria-hidden="true" />
        <span>Joined {joined}</span>
        <span className="employee-id">
          #{String(employee.id).padStart(4, "0")}
        </span>
      </div>
    </article>
  );
}
