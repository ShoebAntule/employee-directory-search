import argparse
import json

from sqlalchemy import text
from sqlalchemy.dialects import mysql

from app.db.session import get_engine
from app.repositories.employee import EmployeeRepository


def main():
    parser = argparse.ArgumentParser(description="Inspect the MySQL employee search query plan.")
    parser.add_argument("search")
    args = parser.parse_args()
    statement = EmployeeRepository.search_statement(args.search.strip(), 0, 21)
    compiled = statement.compile(dialect=mysql.dialect(), compile_kwargs={"literal_binds": True})
    with get_engine().connect() as connection:
        plan = connection.execute(text("EXPLAIN FORMAT=JSON " + str(compiled))).scalar_one()
        print(json.dumps(json.loads(plan), indent=2))
    get_engine().dispose()


if __name__ == "__main__":
    main()
