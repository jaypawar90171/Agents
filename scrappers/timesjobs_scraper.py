import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time
import pandas as pd
import re
import os

def scrape_timesjobs_live(url):
    """Scrape live TimesJobs mobile site with enhanced data extraction"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        jobs = []
        
        # Multiple selectors for job listings - TimesJobs mobile structure
        job_selectors = [
            'div.srp-listing',
            'div.job-tuple',
            'div.job-listing',
            'div.srp-job',
            'div.job-item'
        ]
        
        job_listings = None
        for selector in job_selectors:
            job_listings = soup.find_all('div', class_=selector)
            if job_listings:
                print(f"✅ Found {len(job_listings)} jobs using selector: {selector}")
                break
        
        if not job_listings:
            # Try finding by data attributes or other patterns
            job_listings = soup.find_all('div', {'data-jobid': True})
            if not job_listings:
                job_listings = soup.find_all('div', class_=re.compile(r'srp|job|tuple'))
                print(f"🔍 Found {len(job_listings)} jobs using regex selector")
        
        for job in job_listings:
            try:
                # Extract job title with multiple selectors
                title_elem = (job.find('h3') or 
                             job.find('h2') or 
                             job.find('a', class_=re.compile(r'title|job')) or
                             job.find('span', class_=re.compile(r'title|job')))
                
                if title_elem:
                    title_link = title_elem.find('a') if title_elem.find('a') else title_elem
                    title = title_link.get_text(strip=True) if title_link else "N/A"
                    job_url = title_link.get('href') if title_link and title_link.get('href') else "N/A"
                else:
                    title = "N/A"
                    job_url = "N/A"
                
                # Extract company with multiple selectors
                company_elem = (job.find('span', class_='srp-comp-name') or
                               job.find('div', class_=re.compile(r'comp|company')) or
                               job.find('span', class_=re.compile(r'comp|company')) or
                               job.find('h4'))
                company = company_elem.get_text(strip=True) if company_elem else "N/A"
                
                # Extract location with multiple selectors
                location_elem = (job.find('div', class_='srp-loc') or
                                job.find('span', class_=re.compile(r'loc|location')) or
                                job.find('div', class_=re.compile(r'loc|location')) or
                                job.find('i', class_=re.compile(r'location')))
                location = location_elem.get_text(strip=True) if location_elem else "N/A"
                
                # Extract experience
                experience_elem = (job.find('div', class_=re.compile(r'exp|experience')) or
                                  job.find('span', class_=re.compile(r'exp|experience')) or
                                  job.find('i', class_=re.compile(r'experience')))
                experience = experience_elem.get_text(strip=True) if experience_elem else "N/A"
                
                # Extract salary
                salary_elem = (job.find('div', class_=re.compile(r'sal|salary')) or
                              job.find('span', class_=re.compile(r'sal|salary')) or
                              job.find('i', class_=re.compile(r'salary')))
                salary = salary_elem.get_text(strip=True) if salary_elem else "N/A"
                
                # Extract skills from description
                description_elem = (job.find('div', class_=re.compile(r'desc|description')) or
                                   job.find('span', class_=re.compile(r'desc|description')) or
                                   job.find('p', class_=re.compile(r'desc|description')))
                description = description_elem.get_text(strip=True) if description_elem else ""
                
                # Extract skills from the entire job text
                all_text = job.get_text(strip=True).lower()
                skills_keywords = [
                    'python', 'java', 'javascript', 'react', 'angular', 'node', 'html', 'css',
                    'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'machine learning',
                    'django', 'flask', 'php', 'c++', 'c#', '.net', 'spring', 'hibernate',
                    'rest api', 'graphql', 'microservices', 'devops', 'jenkins', 'git'
                ]
                skills_found = [skill.title() for skill in skills_keywords if skill in all_text]
                
                # Extract posted date
                posted_date = "N/A"
                date_patterns = [
                    r'(\d+ (days?|hours?|months?) ago)',
                    r'Posted:? (\d+ \w+ ago)',
                    r'(\d+ \w+ old)'
                ]
                for pattern in date_patterns:
                    match = re.search(pattern, all_text, re.IGNORECASE)
                    if match:
                        posted_date = match.group(1)
                        break
                
                # Create complete job data
                job_data = {
                    "title": title,
                    "company": company,
                    "location": location,
                    "experience": experience,
                    "salary": salary,
                    "skills": skills_found,
                    "description": description[:300] + "..." if len(description) > 300 else description,
                    "posted_date": posted_date,
                    "url": job_url if job_url.startswith('http') else f"https://m.timesjobs.com{job_url}" if job_url != "N/A" else url,
                    "source": "TimesJobs",
                    "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                
                # Only add valid jobs
                if title != "N/A" and company != "N/A":
                    jobs.append(job_data)
                    print(f"✅ Found: {title[:40]}... at {company}")
                
            except Exception as e:
                print(f"⚠️ Error parsing job: {e}")
                continue
                
        return jobs
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error scraping {url}: {e}")
        return []
    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")
        return []

def save_to_csv(jobs, filename=None):
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

def save_to_excel(jobs, filename=None):
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

# --- MODIFIED MAIN LOGIC ---

def main():
    """Main scraping function with enhanced capabilities"""
    
    # Test with actual TimesJobs URLs
    base_urls = [
        "https://m.timesjobs.com/mobile/jobs-search-result.html?jobsSearchCriteria=Information%20Technology&cboPresFuncArea=35",
        "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Software+Engineer%2C&cboWorkExp1=-1&txtLocation=",
        "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Software+Developer%2C&cboWorkExp1=-1&txtLocation=",
        "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Python+Developer%2C&cboWorkExp1=-1&txtLocation=",
        "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Data+Scientist%2C&cboWorkExp1=-1&txtLocation="
    ]
    
    all_jobs = []
    
    # Loop through each search URL
    for i, base_url in enumerate(base_urls):
        print(f"\n{'='*60}")
        print(f"🔍 Scraping URL {i+1}/{len(base_urls)}")
        print(f"📝 Search: {base_url.split('?')[1][:50]}...")
        print(f"{'='*60}")
        
        current_page = 1
        max_pages_per_url = 2
        pages_scraped = 0
        
        while pages_scraped < max_pages_per_url:
            # Construct the URL for the current page
            paginated_url = f"{base_url}&curPage={current_page}"
            
            print(f"📄 Scraping page {current_page}: {paginated_url}")
            jobs = scrape_timesjobs_live(paginated_url)
            
            if not jobs:
                print(f"❌ No jobs found at page {current_page}. Moving to next URL.")
                break
                
            all_jobs.extend(jobs)
            print(f"✅ Found {len(jobs)} jobs on page {current_page}")
            
            # Move to the next page
            current_page += 1
            pages_scraped += 1
            
            # Be polite: add delay to avoid spamming the server
            if pages_scraped < max_pages_per_url:
                delay = 2  # seconds
                print(f"⏳ Waiting {delay} seconds before next page...")
                time.sleep(delay)
        
        print(f"📊 Completed URL {i+1}: {pages_scraped} pages, {len([j for j in all_jobs if j.get('source_url') == base_url])} total jobs from this search")
        
        # Delay between different search URLs
        if i < len(base_urls) - 1:
            delay_between_searches = 3
            print(f"🕒 Waiting {delay_between_searches} seconds before next search...")
            time.sleep(delay_between_searches)

    print(f"\n{'='*60}")
    print(f"🎉 SCRAPING COMPLETED!")
    print(f"{'='*60}")
    print(f"📊 Total jobs found: {len(all_jobs)}")
    
    if not all_jobs:
        print("❌ No jobs were scraped. Please check:")
        print("   - Internet connection")
        print("   - URL accessibility")
        print("   - CSS selectors (might need updating)")
        return
    
    # Save to CSV
    csv_filename = save_to_csv(all_jobs)
    
    # Save to Excel (optional)
    excel_filename = save_to_excel(all_jobs)
    
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

if __name__ == "__main__":
    main()