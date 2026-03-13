import re
from typing import List, Dict, Optional
from datetime import datetime
import json


def _bullet_items(text: str) -> List[str]:
    """Extract bullet items (allow indented lines)."""
    return re.findall(r"(?m)^\s*[-•*]\s*([^\n]+)", text or "")


def _build_week_dict(week_number: int, week_topic: str, week_content: str) -> Dict:
    """Build a single week dict from parsed header and content."""
    week = {
        "weekNumber": week_number,
        "topic": week_topic,
        "whatYoullLearn": [],
        "studyPlan": [],
        "handsOnPractice": [],
        "resources": [],
        "successCriteria": [],
    }
    # Extract "What You'll Learn"
    learn_match = re.search(
        r"[-]?\s*\*\*What You'll Learn[:\s]*\*\*(.*?)(?=\*\*|$)",
        week_content,
        re.IGNORECASE | re.DOTALL,
    )
    if learn_match:
        items = _bullet_items(learn_match.group(1))
        week["whatYoullLearn"] = [item.strip() for item in items if item.strip()]
    # Extract Study Plan
    study_match = re.search(
        r"[-]?\s*\*\*Study Plan[:\s]*\*\*(.*?)(?=\*\*|$)",
        week_content,
        re.IGNORECASE | re.DOTALL,
    )
    if study_match:
        items = _bullet_items(study_match.group(1))
        for item in items:
            text = item.strip()
            day_match = re.match(
                r"^(Day\s*\d+[-\s]*\d*)[:\s-]*(.*)", text, re.IGNORECASE
            )
            if day_match:
                week["studyPlan"].append(
                    {
                        "dayRange": day_match.group(1).strip(),
                        "content": day_match.group(2).strip(),
                    }
                )
            else:
                week["studyPlan"].append({"dayRange": "General", "content": text})
    # Extract Hands-on Practice
    practice_match = re.search(
        r"[-]?\s*\*\*Hands[-\s]*on\s*Practice[:\s]*\*\*(.*?)(?=\*\*|$)",
        week_content,
        re.IGNORECASE | re.DOTALL,
    )
    if practice_match:
        items = _bullet_items(practice_match.group(1))
        week["handsOnPractice"] = [item.strip() for item in items if item.strip()]
    # Extract Resources
    resources_match = re.search(
        r"[-]?\s*\*\*(?:Free\s+)?Resources[:\s]*\*\*(.*?)(?=\*\*|$)",
        week_content,
        re.IGNORECASE | re.DOTALL,
    )
    if resources_match:
        for item in _bullet_items(resources_match.group(1)):
            text = item.strip()
            url_match = re.search(r"\[([^\]]+)\]\(([^)]+)\)", text)
            if url_match:
                week["resources"].append(
                    {"name": url_match.group(1), "url": url_match.group(2)}
                )
            else:
                week["resources"].append({"name": text, "url": ""})
    # Extract Success Criteria
    criteria_match = re.search(
        r"[-]?\s*\*\*Success\s*Criteria[:\s]*\*\*(.*?)(?=\*\*|$)",
        week_content,
        re.IGNORECASE | re.DOTALL,
    )
    if criteria_match:
        items = _bullet_items(criteria_match.group(1))
        week["successCriteria"] = [item.strip() for item in items if item.strip()]
    if not week["whatYoullLearn"] and not week["studyPlan"]:
        week["whatYoullLearn"] = [item.strip() for item in _bullet_items(week_content)]
    return week


def parse_roadmap_content(
    content: str, job_details: Optional[Dict[str, str]] = None
) -> Dict:
    """
    Parse markdown roadmap content into structured data

    Args:
        content: Markdown formatted roadmap content
        job_details: Optional dict with company, role, location

    Returns:
        Structured roadmap data matching Pydantic model
    """
    job_details = job_details or {}
    if not isinstance(content, str):
        content = str(content)
    # Normalize newlines (handle literal \n if content was double-encoded or from some clients)
    content = content.replace("\\n", "\n").replace("\\r\\n", "\n").replace("\\r", "\n")

    # Initialize result
    result = {
        "title": "",
        "targetCompany": job_details.get("company", ""),
        "roleTitle": job_details.get("role", ""),
        "totalDurationWeeks": 0,
        "totalSkills": 0,
        "skills": [],
        "weeks": [],
        "metadata": {
            "location": job_details.get("location", ""),
            "createdAt": datetime.utcnow().isoformat(),
        },
    }

    lines = content.split("\n")

    # Title: prefer explicit job_details (company - role) over LLM-generated heading
    if job_details.get("company") and job_details.get("role"):
        result["title"] = f"{job_details['company']} - {job_details['role']}"
    else:
        # Fall back to extracting from markdown heading
        for line in lines:
            if line.startswith("# ") or line.startswith("## "):
                result["title"] = re.sub(r"^#{1,2}\s+", "", line).strip()
                break
        if not result["title"]:
            result["title"] = "Learning Roadmap"

    # Extract skills
    skills_match = re.search(
        r"##\s*Skills?\s*Analysis(.*?)(?=##|$)", content, re.IGNORECASE | re.DOTALL
    )

    if skills_match:
        skills_content = skills_match.group(1)
        skill_items = re.findall(r"[-•*]\s*([^\n]+)", skills_content)
        result["skills"] = [
            re.sub(r"\*\*", "", item).strip() for item in skill_items if item.strip()
        ]
        result["totalSkills"] = len(result["skills"])

    # Extract weeks - support multiple formats from generated roadmaps:
    #   **Week 1-2: Java/J2EE**   (bold with range)
    #   ### Week 1: Topic         (heading)
    #   #### Weeks 1-2: Topic     (heading with range)
    #   Week 1: Topic             (no markdown)
    # Topic: capture until we hit ** or newline (use greedy so we get full topic)
    week_header = r"(?:^|\n)(?:#{1,4}\s*|\*\*)\s*Weeks?\s+(\d+)(?:-(\d+))?\s*[:\-]?\s*([^\n*#]+)(?:\s*\*\*)?"
    # Stop at next week header (**Week or # Week) or any ## / ### section
    week_content_until_next = r"(.*?)(?=(?:^|\n)\s*(?:\*\*Week\s|Week\s+\d|#+\s)|\Z)"
    combined = re.compile(
        week_header + r"\s*" + week_content_until_next, re.IGNORECASE | re.DOTALL
    )
    week_matches = list(combined.finditer(content))

    # Fallback: if no weeks found but content clearly has **Week N** format, split manually
    if not week_matches and re.search(r"\*\*Week\s+\d", content, re.IGNORECASE):
        # Split by **Week or just Week to handle various formats
        parts = re.split(
            r"(?=(\n\s*\*\*Week\s+\d)|(\n\s*Week\s+\d))", content, flags=re.IGNORECASE
        )
        for part in parts:
            part = part.lstrip("\n\r")
            if not re.search(r"(\*\*Week\s+\d)|(Week\s+\d)", part, re.IGNORECASE):
                continue
            head = re.match(
                r"^\s*(\*\*)?Weeks?\s+(\d+)(?:-(\d+))?\s*[:\-]?\s*([^\n*#]+)(?:\s*\*\*)?\s*",
                part,
                re.IGNORECASE | re.DOTALL,
            )
            if not head:
                continue
            first_num = int(head.group(2))
            second_num = head.group(3)
            week_topic = head.group(4).strip() or f"Week {first_num}"
            week_content = part[head.end() :]

            # Expand week ranges
            if second_num:
                end_num = int(second_num)
                for week_num in range(first_num, end_num + 1):
                    result["weeks"].append(
                        _build_week_dict(week_num, week_topic, week_content)
                    )
            else:
                result["weeks"].append(
                    _build_week_dict(first_num, week_topic, week_content)
                )
        result["totalDurationWeeks"] = len(result["weeks"])
        return result

    for match in week_matches:
        first_num = int(match.group(1))
        second_num = match.group(2)
        week_topic = match.group(3).strip() or f"Week {first_num}"
        week_content = match.group(4)

        # Expand week ranges (e.g., Week 1-2 creates 2 separate weeks)
        if second_num:
            end_num = int(second_num)
            for week_num in range(first_num, end_num + 1):
                week = _build_week_dict(week_num, week_topic, week_content)
                result["weeks"].append(week)
        else:
            week = _build_week_dict(first_num, week_topic, week_content)
            result["weeks"].append(week)

    result["totalDurationWeeks"] = len(result["weeks"])

    return result


def extract_skills_from_content(content: str) -> List[str]:
    """Extract skills from markdown content"""
    skills = set()

    # Extract from Skills Analysis section
    skills_match = re.search(
        r"##\s*Skills?\s*Analysis(.*?)(?=##|$)", content, re.IGNORECASE | re.DOTALL
    )

    if skills_match:
        skill_items = re.findall(r"[-•*]\s*([^\n]+)", skills_match.group(1))
        for item in skill_items:
            skill = re.sub(r"\*\*", "", item).strip()
            if skill:
                skills.add(skill)

    # Common tech keywords
    tech_keywords = [
        "Java",
        "Python",
        "JavaScript",
        "React",
        "Node.js",
        "AWS",
        "Docker",
        "Kubernetes",
        "SQL",
        "MongoDB",
        "Redis",
        "Kafka",
        "Spring Boot",
        "REST API",
        "GraphQL",
        "TypeScript",
        "Git",
        "CI/CD",
        "Microservices",
    ]

    for keyword in tech_keywords:
        if re.search(rf"\b{keyword}\b", content, re.IGNORECASE):
            skills.add(keyword)

    return list(skills)
