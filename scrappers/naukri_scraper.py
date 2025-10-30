# naukri_scraper.py
import os
import json
import re
import pandas as pd
import time
import random
from typing import List, Dict
from bs4 import BeautifulSoup
import datetime
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException

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

if __name__ == "__main__":
    queries = [
        "python-developer",
        "software-developer", 
        "data-scientist"
    ]
    
    for query in queries[:1]: 
        print(f"\n{'#'*60}")
        print(f"🚀 Starting Naukri Scraper for: {query}")
        print(f"{'#'*60}")
        
        scraper = NaukriScraper(query)
        scraper.scrape_multiple_pages(max_pages=2)  # Start with 2 pages
        scraper.save_to_csv()
        scraper.get_stats()