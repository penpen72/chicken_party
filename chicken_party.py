
import random

def simulate_chicken_party_chinese(people, year):
    """
    Simulate a chicken party each year until all employees leave, with outputs in traditional Chinese.

    Args:
    people (int): Number of initial employees.
    year (int): The starting year.

    Returns:
    str: Summary of the simulation in traditional Chinese.
    """
    initial_people = people
    years_passed = 0

    while people > 0:
        # Display party information in traditional Chinese
        print(f"年份: {year}, 參加人數: {people}")
        print("舉辦chicken party中...")

        # Simulate whether someone leaves
        if random.random() < 0.5 * people:  # Adjusted probability for more realism
            people -= 1
            print("有人離開了派對。")
        else:
            print("每個人都留下了。")

        # Increment year and calculate years passed
        year += 1
        years_passed += 1

    return f"共有{initial_people}人在{years_passed}年內全部離職。"

# Example usage
simulate_chicken_party_chinese(5, 2013)
