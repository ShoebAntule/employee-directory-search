import { EmployeeCard } from "./EmployeeCard";
import type { Employee } from "../types/employee";

export function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <div className="employee-grid">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}

export function EmployeeSkeletons() {
  return (
    <div className="employee-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="employee-card skeleton-card" key={index}>
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-footer" />
        </div>
      ))}
    </div>
  );
}
