import type { Employee } from "../types/employee";
import { EmployeeCard } from "./EmployeeCard";

export function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <table className="employee-table">
      <caption className="sr-only">Employee search results</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
          <th scope="col">Designation</th>
          <th scope="col">Department</th>
          <th scope="col">Joining date</th>
          <th scope="col">Contact</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </tbody>
    </table>
  );
}

export function EmployeeSkeletons() {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <span className="skeleton skeleton-avatar" />
          <span className="skeleton" />
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      ))}
    </div>
  );
}
