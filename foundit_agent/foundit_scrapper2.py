import csv
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Union
import time
import re

def extract_job_details_from_text(url: str, content: str) -> Dict[str, str]:
    """
    Parse the job description text to extract structured details.
    """
    details = {
        'url': url,
        'job_title': 'N/A',
        'company': 'N/A',
        'location': 'N/A',
        'salary': 'N/A',
        'skills': 'N/A',
        'job_type': 'N/A',
        'description': content[:500] if content else 'N/A'
    }
    
    try:
        lines = content.split('\n')
        
        # Job title is usually the first substantial line
        for line in lines[:5]:
            if len(line.strip()) > 5 and len(line.strip()) < 150:
                details['job_title'] = line.strip()
                break
        
        # Look for salary pattern: ₹ amount or numbers with LPA
        salary_match = re.search(r'₹\s*[\d,]+(?:\s*-\s*₹\s*[\d,]+)?|[\d,]+\s*(?:LPA|lpa|Lpa)', content)
        if salary_match:
            details['salary'] = salary_match.group().strip()
        
        # Look for common location keywords
        location_keywords = ['location', 'city', 'place', 'based in', 'work location']
        for keyword in location_keywords:
            pattern = re.search(rf'{keyword}\s*[:\-]?\s*([^,\n]+)', content, re.IGNORECASE)
            if pattern:
                location = pattern.group(1).strip()
                if len(location) < 100:
                    details['location'] = location
                    break
        
        # Extract location from URL (Foundit URLs contain location)
        if details['location'] == 'N/A':
            url_parts = url.split('-')
            for part in url_parts:
                if part in ['mumbai', 'bangalore', 'bengaluru', 'delhi', 'hyderabad', 'pune', 'chennai', 
                           'gurugram', 'noida', 'gurgaon', 'kolkata', 'ahmedabad']:
                    details['location'] = part.capitalize()
                    break
        
        # Look for job type
        job_types = ['full-time', 'part-time', 'contract', 'temporary', 'freelance']
        for jtype in job_types:
            if jtype.lower() in content.lower():
                details['job_type'] = jtype.capitalize()
                break
        
        # Look for skills - common programming and tech skills
        common_skills = [
            'python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'golang', 'rust',
            'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'fastapi',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
            'git', 'github', 'gitlab', 'bitbucket',
            'rest api', 'graphql', 'microservices', 'testing', 'automation',
            'machine learning', 'ai', 'data science', 'etl', 'spark', 'hadoop',
            'html', 'css', 'typescript', 'npm', 'webpack', 'devops',
            'selenium', 'pytest', 'junit', 'agile', 'scrum'
        ]
        
        found_skills = []
        content_lower = content.lower()
        for skill in common_skills:
            if skill in content_lower:
                found_skills.append(skill.upper())
        
        if found_skills:
            details['skills'] = ', '.join(list(dict.fromkeys(found_skills))[:10])  # Remove duplicates, limit to 10
        
        # Look for company name - usually after certain keywords
        company_pattern = re.search(r'company\s*[:\-]?\s*([^,\n]+)|employer\s*[:\-]?\s*([^,\n]+)', content, re.IGNORECASE)
        if company_pattern:
            company = company_pattern.group(1) or company_pattern.group(2)
            if company:
                details['company'] = company.strip()
    
    except Exception as e:
        print(f"Error parsing content from {url}: {str(e)}")
    
    return details


def scrape_foundit(csv_path: str = './foundit_jobs.csv',
                   output_path: str = 'output.txt',
                   url_column: int = 1,
                   encoding: str = 'utf-8',
                   timeout: int = 15,
                   urls: Optional[Union[List[str], tuple]] = None,
                   extract_details: bool = True) -> List[Dict[str, str]]:
    """
    Scrape job URLs and extract detailed information from each page.
    Uses the break-words div which contains the main job content.
    Returns a list of dicts with job details.
    """
    results = []

    url_list = []
    if urls:
        url_list = list(urls)
    else:
        try:
            with open(csv_path, 'r', newline='', encoding=encoding) as csvfile:
                reader = csv.reader(csvfile)
                try:
                    headers = next(reader)
                except StopIteration:
                    return results
                for row in reader:
                    try:
                        url = row[url_column]
                        if url:
                            url_list.append(url)
                    except IndexError:
                        continue
        except FileNotFoundError:
            return results

    total_urls = len(url_list)
    print(f"\n Total URLs to process: {total_urls}")

    for idx, url in enumerate(url_list, 1):
        try:
            print(f"[{idx}/{total_urls}]  Scraping: {url}")
            
            response = requests.get(
                url, 
                timeout=timeout, 
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract content from break-words div (the main job content)
            div = soup.find('div', class_="break-words")
            content = ""
            
            if div:
                content = div.get_text(separator=' ', strip=True)
                print(f"Content extracted: {len(content)} characters")
            else:
                print(f"break-words div not found, trying article...")
                article = soup.find('article')
                if article:
                    content = article.get_text(separator=' ', strip=True)
                else:
                    print(f"article not found, using body text...")
                    if soup.body:
                        content = soup.body.get_text(separator=' ', strip=True)
            
            if extract_details and content:
                # Parse the extracted content to get structured details
                job_details = extract_job_details_from_text(url, content)
                results.append(job_details)
                print(f"Job: {job_details['job_title'][:40]}")
            else:
                # Return raw content
                results.append({'url': url, 'content': content})
            
            # Write to output file
            with open(output_path, 'a', encoding=encoding) as file:
                file.write(content + "\n")
            
            # Be respectful to the server
            time.sleep(1.5)
            
        except requests.exceptions.Timeout:
            print(f"Timeout: {url}")
            results.append({
                'url': url,
                'job_title': 'Error',
                'company': 'N/A',
                'location': 'N/A',
                'salary': 'N/A',
                'skills': 'N/A',
                'job_type': 'N/A',
                'description': 'Request timed out'
            })
        except requests.exceptions.RequestException as e:
            print(f"Request error: {url}")
            results.append({
                'url': url,
                'job_title': 'Error',
                'company': 'N/A',
                'location': 'N/A',
                'salary': 'N/A',
                'skills': 'N/A',
                'job_type': 'N/A',
                'description': f"Request failed: {str(e)}"
            })
        except Exception as e:
            print(f"   ✗ Error: {str(e)}")
            results.append({
                'url': url,
                'job_title': 'Error',
                'company': 'N/A',
                'location': 'N/A',
                'salary': 'N/A',
                'skills': 'N/A',
                'job_type': 'N/A',
                'description': str(e)
            })

    print(f"\n Completed scraping {len(results)} URLs\n")
    return results


def format_jobs_output(jobs: List[Dict[str, str]]) -> str:
    """
    Format job results nicely for display.
    """
    output = "\n" + "="*120 + "\n"
    output += f" FOUND {len(jobs)} JOB LISTINGS\n"
    output += "="*120 + "\n\n"
    
    for i, job in enumerate(jobs, 1):
        output += f"{'─'*120}\n"
        output += f"JOB #{i}\n"
        output += f"{'─'*120}\n"
        output += f"Title:       {job.get('job_title', 'N/A')}\n"
        output += f"Company:     {job.get('company', 'N/A')}\n"
        output += f"Location:    {job.get('location', 'N/A')}\n"
        output += f"Salary:      {job.get('salary', 'N/A')}\n"
        output += f"Job Type:    {job.get('job_type', 'N/A')}\n"
        output += f"Skills:      {job.get('skills', 'N/A')}\n"
        output += f"Link:        {job.get('url', 'N/A')}\n"
        
        desc = job.get('description', 'N/A')
        if desc != 'N/A' and len(desc) > 10:
            output += f"Description: {desc[:200]}...\n\n"
        else:
            output += f"Description: {desc}\n\n"
    
    return output


if __name__ == "__main__":
    # Quick test - scrape from CSV
    print("Starting job scraper...")
    results = scrape_foundit()
    print(f"Scraped {len(results)} jobs")
    print(format_jobs_output(results))