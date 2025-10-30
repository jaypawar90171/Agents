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
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException

load_dotenv()

# Updated Glassdoor India-specific config (infinite scroll via "Show more jobs" button)
# Updated Glassdoor India-specific config (infinite scroll via "Show more jobs" button)
SITE_CONFIG = {
    "glassdoor": {
        "base_domain": "https://www.glassdoor.co.in",
        "location": "india",
        "loc_id": "IN115",  # India country code
        "selectors": {
            # Search page selectors
            # FIX: Added data-test fallbacks
            "search_job_container": "li[data-qa='job-card-list'], article[data-qa='job-card'], li[data-test='job-card-list'], article[data-test='job-card']",
            "search_title": "a[data-qa='job-card-title'] a, a.jobLink, a[data-test='job-card-title']",
            "search_company": "div[data-qa='job-card-company'] span, .employerName, div[data-test='job-card-company'] span",
            "search_location": "div[data-qa='job-card-location'] span, .location, div[data-test='job-card-location'] span",
            "search_snippet": "div[data-qa='job-card-description'], div[data-test='job-card-description']",
            "search_url": "a[data-qa='job-card-title'][href], a[data-test='job-card-title'][href]",
            "search_skills": "div[data-qa='job-card-skills'] li, ul.skillList li, div[data-test='job-card-skills'] li",
            
            # *** KEY FIX from your image ***
            # Removed invalid :contains and added data-test
            "show_more_button": "button[data-test='load-more'], [data-qa='load-more-jobs']",
            
            # FIX: Added data-test fallbacks
            "wait_for_search": "a[data-qa='job-card-title'], a[data-test='job-card-title']",
            
            # Detail page selectors (proactively adding data-test)
            "detail_title": "h1[data-qa='job-title'], .jobTitle, h1[data-test='job-title']",
            "detail_company": ".employerName, div[data-qa='employer-name'], div[data-test='employer-name']",
            "detail_location": ".jobLocation, div[data-qa='job-location'], div[data-test='job-location']",
            "detail_description": "[data-qa='job-description'], .jobDescription, [data-test='job-description']",
            "detail_skills": "ul.skillList li, .jobDescription ul li, [data-qa='job-skills'] li, [data-test='job-skills'] li",
            "detail_salary": ".salaryEstimate, [data-qa='job-salary'], [data-test='job-salary']",
            "detail_posted": ".postedDate, [data-qa='job-posted'], [data-test='job-posted']",
            "wait_for_detail": "[data-qa='job-description'], [data-test='job-description']",
            
            # Modal close selectors (this one looks robust)
            "alert_modal_close": "[data-test='close-button'], .modal-close, button[aria-label*='Close'], .close-icon"
        }
    }
}

def generate_glassdoor_urls(query: str, _num_pages: int = 1) -> List[Dict[str, str]]:  # Only generate first page
    """Generate the initial URL for Glassdoor India (load more via button)."""
    clean_query = re.sub(r'find\s+|jobs?\s*', '', query, flags=re.I).strip().lower()
    # Ensure full "developer" - correct any common typos
    if 'develop' in clean_query and len(clean_query.split()[-1]) < 9 and 'r' not in clean_query.split()[-1]:
        clean_query = clean_query.replace('develop', 'developer')
    query_encoded = clean_query.replace(" ", "-")
    
    loc = SITE_CONFIG["glassdoor"]["location"]
    loc_len = len(loc)
    keyword_start = loc_len + 1  # After 'india-'
    keyword_len = len(query_encoded)
    
    base_path = f"/Job/{loc}-{query_encoded}-jobs-SRCH_IL.0,{loc_len}_{SITE_CONFIG['glassdoor']['loc_id']}_KO{keyword_start},{keyword_len}.htm"
    url = f"{SITE_CONFIG['glassdoor']['base_domain']}{base_path}"
    
    print(f"🎯 Generated initial URL for Glassdoor India (Query: '{clean_query}'):\n{url}")
    return [{"site": "glassdoor", "url": url}]

def init_driver():
    """Initialize headless Chrome driver."""
    options = Options()
    # options.add_argument("--headless")
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

def dismiss_alert_modal(driver, selectors: Dict):
    """Dismiss job alert modal if present."""
    try:
        wait = WebDriverWait(driver, 5)
        close_selectors = selectors["alert_modal_close"]
        close_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, close_selectors)))
        close_button.click()
        print("🔔 Dismissed job alert modal")
        time.sleep(2)
    except TimeoutException:
        print("ℹ️ No alert modal found")
    except Exception as e:
        print(f"⚠️ Could not dismiss modal: {e}")

def load_more_jobs(driver, selectors: Dict, max_clicks: int = 10, max_jobs: int = 50):
    """Click 'Show more jobs' button repeatedly to load more results."""
    jobs_loaded = 0
    clicks = 0
    wait = WebDriverWait(driver, 10)
    
    while clicks < max_clicks:
        # *** KEY FIX: Dismiss modal INSIDE the loop ***
        # This handles the popup appearing after the first click
        dismiss_alert_modal(driver, selectors)
        
        try:
            # Check current jobs
            soup_temp = BeautifulSoup(driver.page_source, 'html.parser')
            current_containers = soup_temp.select(selectors["search_job_container"])
            jobs_loaded = len(current_containers)
            print(f"📊 Currently loaded: {jobs_loaded} jobs")
            
            if jobs_loaded >= max_jobs:
                print("✅ Reached max jobs limit")
                break
            
            # Find and click show more button
            button_selectors = selectors["show_more_button"]
            show_more_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, button_selectors)))
            driver.execute_script("arguments[0].click();", show_more_button)  # JS click to avoid issues
            print(f"🔄 Clicked 'Show more jobs' ({clicks + 1}/{max_clicks})")
            time.sleep(random.uniform(3, 6))  # Wait for load
            clicks += 1
            
        except TimeoutException:
            print("No more 'Show more jobs' button found - all loaded")
            break
        except NoSuchElementException:
            print("'Show more jobs' button not found")
            break
        except Exception as e:
            print(f"⚠️ Error clicking show more: {e}")
            break
    
    print(f"✅ Loading complete: {clicks} clicks, {jobs_loaded} jobs available")
    return jobs_loaded

def extract_search_data(container, base_url: str, site: str, selectors: Dict) -> Optional[dict]:
    """Extract basic job data from search page container."""
    title_elem = container.select_one(selectors["search_title"])
    if not title_elem:
        return None
    
    title = title_elem.get_text(strip=True)
    url = title_elem.get('href', '')
    if url and not url.startswith('http'):
        url = f"https://www.glassdoor.co.in{url}"
    
    company_elem = container.select_one(selectors["search_company"])
    company = company_elem.get_text(strip=True) if company_elem else "Not specified"
    
    location_elem = container.select_one(selectors["search_location"])
    location = location_elem.get_text(strip=True) if location_elem else "Not specified"
    
    snippet_elem = container.select_one(selectors["search_snippet"])
    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
    
    skills_elems = container.select(selectors["search_skills"])
    skills = [s.get_text(strip=True).strip() for s in skills_elems if len(s.get_text(strip=True)) > 2]
    
    return {
        "title": title,
        "company": company,
        "location": location,
        "snippet": snippet,
        "skills": skills,
        "url": url,
        "source": site.title(),
        "scraped_at": datetime.now().isoformat()
    }

def extract_detail_data(driver, selectors: Dict, base_info: dict) -> dict:
    """Extract full data from detail page."""
    try:
        dismiss_alert_modal(driver, selectors)
        
        wait = WebDriverWait(driver, 20)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selectors["wait_for_detail"])))
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        title_elem = soup.select_one(selectors["detail_title"])
        if title_elem:
            base_info["title"] = title_elem.get_text(strip=True)
        
        company_elem = soup.select_one(selectors["detail_company"])
        if company_elem:
            base_info["company"] = company_elem.get_text(strip=True)
        
        location_elem = soup.select_one(selectors["detail_location"])
        if location_elem:
            base_info["location"] = location_elem.get_text(strip=True)
        
        desc_elem = soup.select_one(selectors["detail_description"])
        description = desc_elem.get_text(strip=True) if desc_elem else base_info.get("snippet", "")
        base_info["description"] = description[:2000] + "..." if len(description) > 2000 else description
        
        skills_elems = soup.select(selectors["detail_skills"])
        detail_skills = [s.get_text(strip=True).strip('-• ').strip() for s in skills_elems 
                         if any(keyword in s.get_text(strip=True).lower() for keyword in 
                                ['python', 'sql', 'aws', 'django', 'flask', 'git', 'docker', 'react', 'javascript', 'ml', 'ai'])]
        base_info["skills"].extend(detail_skills)
        base_info["skills"] = list(set([s for s in base_info["skills"] if s]))
        
        salary_elem = soup.select_one(selectors["detail_salary"])
        base_info["salary"] = salary_elem.get_text(strip=True) if salary_elem else "Not specified"
        
        posted_elem = soup.select_one(selectors["detail_posted"])
        base_info["posted_date"] = posted_elem.get_text(strip=True) if posted_elem else "Not specified"
        
        exp_match = re.search(r'(\d+[\s-]?years?|entry level|senior|mid[\s-]?level)', base_info["description"], re.I)
        base_info["experience"] = exp_match.group(1) if exp_match else "Not specified"
        
        return base_info
        
    except TimeoutException:
        print(f"❌ Timeout on detail: {base_info['url']}")
        base_info["description"] = base_info.get("snippet", "Not specified")
        return base_info
    except Exception as e:
        print(f"❌ Error on detail {base_info['url']}: {e}")
        return base_info

def is_valid_job(job_data: dict) -> bool:
    """Validate job posting."""
    title = job_data.get('title', '').lower()
    company = job_data.get('company', '').lower()
    description = job_data.get('description', '').lower()
    invalids = ['not specified', 'search', 'trending', 'top companies', 'advertisement', 'create alert']
    if any(inv in title or inv in company or inv in description for inv in invalids):
        return False
    if 'python' not in title and 'python' not in description:
        return False
    return bool(job_data.get('title') and job_data.get('company') and len(job_data.get('description', '')) > 50)

def scrape_glassdoor_site(url_info: Dict[str, str], max_jobs: int = 50) -> List[dict]:
    """Scrape Glassdoor search page, load more via button, extract search data, then details for valid jobs."""
    site = url_info["site"]
    url = url_info["url"]
    config = SITE_CONFIG.get(site, {})
    if not config:
        return []
    
    driver = None
    try:
        driver = init_driver()
        print(f"🌐 Loading {site} search: {url}")
        driver.get(url)
        
        dismiss_alert_modal(driver, config["selectors"])
        
        # Load more jobs via button
        load_more_jobs(driver, config["selectors"], max_clicks=10, max_jobs=max_jobs)
        
        # Scroll one more time for any lazy loads
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(3)
        
        # Wait for at least one job
        wait = WebDriverWait(driver, 30)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, config["selectors"]["wait_for_search"])))
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Debug save
        debug_file = f"debug_glassdoor_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(soup.prettify())
        
        jobs = []
        selectors = config["selectors"]
        containers = soup.select(selectors["search_job_container"])
        
        if not containers:
            all_articles = soup.find_all('article')
            containers = [art for art in all_articles if 'job' in art.get('class', []) or ('python' in art.get_text().lower() and len(art.get_text(strip=True)) > 200)]
            print(f"🔍 Fallback: {len(containers)} containers")
        
        print(f"📋 Parsing {len(containers)} job cards")
        
        valid_search_jobs = []
        for container in containers[:max_jobs]:
            search_data = extract_search_data(container, url, site, selectors)
            if search_data and is_valid_job(search_data):
                valid_search_jobs.append(search_data)
        
        print(f"📝 {len(valid_search_jobs)} valid jobs found for details")
        
        # Now visit details for each (limit to avoid blocks)
        for i, search_data in enumerate(valid_search_jobs[:20]):  # Limit details to 20 per run
            try:
                print(f"🔗 Detail {i+1}: {search_data['title'][:50]} at {search_data['company']}")
                driver.get(search_data["url"])
                time.sleep(random.uniform(3, 5))
                
                job_data = extract_detail_data(driver, selectors, search_data)
                
                if is_valid_job(job_data):
                    jobs.append(job_data)
                
                if i < len(valid_search_jobs) - 1:
                    driver.back()
                    time.sleep(2)
                    dismiss_alert_modal(driver, selectors)
            
            except Exception as e:
                print(f"❌ Detail error {i+1}: {e}")
                try:
                    driver.back()
                    time.sleep(1)
                except:
                    pass
                continue
        
        print(f"✅ {site}: {len(jobs)} detailed jobs scraped")
        return jobs
        
    except TimeoutException:
        print(f"❌ Timeout on {site} (check query/URL)")
    except WebDriverException as e:
        print(f"❌ Selenium error: {e}")
    finally:
        if driver:
            driver.quit()
    
    time.sleep(random.uniform(5, 10))
    return []

def scrape_glassdoor(query: str, max_jobs: int = 50):
    """Main function: Load initial page and expand via button."""
    print("🔍 Starting Glassdoor India scraper (button load + details)...")
    urls = generate_glassdoor_urls(query)
    
    all_jobs = []
    for url_info in urls:
        jobs = scrape_glassdoor_site(url_info, max_jobs)
        all_jobs.extend(jobs)
    
    df = pd.DataFrame(all_jobs)
    if not df.empty:
        df = df.drop_duplicates(subset=['title', 'company', 'url'])
        df['skills'] = df['skills'].apply(lambda x: ', '.join(x) if isinstance(x, list) else str(x))
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        query_clean = re.sub(r'[^a-z0-9_]', '_', query.lower())
        filename = f"glassdoor_jobs_{query_clean}_{timestamp}.csv"
        df.to_csv(filename, index=False)
        
        print(f"✅ Saved {len(df)} unique jobs to {filename}")
        return df
    else:
        print("❌ No jobs. Check debug HTML and query.")
        return pd.DataFrame()

if __name__ == "__main__":
    print("Glassdoor India Scraper (Show More Button + Details)")
    print("=" * 60)
    
    query = "python developer"
    df = scrape_glassdoor(query, max_jobs=50)