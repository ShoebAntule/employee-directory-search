import type { Employee } from "../types/employee";
import { EmployeeCard } from "./EmployeeCard";

export function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <div className="employee-list">
      <div className="list-head" aria-hidden="true">
        <span>EMPLOYEE</span>
        <span>ROLE / EMPLOYEE ID</span>
        <span>DEPARTMENT</span>
        <span>DATE JOINED</span>
        <span />
      </div>
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}

export function EmployeeSkeletons() {
  return (
    <div className="employee-list skeleton-list" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <div className="skeleton-person">
            <div className="skeleton skeleton-avatar" />
            <div>
              <div className="skeleton skeleton-name" />
              <div className="skeleton skeleton-email" />
            </div>
          </div>
          <div className="skeleton skeleton-role" />
          <div className="skeleton skeleton-team" />
          <div className="skeleton skeleton-date" />
        </div>
      ))}
    </div>
  );
}
