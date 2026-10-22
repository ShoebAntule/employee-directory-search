import { Mail } from "lucide-react";
import type { Employee } from "../types/employee";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function EmployeeCard({ employee }: { employee: Employee }) {
  const initials = employee.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <tr>
      <th scope="row">
        <div className="person">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="employee-name">{employee.name}</span>
        </div>
      </th>
      <td data-label="Email">
        <span className="email-address">{employee.email}</span>
      </td>
      <td data-label="Designation">{employee.designation}</td>
      <td data-label="Department">
        <span className="department-tag">
          <span aria-hidden="true" />
          {employee.department}
        </span>
      </td>
      <td data-label="Joining date">
        <time dateTime={employee.date_of_joining}>
          {dateFormatter.format(
            new Date(`${employee.date_of_joining}T00:00:00Z`),
          )}
        </time>
      </td>
      <td className="contact-cell">
        <a
          href={`mailto:${employee.email}`}
          aria-label={`Email ${employee.name}`}
        >
          <Mail size={18} aria-hidden="true" />
          <span>Email</span>
        </a>
      </td>
    </tr>
  );
}
