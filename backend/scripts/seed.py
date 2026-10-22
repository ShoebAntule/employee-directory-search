from datetime import date

from sqlalchemy.dialects.mysql import insert

from app.db.session import get_engine, get_session_factory
from app.models.employee import Employee

PEOPLE = [
    ("Rahul Sharma", "Engineering", "Senior Software Engineer"),
    ("Aisha Khan", "Engineering", "Frontend Engineer"),
    ("Priya Nair", "Design", "Product Designer"),
    ("Arjun Mehta", "Product", "Product Manager"),
    ("Sneha Iyer", "People", "People Operations Lead"),
    ("Vikram Patel", "Engineering", "Backend Engineer"),
    ("Neha Desai", "Finance", "Financial Analyst"),
    ("Kabir Sethi", "Marketing", "Growth Strategist"),
    ("Meera Joshi", "Design", "UX Researcher"),
    ("Rohan Gupta", "Engineering", "Platform Engineer"),
    ("Sara Fernandes", "Customer Success", "Customer Success Manager"),
    ("Dev Malhotra", "Engineering", "QA Engineer"),
    ("Ananya Rao", "Product", "Product Analyst"),
    ("Rahul Verma", "Marketing", "Content Strategist"),
    ("Fatima Shaikh", "Engineering", "Software Engineer"),
    ("Ishaan Kapoor", "Design", "Visual Designer"),
    ("Tara Menon", "People", "Talent Partner"),
    ("Aditya Singh", "Engineering", "DevOps Engineer"),
    ("Zoya Ansari", "Finance", "Finance Associate"),
    ("Kunal Shah", "Customer Success", "Support Engineer"),
    ("Rhea Dutta", "Marketing", "Brand Designer"),
    ("Omar Siddiqui", "Engineering", "Data Engineer"),
    ("Nisha Thomas", "Product", "Associate Product Manager"),
    ("Sahil Bhat", "Engineering", "Mobile Engineer"),
    ("Rashmi Kulkarni", "Design", "Design Systems Lead"),
    ("Sameer Ali", "Engineering", "Security Engineer"),
    ("Pooja Das", "People", "HR Associate"),
    ("Rehan Qureshi", "Engineering", "Full Stack Engineer"),
    ("Diya Bose", "Marketing", "Marketing Analyst"),
    ("Rahul Narang", "Engineering", "Engineering Manager"),
    ("Avni Trivedi", "Engineering", "Frontend Engineer"),
    ("Farhan Syed", "Engineering", "Infrastructure Engineer"),
    ("Sana Mirza", "Engineering", "Software Engineer"),
    ("Vihaan Jain", "Engineering", "QA Engineer"),
    ("Anika Roy", "Design", "Interaction Designer"),
    ("Yash Arora", "Product", "Product Operations Associate"),
]


def seed():
    rows = [
        {
            "name": name,
            "email": name.lower().replace(" ", ".") + "@example.test",
            "department": department,
            "designation": designation,
            "date_of_joining": date(2021 + i % 5, 1 + i % 12, 1 + i % 25),
        }
        for i, (name, department, designation) in enumerate(PEOPLE)
    ]
    statement = insert(Employee).values(rows)
    with get_session_factory()() as session:
        session.execute(statement.on_duplicate_key_update(email=statement.inserted.email))
        session.commit()
    get_engine().dispose()
    print("Sample employees are ready (existing email addresses were preserved).")


if __name__ == "__main__":
    seed()
