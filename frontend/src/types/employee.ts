export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  date_of_joining: string;
}

export interface EmployeePage {
  items: Employee[];
  next_cursor: string | null;
  has_more: boolean;
}
