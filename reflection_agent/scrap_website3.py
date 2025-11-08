import os
import json
import re
import pandas as pd
import time
import random
from typing import List, TypedDict, Optional, Dict
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, StateGraph
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

class ScrapingState(TypedDict):
    messages: List[BaseMessage]
    query: str
    urls: List[Dict[str, str]]
    raw_data: List[dict]
    structured_data: List[dict]
    current_url: Optional[str]

# Dummy prompts (no LLM)
url_prompt = ChatPromptTemplate.from_messages([("system", "Dummy"), MessagesPlaceholder(variable_name="messages")])
skills_prompt = ChatPromptTemplate.from_messages([("system", "Dummy"), ("human", "{description}")])

# Updated Selectors (from tool inspections: h3/strong for FreshersWorld)
SITE_CONFIGS = {
    "freelancer": {
        "base_url": "https://www.freelancer.com/jobs/{query}/",
        "selectors": {
            "job_container": "div.ProjectCard",
            "title": "h2.project-title a",
            "company": ".freelancer-name",
            "location": ".project-location",
            "experience": ".project-budget",
            "description": ".project-description",
            "skills": ".project-tags",
            "url": "h2.project-title a[href]",
            "wait_for": "div.ProjectCard",
            "popup_close": ".close-modal"  # If popup
        }
    },
    "freshersworld": {
        "base_url": "https://www.freshersworld.com/jobs?search={query}",
        "selectors": {
            "job_container": "h3",  # Titles as containers
            "title": "h3",
            "company": "strong",  # Company in strong
            "location": ".location",
            "experience": ".experience",
            "description": "p",  # Description in p
            "skills": ".skills",
            "url": "a[href]",  # First link
            "wait_for": "h3",  # Wait for h3 jobs
            "popup_close": ".close-button, button[title='Close']"  # X on popup
        }
    },
    "foundit": {
        "base_url": "https://www.foundit.in/search/jobs?query={query}",
        "selectors": {
            "job_container": "article.job-card, li.job-item",  # Updated from inspection
            "title": ".job-title",
            "company": ".company",
            "location": ".location",
            "experience": ".experience",
            "description": ".description",
            "skills": ".skills",
            "url": "a.job-link[href]",
            "wait_for": "article.job-card",
            "popup_close": ".dismiss-popup"
        }
    }
}

SITES = ["freelancer", "freshersworld", "foundit"]

def generate_urls_node(state: ScrapingState):
    print("🔗 Generating URLs for all sites...")
    user_msg = state["messages"][-1].content
    clean_query = re.sub(r'find\s+|jobs?\s*', '', user_msg, flags=re.I).strip().lower()
    query = clean_query.replace(" ", "+")
    
    fallback_urls = []
    for site in SITES:
        base = SITE_CONFIGS[site]["base_url"].format(query=query)
        for page in range(1, 3):  # 20 pages
            if 'page' in base:
                url = base.replace('page=1', f'page={page}')
            else:
                url = f"{base}&page={page}"
            fallback_urls.append({"site": site, "url": url})
    
    state["urls"] = fallback_urls
    print(f"🎯 Generated {len(fallback_urls)} URLs (fallback)")
    return {"urls": state["urls"], "query": query}

def init_driver():
    options = Options()
    options.add_argument("--headless")  # Back to headless
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

def scrape_site_specific(url_info: Dict[str, str]) -> List[dict]:
    site = url_info["site"]
    url = url_info["url"]
    config = SITE_CONFIGS.get(site, {})
    if not config:
        return []
    
    driver = None
    page_source = ""
    try:
        driver = init_driver()
        print(f"🌐 Selenium scraping {site}: {url}")
        driver.get(url)
        
        # Close popups (e.g., Register Now)
        try:
            close_sel = config.get("popup_close", ".close-button, button[title='Close'], .dismiss-popup")
            close_btn = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, close_sel)))
            close_btn.click()
            print(f"✅ Closed popup on {site}")
            time.sleep(3)
        except TimeoutException:
            print(f"⚠️ No popup on {site}")
        
        # 15 scrolls + 10s each
        for _ in range(15):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(10)
        
        # 120s wait
        wait = WebDriverWait(driver, 90)
        wait_for = config.get("wait_for", "div[class*='job']")
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, wait_for)))
        
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
    except TimeoutException:
        print(f"❌ Timeout loading {site} (partial save)")
    except WebDriverException as e:
        print(f"❌ Selenium error on {site}: {e}")
    finally:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        debug_file = f"debug_{site}_{timestamp}.html"
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(page_source or "Partial/Empty - Timeout")
        print(f"📄 Debug saved: {debug_file}")
        
        if driver:
            driver.quit()
        
        if not page_source:
            time.sleep(random.uniform(5, 10))
            return []
    
    jobs = []
    selectors = config["selectors"]
    containers = soup.select(selectors.get("job_container", "h3, div[class*='job']"))  # Broad for FreshersWorld
    
    if not containers:
        all_divs = soup.find_all(['h3', 'div', 'li'])  # Include h3
        containers = [div for div in all_divs if 200 < len(div.get_text(strip=True)) < 3000 and ('python' in div.get_text().lower() or 'developer' in div.get_text().lower())]  # Relax filter
    
    for container in containers[:100]:
        try:
            text_content = container.get_text(strip=True)
            if len(text_content) < 100:
                continue
            
            skip_keywords = ['sign in', 'register', 'footer', 'header', 'advertisement', 'register now']
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
    
    print(f"✅ {site}: {len(jobs)} jobs scraped (Selenium + Popup Close)")
    time.sleep(random.uniform(5, 10))
    return jobs

def extract_job_data(container, base_url: str, site: str, selectors: Dict, text_content: str) -> dict:
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
                job_data[field] = element.get_text(strip=True).strip()
    
    link_sel = selectors.get("url", "a[href]")
    link = container.select_one(link_sel)
    if link and link.get('href'):
        href = link['href']
        if not href.startswith('http'):
            base_domain = f"https://www.{site}.com"
            job_data["url"] = href if href.startswith('http') else base_domain + href if href.startswith('/') else base_url + '/' + href
    
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
        false_pos = SITES
        for match in matches:
            if match not in false_pos and len(match) > 3:
                job_data["company"] = match
                break
    
    common_skills = ['python', 'django', 'flask', 'java', 'javascript', 'react', 'angular', 'node', 'sql', 'mysql', 'postgresql', 'aws', 'docker', 'git', 'api', 'machine learning']
    job_data["skills"] = [s.capitalize() for s in common_skills if s in text_content.lower()]
    
    return job_data

def is_valid_job(job_data: dict) -> bool:
    title = job_data.get('title', '').lower()
    company = job_data.get('company', '').lower()
    invalids = ['not specified', 'search', 'trending', 'top companies', 'advertisement', 'register now']
    if any(inv in title or inv in company for inv in invalids):
        return False
    if 'python' not in title and 'developer' not in title and 'python' not in job_data.get('description', '').lower():
        return False
    return bool(job_data.get('title') and job_data.get('company'))

def scrape_node(state: ScrapingState):
    print("🔍 Starting multi-site scraping...")
    if not state.get("urls"):
        return state
    
    all_scraped_data = []
    for url_info in state["urls"]:
        jobs = scrape_site_specific(url_info)
        for job in jobs:
            clean_content = f"""
Title: {job['title']}
Company: {job['company']}
Location: {job['location']}
Experience: {job['experience']}
Description: {job['description']}
URL: {job['url']}
Source: {job['source']}
"""
            scraped_item = {
                "url": job['url'],
                "html": "",
                "content": clean_content,
                "status": "success",
                "content_length": len(clean_content),
                "raw_job_data": job
            }
            all_scraped_data.append(scraped_item)
        
        print(f"✅ {url_info['site']}: {len(jobs)} jobs scraped")
    
    state["raw_data"] = all_scraped_data
    success_count = len([r for r in all_scraped_data if r["status"] == "success"])
    
    return {
        "messages": state["messages"] + [HumanMessage(content=f"Scraping completed: {success_count} jobs from {len(SITES)} sites")],
        "raw_data": state["raw_data"]
    }

def extract_node(state: ScrapingState):
    print("📊 Extracting structured data (basic skills only)...")
    if not state.get("raw_data"):
        return state
    
    new_structured_data = []
    for scraped_item in state["raw_data"]:
        if scraped_item.get("raw_job_data"):
            job_data = scraped_item["raw_job_data"]
            
            structured_info = {
                "job_title": job_data["title"],
                "company": job_data["company"],
                "location": job_data["location"],
                "experience": job_data["experience"],
                "skills": job_data["skills"],
                "description": job_data["description"],
                "salary": job_data.get("salary", "Not specified"),
                "posted_date": "Not specified",
                "job_url": job_data["url"],
                "source_portal": job_data["source"],
                "scraping_status": "success",
                "query": state.get("query", "")
            }
            new_structured_data.append(structured_info)
            print(f"✅ Extracted: {job_data['title'][:50]}... (Skills: {len(job_data['skills'])})")
    
    state["structured_data"] = new_structured_data
    return {
        "messages": state["messages"] + [HumanMessage(content=f"Extracted {len(new_structured_data)} jobs (basic skills)")],
        "structured_data": state["structured_data"]
    }

def export_node(state: ScrapingState):
    print("💾 Exporting to CSV...")
    if not state.get("structured_data"):
        return state
    
    df = pd.DataFrame(state["structured_data"])
    df = df.drop_duplicates(subset=['job_title', 'company', 'job_url'])
    df['skills'] = df['skills'].apply(lambda x: ', '.join(x) if isinstance(x, list) else str(x))
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    query_clean = state["query"].replace("+", "_")
    filename = f"jobs_{query_clean}_{timestamp}.csv"
    df.to_csv(filename, index=False)
    
    print(f"✅ Saved {len(df)} unique jobs to {filename}")
    return {
        "messages": state["messages"] + [HumanMessage(content=f"Exported {len(df)} unique jobs to {filename}")],
    }

graph_builder = StateGraph(ScrapingState)
graph_builder.add_node("generate_urls", generate_urls_node)
graph_builder.add_node("scrape", scrape_node)
graph_builder.add_node("extract", extract_node)
graph_builder.add_node("export", export_node)

graph_builder.set_entry_point("generate_urls")
graph_builder.add_edge("generate_urls", "scrape")
graph_builder.add_edge("scrape", "extract")
graph_builder.add_edge("extract", "export")
graph_builder.add_edge("export", END)

app = graph_builder.compile()

if __name__ == "__main__":
    print("Fixed Scrape-Focused Agent (Popup Close + Relaxed Filter)")
    print("=" * 60)
    
    initial_state = {
        "messages": [HumanMessage(content="Find Python developer jobs")],
        "query": "",
        "urls": [],
        "raw_data": [],
        "structured_data": []
    }
    
    print("Starting scrape-focused workflow (90-150min for 500+ jobs from 3 sites)...")
    for event in app.stream(initial_state):
        for node, value in event.items():
            if value.get('messages'):
                last_msg = value['messages'][-1]
                print(f"🟢 {node.upper()}: {last_msg.content}")
    
    print("\n✅ Done! Check CSV & debug files (inspect for h3/strong jobs).")