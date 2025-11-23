import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time
import pandas as pd
import re
import os
import random
from typing import List, Dict, Optional
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException

load_dotenv()

# ==================== TIMESJOBS SCRAPER ====================
def scrape_timesjobs_live(url):
    """Scrape TimesJobs using Selenium for client-side rendered content"""
    driver = None
    try:
        # Initialize Selenium driver
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        driver = webdriver.Chrome(options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print(f"🌐 Loading TimesJobs URL: {url}")
        driver.get(url)
        
        # Wait longer for the page to load completely
        time.sleep(5)
        
        # Wait for job listings to load with more specific selectors
        wait = WebDriverWait(driver, 25)
        
        # Try multiple selectors for job listings - UPDATED FOR NEW TIMESJOBS
        job_selectors = [
            "div[class*='job-bx']",
            "div[class*='job-tuple']",
            "div[class*='srp-jobtuple']",
            "li[class*='job-tuple']",
            "div[class*='result']",
            "div[data-jobid]",
            "article[class*='job']",
            "section[class*='job']",
            ".job-listing",
            ".job-item",
            ".job-card"
        ]
        
        job_elements = None
        for selector in job_selectors:
            try:
                job_elements = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector)))
                if job_elements and len(job_elements) > 0:
                    print(f"✅ Found {len(job_elements)} jobs using selector: {selector}")
                    break
            except Exception as e:
                continue
        
        if not job_elements:
            print("❌ No job elements found with any selector")
            # Debug: Save page source to see what's available
            with open("timesjobs_debug_selenium.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            print("💾 Saved page source to timesjobs_debug_selenium.html for inspection")
            return []
        
        # Multiple scrolls to load all content
        print("🔄 Scrolling to load more content...")
        for _ in range(3):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
        
        # Get the updated page source
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        jobs = []
        
        # Try to find job containers in the rendered HTML - UPDATED SELECTORS
        job_containers = soup.select(
            "div.job-bx, div.job-tuple, div.srp-jobtuple, li.job-tuple, "
            "div[data-jobid], article.job, section.job, .job-listing, "
            ".job-item, .job-card, [class*='job-bx'], [class*='job-tuple']"
        )
        
        if not job_containers:
            # Fallback: look for any elements that might contain job info
            all_divs = soup.find_all(['div', 'li', 'article', 'section'])
            job_containers = [div for div in all_divs if 'job' in str(div.get('class', '')).lower()]
        
        print(f"🔍 Found {len(job_containers)} potential job containers")
        
        for container in job_containers:
            try:
                # Get all text content
                all_text = container.get_text(strip=True)
                
                # Skip if too short or doesn't contain job-related keywords
                if len(all_text) < 50:
                    continue
                
                # Extract title using multiple approaches
                title = "N/A"
                
                # Method 1: Look for title in specific elements
                title_elem = (container.find('h2') or container.find('h3') or 
                             container.find('a', class_=re.compile(r'title|job')) or
                             container.find('strong') or container.find('b'))
                
                if title_elem:
                    title = title_elem.get_text(strip=True)
                
                # Method 2: Regex patterns for job titles
                if title == "N/A":
                    title_patterns = [
                        r'^([A-Z][a-zA-Z\s&]{10,60}(?:Developer|Engineer|Analyst|Manager|Specialist|Consultant|Architect))',
                        r'([A-Z][a-zA-Z\s&]+(?:Developer|Engineer|Analyst|Manager))',
                        r'^([^\.\n]{10,80})$'  # Any reasonable length text that might be a title
                    ]
                    
                    for pattern in title_patterns:
                        match = re.search(pattern, all_text)
                        if match:
                            potential_title = match.group(1).strip()
                            if len(potential_title) > 10 and len(potential_title) < 100:
                                title = potential_title
                                break
                
                # Extract company
                company = "N/A"
                company_elem = (container.find('h3', class_=re.compile(r'comp|company')) or
                               container.find('span', class_=re.compile(r'comp|company')) or
                               container.find('div', class_=re.compile(r'comp|company')))
                
                if company_elem:
                    company = company_elem.get_text(strip=True)
                
                if company == "N/A":
                    company_pattern = r'([A-Z][a-zA-Z&]+\s*(?:Pvt|Ltd|Inc|Corp|LLC|Technologies|Solutions|Limited)?)'
                    companies = re.findall(company_pattern, all_text)
                    for comp in companies:
                        if len(comp) > 3 and comp != title and not any(word in comp.lower() for word in ['years', 'experience', 'salary']):
                            company = comp
                            break
                
                # Extract location
                location = "N/A"
                location_elem = (container.find('span', class_=re.compile(r'loc|location')) or
                                container.find('div', class_=re.compile(r'loc|location')) or
                                container.find('i', class_=re.compile(r'location')))
                
                if location_elem:
                    location = location_elem.get_text(strip=True)
                
                if location == "N/A":
                    location_patterns = [
                        r'(\b(?:Bangalore|Bengaluru|Mumbai|Delhi|Pune|Hyderabad|Chennai|Kolkata|Gurgaon|Noida|Ahmedabad)\b)',
                        r'(\b(?:Remote|Work From Home|WFH|Hybrid)\b)',
                        r'(\b[A-Z][a-zA-Z]+(?:,\s*[A-Z][a-zA-Z]+)*\b)'
                    ]
                    for pattern in location_patterns:
                        match = re.search(pattern, all_text, re.IGNORECASE)
                        if match:
                            location = match.group(1)
                            break
                
                # Extract skills
                skills_keywords = [
                    'python', 'java', 'javascript', 'react', 'angular', 'node', 'html', 'css',
                    'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'machine learning',
                    'django', 'flask', 'php', 'c++', 'c#', '.net', 'spring', 'hibernate',
                    'rest api', 'graphql', 'microservices', 'devops', 'jenkins', 'git'
                ]
                skills_found = [skill.title() for skill in skills_keywords if skill in all_text.lower()]
                
                # Extract experience
                experience = "N/A"
                exp_match = re.search(r'(\d+\s*[-–]\s*\d+\s*years?)', all_text, re.IGNORECASE)
                if not exp_match:
                    exp_match = re.search(r'(\d+\s*\+\s*years?)', all_text, re.IGNORECASE)
                if exp_match:
                    experience = exp_match.group(1)
                
                # Extract salary
                salary = "N/A"
                salary_match = re.search(r'(\d+\s*Lacs?|\$\d+|\d+\s*[Kk]|\d+\s*[-–]\s*\d+\s*Lacs?)', all_text, re.IGNORECASE)
                if salary_match:
                    salary = salary_match.group(1)
                
                # Get job URL if available
                job_url = url
                link_elem = container.find('a', href=True)
                if link_elem and link_elem.get('href'):
                    href = link_elem['href']
                    if href.startswith('/'):
                        job_url = f"https://www.timesjobs.com{href}"
                    elif href.startswith('http'):
                        job_url = href
                
                # Create job data
                job_data = {
                    "title": title,
                    "company": company,
                    "location": location,
                    "experience": experience,
                    "salary": salary,
                    "skills": skills_found,
                    "description": all_text[:200] + "..." if len(all_text) > 200 else all_text,
                    "posted_date": "N/A",
                    "url": job_url,
                    "source": "TimesJobs",
                    "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                
                # Only add valid jobs (more lenient criteria)
                if (title != "N/A" and len(title) > 5 and 
                    company != "N/A" and len(company) > 2):
                    jobs.append(job_data)
                    print(f"✅ Found: {title[:40]}... at {company} | {location}")
                
            except Exception as e:
                print(f"⚠️ Error parsing job container: {e}")
                continue
        
        print(f"📊 Successfully extracted {len(jobs)} jobs")
        return jobs
        
    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")
        return []
    finally:
        if driver:
            driver.quit()
# ==================== TIMESJOBS SCRAPER ====================

# CHANGE THESE FUNCTION NAMES:
def save_timesjobs_to_csv(jobs, filename=None):  # CHANGED NAME
    """Save jobs data to CSV file"""
    if not jobs:
        print("❌ No jobs to save.")
        return None
    
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"timesjobs_jobs_{timestamp}.csv"
    
    try:
        df = pd.DataFrame(jobs)
        
        # Ensure skills list is saved properly
        df['skills'] = df['skills'].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)
        
        df.to_csv(filename, index=False, encoding='utf-8')
        print(f"💾 Saved {len(jobs)} jobs to {filename}")
        
        # Print summary
        print(f"\n📊 Summary:")
        print(f"   Total jobs: {len(jobs)}")
        print(f"   Unique companies: {df['company'].nunique()}")
        print(f"   Locations: {df['location'].value_counts().head(3).to_dict()}")
        
        return filename
    except Exception as e:
        print(f"❌ Error saving to CSV: {e}")
        return None

def save_timesjobs_to_excel(jobs, filename=None):  # CHANGED NAME
    """Save jobs data to Excel file with multiple sheets"""
    if not jobs:
        print("❌ No jobs to save.")
        return None
    
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"timesjobs_jobs_{timestamp}.xlsx"
    
    try:
        df = pd.DataFrame(jobs)
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Main jobs sheet
            df['skills'] = df['skills'].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)
            df.to_excel(writer, sheet_name='All_Jobs', index=False)
            
            # Summary sheet
            summary_data = {
                'Metric': ['Total Jobs', 'Unique Companies', 'Date Scraped'],
                'Value': [len(jobs), df['company'].nunique(), datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
            }
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
            
            # Skills analysis
            all_skills = [skill for sublist in jobs for skill in sublist['skills']]
            skills_count = pd.Series(all_skills).value_counts().reset_index()
            skills_count.columns = ['Skill', 'Count']
            skills_count.to_excel(writer, sheet_name='Skills_Analysis', index=False)
        
        print(f"💾 Saved to Excel: {filename}")
        return filename
        
    except Exception as e:
        print(f"❌ Error saving to Excel: {e}")
        return None

def scrape_timesjobs_main():
    """Main scraping function with enhanced capabilities"""
    
    # Test with actual TimesJobs URLs
    base_urls = [
        "https://www.timesjobs.com/job-search?cboPresFuncArea=35&refreshed=true"
    ]
    
    all_jobs = []
    
    # Loop through each search URL (limit to 1 page for testing)
    for i, base_url in enumerate(base_urls): 
        print(f"\n{'='*60}")
        print(f"🔍 Scraping URL {i+1}/{len(base_urls)}")
        print(f"📝 Search: {base_url.split('?')[1][:50]}...")
        print(f"{'='*60}")
        
        print(f"📄 Scraping: {base_url}")
        jobs = scrape_timesjobs_live(base_url)
        
        if not jobs:
            print(f"❌ No jobs found. Moving to next URL.")
            continue
            
        all_jobs.extend(jobs)
        print(f"✅ Found {len(jobs)} jobs")
        
        # Delay between different search URLs
        if i < len(base_urls) - 1:
            delay_between_searches = 3
            print(f"🕒 Waiting {delay_between_searches} seconds before next search...")
            time.sleep(delay_between_searches)

    print(f"\n{'='*60}")
    print(f"🎉 TIMESJOBS SCRAPING COMPLETED!")
    print(f"{'='*60}")
    print(f"📊 Total jobs found: {len(all_jobs)}")
    
    if not all_jobs:
        print("❌ No jobs were scraped.")
        return
    
    # Save to CSV
    csv_filename = save_timesjobs_to_csv(all_jobs)
    
    # Print sample of scraped data
    print(f"\n{'='*60}")
    print("📋 SAMPLE OF SCRAPED JOBS (First 5):")
    print(f"{'='*60}")
    
    for i, job in enumerate(all_jobs[:5]):
        print(f"\n--- Job {i+1} ---")
        print(f"Title: {job.get('title', 'N/A')}")
        print(f"Company: {job.get('company', 'N/A')}")
        print(f"Location: {job.get('location', 'N/A')}")
        print(f"Experience: {job.get('experience', 'N/A')}")
        print(f"Skills: {', '.join(job.get('skills', []))}")
        print(f"URL: {job.get('url', 'N/A')[:80]}...")
    
    return all_jobs

# ==================== INDEED SCRAPER ====================

# Indeed-specific config (from 2025 selectors)
SITE_CONFIG = {
    "indeed": {
        "base_url": "https://www.indeed.com/jobs?q={query}",
        "selectors": {
            "job_container": "div[data-jk]",
            "title": "h2.jobTitle a span",
            "company": "span.companyName",
            "location": "div.companyLocation",
            "experience": ".job-snippet",
            "description": ".job-snippet",
            "skills": ".job-snippet",
            "url": "h2.jobTitle a[href]",
            "wait_for": "div[data-jk]"
        }
    }
}

def generate_indeed_urls(query: str, num_pages: int = 5) -> List[Dict[str, str]]:
    """Generate paginated URLs for Indeed."""
    clean_query = re.sub(r'find\s+|jobs?\s*', '', query, flags=re.I).strip().lower()
    query_encoded = clean_query.replace(" ", "+")
    
    urls = []
    base_url = SITE_CONFIG["indeed"]["base_url"].format(query=query_encoded)
    for page in range(1, num_pages + 1):
        url = f"{base_url}&start={(page-1)*10}"  # Indeed pagination uses start=0,10,20,...
        urls.append({"site": "indeed", "url": url})
    print(f"🎯 Generated {len(urls)} URLs for Indeed")
    return urls

def init_driver_indeed():
    """Initialize headless Chrome driver."""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    driver = webdriver.Chrome(options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

def extract_indeed_job_data(container, base_url: str, site: str, selectors: Dict, text_content: str) -> dict:
    """Extract job data from container."""
    job_data = {
        "title": "Not specified",
        "company": "Not specified",
        "location": "Not specified",
        "experience": "Not specified",
        "description": text_content[:1000] + "..." if len(text_content) > 1000 else text_content,
        "skills": [],
        "salary": "Not specified",
        "url": base_url,
        "source": site.title(),
        "scraped_at": datetime.now().isoformat()
    }
    
    for field, sel in selectors.items():
        if field in ['title', 'company', 'location', 'experience', 'description']:
            element = container.select_one(sel)
            if element:
                job_data[field] = element.get_text(strip=True)
    
    link_sel = selectors.get("url", "a[href]")
    link = container.select_one(link_sel)
    if link and link.get('href'):
        href = link['href']
        if not href.startswith('http'):
            job_data["url"] = f"https://www.indeed.com{href}" if href.startswith('/') else base_url + '/' + href
    
    if job_data["title"] == "Not specified":
        title_patterns = [r'(Senior|Junior|Lead)?\s*(Python|Software|Developer|Engineer)[\w\s]*', r'[A-Z][a-z]+\s+(Python\s+Developer|Software\s+Engineer)']
        for pat in title_patterns:
            match = re.search(pat, text_content, re.I)
            if match:
                job_data["title"] = match.group().strip()
                break
    
    if job_data["company"] == "Not specified":
        comp_pat = r'[A-Z][a-zA-Z&]+\s*(?:Pvt|Ltd|Inc|Corp|LLC|Technologies)?'
        matches = re.findall(comp_pat, text_content)
        for match in matches:
            if len(match) > 3:
                job_data["company"] = match
                break
    
    common_skills = ['python', 'django', 'flask', 'java', 'javascript', 'react', 'angular', 'node', 'sql', 'mysql', 'postgresql', 'aws', 'docker', 'git', 'api', 'machine learning']
    job_data["skills"] = [s.capitalize() for s in common_skills if s in text_content.lower()]
    
    return job_data

def is_valid_indeed_job(job_data: dict) -> bool:
    """Validate if it's a valid job posting."""
    title = job_data.get('title', '').lower()
    company = job_data.get('company', '').lower()
    invalids = ['not specified', 'search', 'trending', 'top companies', 'advertisement']
    if any(inv in title or inv in company for inv in invalids):
        return False
    if 'python' not in title and 'python' not in job_data.get('description', '').lower():
        return False
    return bool(job_data.get('title') and job_data.get('company'))

def scrape_indeed_site(url_info: Dict[str, str]) -> List[dict]:
    """Scrape a single Indeed URL."""
    site = url_info["site"]
    url = url_info["url"]
    config = SITE_CONFIG.get(site, {})
    if not config:
        return []
    
    driver = None
    try:
        driver = init_driver_indeed()
        print(f"🌐 Selenium scraping {site}: {url}")
        driver.get(url)
        
        # Scroll to load dynamic content (3 times)
        for _ in range(3):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(5)
        
        # Wait for jobs (30s timeout)
        wait = WebDriverWait(driver, 30)
        wait_for = config.get("wait_for", "div[class*='job']")
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, wait_for)))
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Debug HTML save
        debug_file = f"debug_indeed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(soup.prettify())
        
        jobs = []
        selectors = config["selectors"]
        containers = soup.select(selectors.get("job_container", "div[class*='job']"))
        
        if not containers:
            all_divs = soup.find_all('div')
            containers = [div for div in all_divs if 200 < len(div.get_text(strip=True)) < 3000 and 'python' in div.get_text().lower()]
        
        for container in containers[:50]:  # Limit to 50 per page
            try:
                text_content = container.get_text(strip=True)
                if len(text_content) < 100 or 'python' not in text_content.lower():
                    continue
                
                skip_keywords = ['sign in', 'register', 'footer', 'header', 'advertisement']
                if any(kw in text_content.lower() for kw in skip_keywords):
                    continue
                
                job_data = extract_indeed_job_data(container, url, site, selectors, text_content)
                
                if job_data.get('title') != "Not specified" and job_data.get('company') != "Not specified":
                    if is_valid_indeed_job(job_data):
                        jobs.append(job_data)
                        print(f"📝 {site}: {job_data['title'][:50]} at {job_data['company']}")
            
            except Exception as e:
                print(f"❌ Error in {site} container: {e}")
                continue
        
        print(f"✅ {site}: {len(jobs)} jobs scraped")
        return jobs
        
    except TimeoutException:
        print(f"❌ Timeout loading {site}")
    except WebDriverException as e:
        print(f"❌ Selenium error on {site}: {e}")
    finally:
        if driver:
            driver.quit()
    
    time.sleep(random.uniform(5, 10))
    return []

def scrape_indeed(query: str, num_pages: int = 5):
    """Main scraping function for Indeed."""
    print("🔍 Starting Indeed scraping...")
    urls = generate_indeed_urls(query, num_pages)
    
    all_jobs = []
    for url_info in urls:
        jobs = scrape_indeed_site(url_info)
        all_jobs.extend(jobs)
    
    # Deduplicate and prepare for CSV
    df = pd.DataFrame(all_jobs)
    if not df.empty:
        df = df.drop_duplicates(subset=['title', 'company', 'url'])
        df['skills'] = df['skills'].apply(lambda x: ', '.join(x) if isinstance(x, list) else str(x))
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        query_clean = query.replace(" ", "_").replace("+", "_")
        filename = f"indeed_jobs_{query_clean}_{timestamp}.csv"
        df.to_csv(filename, index=False)
        
        print(f"✅ Saved {len(df)} unique jobs to {filename}")
        return df
    else:
        print("❌ No jobs scraped.")
        return pd.DataFrame()

def scrape_indeed_main():
    """Main function for Indeed scraper"""
    print("Indeed Python Jobs Scraper (Focused)")
    print("=" * 40)
    
    query = "python developer" 
    df = scrape_indeed(query, num_pages=5)
    return df

# ==================== NAUKRI SCRAPER ====================

class NaukriScraper:
    def __init__(self, query="python+developer"):
        self.query = query
        self.base_url = f"https://www.naukri.com/{query}-jobs"
        self.driver = None
        self.jobs = []

    def init_driver(self):
        options = Options()
        # Comment out headless for debugging
        # options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--start-maximized")
        
        # Enhanced user agent
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ]
        options.add_argument(f"--user-agent={random.choice(user_agents)}")
        
        options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
        options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=options)
        
        # Stealth modifications
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": random.choice(user_agents)
        })

    def close_popups(self):
        """Enhanced popup handling for Naukri"""
        try:
            # Naukri specific popup selectors
            popup_selectors = [
                "span[class*='crossIcon']",
                "i[class*='cross']",
                "button[class*='close']",
                ".crossIcon",
                ".close",
                ".popup-close",
                "button[title='Close']",
                "#closeButton",
                "a[class*='close']",
                "div[class*='popup'] button",
                ".banner-close-button",
                ".registerButton"
            ]
            
            for selector in popup_selectors:
                try:
                    elements = WebDriverWait(self.driver, 3).until(
                        EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
                    )
                    for element in elements:
                        if element.is_displayed():
                            self.driver.execute_script("arguments[0].click();", element)
                            print(f"✅ Closed popup with selector: {selector}")
                            time.sleep(1)
                except:
                    continue
                    
            # Handle login modal if present
            try:
                login_close = self.driver.find_elements(By.CSS_SELECTOR, "span[class*='login-close']")
                for element in login_close:
                    if element.is_displayed():
                        self.driver.execute_script("arguments[0].click();", element)
                        time.sleep(1)
            except:
                pass
                
        except Exception as e:
            print(f"⚠️ Popup handling issue: {e}")

    def smart_scroll(self):
        """Smart scrolling to load dynamic content"""
        try:
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            
            for i in range(5):
                # Scroll down
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(random.uniform(2, 4))
                
                # Scroll up a bit to trigger lazy loading
                if i % 2 == 0:
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight - 500);")
                    time.sleep(1)
                
                # Calculate new scroll height
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
                    
        except Exception as e:
            print(f"Scroll issue: {e}")

    def scrape_page(self, url):
        try:
            print(f"🌐 Loading URL: {url}")
            self.driver.get(url)
            time.sleep(random.uniform(3, 5))
            
            # Debug info
            print(f"📄 Page title: {self.driver.title}")
            print(f"🔗 Current URL: {self.driver.current_url}")
            
            # Close popups
            self.close_popups()
            
            # Smart scrolling
            self.smart_scroll()
            
            # Wait for job listings with multiple selector options
            wait = WebDriverWait(self.driver, 20)
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".jobTuple, .srp-jobtuple, [data-job-id], .tuple")))
            except TimeoutException:
                print("❌ No job listings found with common selectors")
                # Save page source for debugging
                with open("naukri_debug.html", "w", encoding="utf-8") as f:
                    f.write(self.driver.page_source)
                print("💾 Saved page source to naukri_debug.html for inspection")
                return

            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')

            # Multiple container selectors for Naukri
            job_containers = soup.select(".jobTuple, .srp-jobtuple, [data-job-id], .tuple, .list")
            
            if not job_containers:
                print("❌ No job containers found with any selector")
                return
                
            print(f"🔍 Found {len(job_containers)} job containers")

            for container in job_containers[:25]:  # Limit per page
                try:
                    # Multiple selector patterns for each field
                    title_elem = (container.select_one("a.title") or 
                                 container.select_one(".title") or
                                 container.select_one("a[class*='title']") or
                                 container.select_one("[data-automation='jobTitle']"))
                    
                    company_elem = (container.select_one(".comp-name") or
                                   container.select_one(".company") or
                                   container.select_one(".comp-name a") or
                                   container.select_one("[data-automation='jobCompany']"))
                    
                    location_elem = (container.select_one(".loc") or
                                    container.select_one(".location") or
                                    container.select_one(".loc a") or
                                    container.select_one("[data-automation='jobLocation']"))
                    
                    experience_elem = (container.select_one(".exp") or
                                      container.select_one(".experience") or
                                      container.select_one(".expwdth"))
                    
                    salary_elem = (container.select_one(".sal") or
                                  container.select_one(".salary") or
                                  container.select_one(".sal span"))

                    # Extract text with fallbacks
                    title = title_elem.get_text(strip=True) if title_elem else "N/A"
                    company = company_elem.get_text(strip=True) if company_elem else "N/A"
                    location = location_elem.get_text(strip=True) if location_elem else "N/A"
                    experience = experience_elem.get_text(strip=True) if experience_elem else "N/A"
                    salary = salary_elem.get_text(strip=True) if salary_elem else "N/A"
                    
                    # Get job URL
                    job_url = ""
                    if title_elem and title_elem.get('href'):
                        job_url = title_elem.get('href')
                        if not job_url.startswith('http'):
                            job_url = "https://www.naukri.com" + job_url

                    # Enhanced skills detection
                    text_content = container.get_text(strip=True).lower()
                    skills_keywords = ['python', 'django', 'flask', 'java', 'javascript', 'react', 'angular', 
                                     'node', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'machine learning']
                    skills = [s.capitalize() for s in skills_keywords if s in text_content]

                    job_data = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "experience": experience,
                        "skills": skills,
                        "salary": salary,
                        "description": text_content[:300] + "..." if len(text_content) > 300 else text_content,
                        "url": job_url,
                        "source": "Naukri",
                        "scraped_at": datetime.now().isoformat()
                    }

                    if title != "N/A" and company != "N/A":
                        self.jobs.append(job_data)
                        print(f"✅ Scraped: {title[:40]}... at {company} | {location}")

                except Exception as e:
                    print(f"⚠️ Error parsing job container: {e}")
                    continue

            print(f"📊 Page completed: {len(job_containers)} containers processed")

        except TimeoutException:
            print(f"❌ Timeout loading {url}")
        except Exception as e:
            print(f"❌ Error scraping {url}: {e}")

    def scrape_multiple_pages(self, max_pages=3):
        """Scrape multiple pages with improved pagination"""
        self.init_driver()
        try:
            for page in range(1, max_pages + 1):
                if page == 1:
                    current_url = self.base_url
                else:
                    # Naukri pagination patterns
                    current_url = f"{self.base_url}-{page}"
                
                print(f"\n{'='*50}")
                print(f"📖 Scraping Page {page}: {current_url}")
                print(f"{'='*50}")
                
                self.scrape_page(current_url)
                
                # Random delay between pages
                delay = random.uniform(8, 12)
                print(f"⏳ Waiting {delay:.1f} seconds before next page...")
                time.sleep(delay)
                
        except Exception as e:
            print(f"❌ Error in multi-page scraping: {e}")
        finally:
            if self.driver:
                self.driver.quit()
                print("🚪 Browser closed")

    def save_to_csv(self):
        if self.jobs:
            df = pd.DataFrame(self.jobs)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"naukri_jobs_{timestamp}.csv"
            df.to_csv(filename, index=False, encoding='utf-8')
            print(f"\n🎉 Successfully saved {len(self.jobs)} jobs to {filename}")
            
            # Print summary
            print(f"\n📈 Summary:")
            print(f"   Total jobs: {len(self.jobs)}")
            print(f"   Unique companies: {df['company'].nunique()}")
            print(f"   Locations: {df['location'].unique()[:5]}")  # Show first 5 locations
        else:
            print("❌ No jobs to save.")

    def get_stats(self):
        """Get scraping statistics"""
        if self.jobs:
            df = pd.DataFrame(self.jobs)
            print(f"\n📊 Scraping Statistics:")
            print(f"   Total jobs scraped: {len(self.jobs)}")
            print(f"   Unique companies: {df['company'].nunique()}")
            print(f"   Most common locations: {df['location'].value_counts().head(3).to_dict()}")

def scrape_naukri_main():
    """Main function for Naukri scraper"""
    queries = [
        "python-developer",
        "software-developer", 
        "data-scientist"
    ]
    
    all_jobs = []
    
    for query in queries[:1]: 
        print(f"\n{'#'*60}")
        print(f"🚀 Starting Naukri Scraper for: {query}")
        print(f"{'#'*60}")
        
        scraper = NaukriScraper(query)
        scraper.scrape_multiple_pages(max_pages=2)  # Start with 2 pages
        all_jobs.extend(scraper.jobs)
        scraper.save_to_csv()
        scraper.get_stats()
    
    return all_jobs

# ==================== UNIFIED MAIN FUNCTION ====================

def main():
    """Unified main function to run all scrapers"""
    print("🚀 JOB SCRAPER SUITE")
    print("=" * 50)
    print("1. TimesJobs Scraper")
    print("2. Indeed Scraper") 
    print("3. Naukri Scraper")
    print("4. Run All Scrapers")
    print("=" * 50)
    
    choice = input("Enter your choice (1-4): ").strip()
    
    all_results = {}
    
    if choice == "1":
        print("\n" + "="*60)
        print("STARTING TIMESJOBS SCRAPER")
        print("="*60)
        all_results['timesjobs'] = scrape_timesjobs_main()
        
    elif choice == "2":
        print("\n" + "="*60)
        print("STARTING INDEED SCRAPER")
        print("="*60)
        all_results['indeed'] = scrape_indeed_main()
        
    elif choice == "3":
        print("\n" + "="*60)
        print("STARTING NAUKRI SCRAPER")
        print("="*60)
        all_results['naukri'] = scrape_naukri_main()
        
    elif choice == "4":
        print("\n" + "="*60)
        print("STARTING ALL SCRAPERS")
        print("="*60)
        
        print("\n📋 Running TimesJobs Scraper...")
        all_results['timesjobs'] = scrape_timesjobs_main()
        
        print("\n📋 Running Indeed Scraper...")
        all_results['indeed'] = scrape_indeed_main()
        
        print("\n📋 Running Naukri Scraper...")
        all_results['naukri'] = scrape_naukri_main()
        
        # Combine all results
        all_jobs = []
        for source, jobs in all_results.items():
            if jobs is not None:
                if isinstance(jobs, pd.DataFrame):
                    all_jobs.extend(jobs.to_dict('records'))
                else:
                    all_jobs.extend(jobs)
        
        if all_jobs:
            # Save combined results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            combined_filename = f"all_jobs_combined_{timestamp}.csv"
            
            df_combined = pd.DataFrame(all_jobs)
            df_combined.to_csv(combined_filename, index=False, encoding='utf-8')
            
            print(f"\n🎉 COMBINED RESULTS:")
            print(f"💾 Saved {len(all_jobs)} total jobs to {combined_filename}")
            print(f"📊 Breakdown by source:")
            for source, jobs in all_results.items():
                if jobs is not None:
                    count = len(jobs) if not isinstance(jobs, pd.DataFrame) else len(jobs)
                    print(f"   - {source.capitalize()}: {count} jobs")
    
    else:
        print("❌ Invalid choice. Please run again.")

if __name__ == "__main__":
    main()