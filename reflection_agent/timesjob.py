import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time  

def scrape_timesjobs_live(url):
    """Scrape live TimesJobs mobile site"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        jobs = []
        
        # Find job listings - TimesJobs mobile structure
        job_listings = soup.find_all('div', class_='srp-listing')
        
        for job in job_listings:
            try:
                # Extract job data using the same logic as above
                title_elem = job.find('h3').find('a')
                title = title_elem.text.strip() if title_elem else "N/A"
                
                company_elem = job.find('span', class_='srp-comp-name')
                company = company_elem.text.strip() if company_elem else "N/A"
                
                location_elem = job.find('div', class_='srp-loc')
                location = location_elem.text.strip() if location_elem else "N/A"
                
                job_data = {
                    "title": title,
                    "company": company,
                    "location": location,
                    "source": "TimesJobs",
                    "url": title_elem.get('href') if title_elem else url
                }
                jobs.append(job_data)
                
            except Exception as e:
                continue
                
        return jobs
        
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return []

# --- MODIFIED LOGIC HERE ---

# Test with actual TimesJobs URLs
base_urls = [
    "https://m.timesjobs.com/mobile/jobs-search-result.html?jobsSearchCriteria=Information%20Technology&cboPresFuncArea=35",
    "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Software+Engineer%2C&cboWorkExp1=-1&txtLocation=",
    "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Software+Developer%2C&cboWorkExp1=-1&txtLocation="
]

all_jobs = []

# Loop through each of your base search URLs
for base_url in base_urls:
    print(f"--- Scraping search: {base_url.split('?')[1][:50]}... ---")
    current_page = 1
    
    i = 0
    while i < 10:
        # Construct the URL for the current page
        paginated_url = f"{base_url}&curPage={current_page}"
        
        print(f"Scraping: {paginated_url}")
        jobs = scrape_timesjobs_live(paginated_url)
        
        if not jobs:
            # If no jobs are found, we've reached the last page
            print(f"No more jobs found at page {current_page}. Moving to next URL.")
            break
            
        all_jobs.extend(jobs)
        print(f"Found {len(jobs)} jobs on this page.")
        
        # Move to the next page
        current_page += 1
        if current_page > 10: 
            print("Reached page limit for demo. Moving to next URL.")
            break
        
        # Be polite: add a small delay to avoid spamming the server
        time.sleep(1) 
        i += 1

print(f"\n--- Total jobs found: {len(all_jobs)} ---")

# Print the first 10 jobs as a sample
for job in all_jobs[:10]:
    print(json.dumps(job, indent=2))