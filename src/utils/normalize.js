export function normalizeRecord(record, index) {
  const id =
    record.id ??
    record.ID ??
    record.employee_id ??
    record.employeeId ??
    record.empid ??
    record.EmpID ??
    record.code ??
    `${index + 1}`

  const name =
    record.name ??
    record.Name ??
    record.employee_name ??
    record.employeeName ??
    record.full_name ??
    `Employee ${index + 1}`

  const city =
    record.city ??
    record.City ??
    record.location ??
    record.Location ??
    'Unknown'

  const salaryRaw =
    record.salary ??
    record.Salary ??
    record.ctc ??
    record.CTC ??
    record.monthly_salary ??
    record.monthlySalary ??
    0

  const salary = Number.parseFloat(String(salaryRaw).replace(/[^\d.]/g, '')) || 0

  const department =
    record.department ??
    record.Department ??
    record.team ??
    record.Team ??
    'Operations'

  const email =
    record.email ??
    record.Email ??
    `${String(name).toLowerCase().replace(/\s+/g, '.')}@company.com`

  return {
    ...record,
    id: String(id),
    name: String(name),
    city: String(city),
    salary,
    department: String(department),
    email: String(email),
  }
}
