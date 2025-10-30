import os
import json
import re
import pandas as pd
import time
import random
from typing import List, Dict, Optional
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import datetime
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

load_dotenv()

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

def init_driver():
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

def extract_job_data(container, base_url: str, site: str, selectors: Dict, text_content: str) -> dict:
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

def is_valid_job(job_data: dict) -> bool:
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
        driver = init_driver()
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
                
                job_data = extract_job_data(container, url, site, selectors, text_content)
                
                if job_data.get('title') != "Not specified" and job_data.get('company') != "Not specified":
                    if is_valid_job(job_data):
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

if __name__ == "__main__":
    print("Indeed Python Jobs Scraper (Focused)")
    print("=" * 40)
    
    query = "python developer" 
    df = scrape_indeed(query, num_pages=5) 