# foundit_selenium_scraper.py
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import time
import re

def setup_driver():
    """Setup Chrome driver with realistic settings"""
    options = Options()
    
    # Remove headless for better success rate
    # options.add_argument('--headless')
    
    # Realistic browser settings
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def scrape_foundit_selenium(search_queries=None, locations=None, output_file="foundit_jobs_selenium.csv"):
    """Scrape Foundit using Selenium with real browser"""
    if search_queries is None:
        search_queries = ["python", "software engineer", "java developer"]
    
    if locations is None:
        locations = ["Pune", "Bangalore", "Hyderabad"]
    
    driver = setup_driver()
    all_jobs = []
    
    try:
        for query in search_queries:
            for location in locations:
                print(f"🔍 Searching: {query} in {location}")
                
                url = f"https://www.foundit.in/search/{query.lower().replace(' ', '-')}-jobs-in-{location.lower()}?query={query.replace(' ', '%20')}&locations=%22{location}%22&queryDerived=true"
                
                try:
                    driver.get(url)
                    
                    # Wait for page to load
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )
                    
                    # Wait a bit more for JavaScript to render
                    time.sleep(3)
                    
                    # Check if we got blocked
                    if "Access Denied" in driver.page_source or "403" in driver.page_source:
                        print("   🚫 Blocked by Foundit")
                        continue
                    
                    # Parse the rendered HTML
                    soup = BeautifulSoup(driver.page_source, 'html.parser')
                    jobs = parse_selenium_jobs(soup, query, location)
                    all_jobs.extend(jobs)
                    
                    print(f"   ✅ Found {len(jobs)} jobs")
                    
                    # Save progress after each search
                    if all_jobs:
                        df = pd.DataFrame(all_jobs)
                        df.to_csv(output_file, index=False)
                    
                    time.sleep(2)  # Be polite
                    
                except Exception as e:
                    print(f"   ❌ Error: {e}")
                    continue
        
    finally:
        driver.quit()
    
    if all_jobs:
        df = pd.DataFrame(all_jobs)
        df.to_csv(output_file, index=False)
        print(f"💾 Saved {len(all_jobs)} jobs to {output_file}")
        return df
    else:
        print("❌ No jobs found")
        return None

def parse_selenium_jobs(soup, query, location):
    """Parse jobs from Selenium-rendered page"""
    jobs = []
    
    # Look for job cards in the rendered HTML
    job_cards = soup.find_all(['div', 'section'], class_=True)
    job_cards = [card for card in job_cards if any(keyword in ' '.join(card.get('class', [])).lower() for keyword in ['card', 'job', 'tuple'])]
    
    print(f"   Found {len(job_cards)} potential job containers")
    
    for card in job_cards[:10]:  # Limit to first 10 to avoid too many requests
        try:
            text_content = card.get_text(strip=True)
            
            # Skip if too short or contains navigation elements
            if len(text_content) < 50 or any(skip in text_content.lower() for skip in ['login', 'sign up', 'download']):
                continue
            
            # Extract basic info
            title = extract_best_guess_title(card)
            company = extract_best_guess_company(card)
            
            if title and company and len(title) > 5:
                job_data = {
                    'title': title,
                    'company': company,
                    'location': location,
                    'experience': 'Not specified',
                    'salary': 'Not specified',
                    'skills': extract_skills_from_text(text_content),
                    'description': text_content[:300] + "..." if len(text_content) > 300 else text_content,
                    'job_url': extract_job_url(card),
                    'search_query': query,
                    'search_location': location,
                    'source': 'Foundit (Selenium)',
                    'timestamp': pd.Timestamp.now()
                }
                jobs.append(job_data)
                print(f"     ✅ {title[:40]}... - {company}")
                
        except Exception as e:
            continue
    
    return jobs

def extract_best_guess_title(card):
    """Extract the most likely title from card"""
    # Try heading elements first
    for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
        heading = card.find(tag)
        if heading:
            text = heading.get_text(strip=True)
            if text and len(text) > 5:
                return text
    
    # Try any element with title-like classes
    title_elements = card.find_all(class_=re.compile(r'title|job', re.IGNORECASE))
    for elem in title_elements:
        text = elem.get_text(strip=True)
        if text and len(text) > 5:
            return text
    
    # Fallback: first substantial line of text
    lines = [line.strip() for line in card.get_text().split('\n') if line.strip()]
    for line in lines:
        if 10 < len(line) < 100 and any(keyword in line.lower() for keyword in ['developer', 'engineer', 'analyst']):
            return line
    
    return lines[0] if lines else "Not found"

def extract_best_guess_company(card):
    """Extract the most likely company name"""
    # Look for company-like patterns
    text = card.get_text()
    company_patterns = [
        r'([A-Z][a-zA-Z&]+\s*(?:Pvt|Ltd|Inc|Corp|LLC|Limited)\b)',
        r'at\s+([A-Z][a-zA-Z\s&]+)',
        r'company[:\s]*([^\n,]+)'
    ]
    
    for pattern in company_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0]
            match = match.strip()
            if len(match) > 2 and match.lower() not in ['python', 'java', 'web', 'software', 'developer']:
                return match
    
    return "Not found"

def extract_skills_from_text(text):
    """Extract skills from text content"""
    skills = []
    text_lower = text.lower()
    
    common_skills = ['python', 'java', 'javascript', 'react', 'angular', 'node', 'sql',
                    'mongodb', 'aws', 'docker', 'kubernetes', 'html', 'css', 'php',
                    'c++', 'c#', '.net', 'spring', 'hibernate', 'rest api', 'git']
    
    for skill in common_skills:
        if skill in text_lower:
            skills.append(skill)
    
    return ', '.join(skills)

def extract_job_url(card):
    """Extract job URL"""
    link = card.find('a', href=True)
    if link:
        url = link['href']
        if url.startswith('/'):
            return f"https://www.foundit.in{url}"
        elif url.startswith('http'):
            return url
    return "Not found"

if __name__ == "__main__":
    print("🚀 Foundit Selenium Scraper")
    print("⚠️  Make sure you have Chrome and chromedriver installed!")
    
    result = scrape_foundit_selenium(
        search_queries=["python", "java", "web developer"],
        locations=["Pune", "Bangalore"],
        output_file="foundit_selenium_jobs.csv"
    )
    
    if result is not None:
        print(f"🎉 Success! Found {len(result)} jobs")
    else:
        print("💥 Scraping failed!")