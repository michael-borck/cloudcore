---
title: "Understanding SQL Injection Attacks"
unit: "cybersecurity-basics"
categories: "Lab"
difficulty: "Intermediate"
description: "Learn how SQL injection vulnerabilities work and how to prevent them through hands-on exercises with CloudCore's database"
date: 2024-07-27
---

## Learning Objectives

By the end of this scenario, students will be able to:
- Identify SQL injection vulnerabilities in web applications
- Demonstrate basic SQL injection techniques in a controlled environment
- Implement secure coding practices to prevent SQL injection

## Scenario Background

CloudCore Networks recently hired a junior developer who created a customer login portal. During a routine security audit, Samuel Torres (Security Compliance Officer) discovered potential vulnerabilities. Your task is to investigate and document these security issues.

## Part 1: Discovery

The login page is located at `/customer-portal/login`. The developer mentioned they "kept it simple" by building SQL queries directly from user input.

### Task 1.1: Code Review
Review the following code snippet from the login function:

```python
def check_login(username, password):
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    result = db.execute(query)
    return len(result) > 0
```

**Question**: What security vulnerability do you see in this code?

### Task 1.2: Testing the Vulnerability
Try these inputs in the username field (password can be anything):

1. `admin'--`
2. `' OR '1'='1`
3. `admin'; DROP TABLE users;--`

**Document**: What happens with each input? Why?

## Part 2: Exploitation Analysis

### Task 2.1: Understanding the Attack
The SQL injection works because user input is directly concatenated into the SQL query. When we input `admin'--`, the resulting query becomes:

```sql
SELECT * FROM users WHERE username='admin'--' AND password='anything'
```

The `--` comments out the rest of the query, bypassing password validation.

### Task 2.2: Data Extraction
More sophisticated attacks can extract data. Try this username:
```
' UNION SELECT null, database(), version()--
```

**Investigate**: What information does this reveal about CloudCore's infrastructure?

## Part 3: Remediation

### Task 3.1: Secure Code Implementation
Rewrite the login function using parameterized queries:

```python
def check_login_secure(username, password):
    query = "SELECT * FROM users WHERE username=? AND password=?"
    result = db.execute(query, (username, password))
    return len(result) > 0
```

### Task 3.2: Additional Security Measures
List three additional security measures CloudCore should implement:
1. _____________
2. _____________
3. _____________

## Part 4: Incident Response

You've discovered that this vulnerability has been in production for 3 months.

### Task 4.1: Impact Assessment
Interview the following CloudCore staff (chatbots) to assess potential impact:
- **Jamal Al-Sayed** (Data Analyst) - Ask about unusual database activity
- **Samuel Torres** (Security Officer) - Discuss compliance implications
- **Michael Thompson** (Lead Developer) - Review code deployment practices

### Task 4.2: Incident Report
Create a brief incident report including:
- Vulnerability description
- Potential impact
- Remediation steps
- Lessons learned

## Submission Requirements

1. Completed answers to all questions
2. Screenshot evidence of successful SQL injection (in test environment)
3. Your secure code implementation
4. Incident report (300-500 words)

## Resources

- [CloudCore Security Policy](/docs/policies/sdlc)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- CloudCore Database ERD: `/docs/support/erd`

## Hints for Students

<details>
<summary>Hint 1: Can't get SQL injection to work?</summary>
Remember that comments in SQL can be `--` or `#`. Also ensure you're closing the quote properly with `'`.
</details>

<details>
<summary>Hint 2: Interview questions</summary>
Ask Jamal about "unusual SELECT queries" or "database performance issues". Ask Samuel about "PCI compliance" and "data breach notification requirements".
</details>

---
*This scenario is part of CloudCore Networks' educational platform. All vulnerabilities are intentional and should only be tested in this controlled environment.*