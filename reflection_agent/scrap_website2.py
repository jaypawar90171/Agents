import os
import json
import re
import pandas as pd
import time
import requests
from typing import List, TypedDict, Optional
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_fireworks import ChatFireworks
from langgraph.graph import END, StateGraph
from bs4 import BeautifulSoup
import datetime
from datetime import datetime

load_dotenv()

# Define State for our scraping workflow
#typedict used to define the structure of the state that must follow the defined structure
class ScrapingState(TypedDict):
    messages: List[BaseMessage]
    urls: List[str]
    raw_data: List[dict]
    structured_data: List[dict]
    current_url: Optional[str]

llm = ChatFireworks(model="accounts/fireworks/models/llama-v3p3-70b-instruct")

def scrape_timesjobs_live(url):
    """Scrape live TimesJobs mobile site with direct parsing based on actual HTML structure"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    }
    
    try:
        print(f"🌐 Scraping URL: {url}")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        jobs = []
        
        # Save HTML for debugging
        with open("debug_page.html", "w", encoding="utf-8") as f:
            f.write(str(soup))
        
        print("🔍 Analyzing page structure...")
        
        # METHOD 1: Look for job listing containers based on actual HTML structure
        # Common patterns in job portals
        job_containers = []
        
        # Try multiple container patterns
        container_selectors = [
            'div[class*="job"]',
            'div[class*="listing"]', 
            'div[class*="tuple"]',
            'div[class*="srp"]',
            'li[class*="job"]',
            '.srp-listing',
            '.job-tuple',
            '.job-listing',
            '.search-result',
            '.result'
        ]
        
        for selector in container_selectors:
            containers = soup.select(selector)
            if containers:
                print(f"✅ Found {len(containers)} elements with selector: {selector}")
                job_containers.extend(containers)
        
        # If no specific containers found, look for any divs with substantial content
        if not job_containers:
            print("🔄 No specific job containers found. Looking for content-rich divs...")
            all_divs = soup.find_all('div')
            # Filter divs that likely contain job data (have reasonable text length and structure)
            job_containers = [div for div in all_divs if 100 < len(div.get_text(strip=True)) < 2000]
            print(f"🔄 Found {len(job_containers)} potential job containers")
        
        # Remove duplicates
        job_containers = list(set(job_containers))
        
        for container in job_containers:
            try:
                text_content = container.get_text(strip=True)
                
                # Skip containers that are clearly not job listings
                if not text_content or len(text_content) < 50:
                    continue
                    
                # Skip navigation/search elements
                skip_keywords = ['search your dream jobs', 'trending jobs', 'top companies', 'sign in', 'register', 'hamburger']
                if any(keyword in text_content.lower() for keyword in skip_keywords):
                    continue
                
                # Extract data using multiple strategies
                job_data = extract_job_data(container, url)
                
                if job_data and job_data.get('title') and job_data.get('company'):
                    # Validate this looks like a real job
                    if is_valid_job(job_data):
                        jobs.append(job_data)
                        print(f"📝 Found job: {job_data['title']} at {job_data['company']}")
                
            except Exception as e:
                print(f"❌ Error parsing container: {e}")
                continue
        
        # METHOD 2: If no jobs found, try parsing the entire page structure
        if not jobs:
            print("🔄 Trying full page analysis...")
            jobs = parse_full_page_structure(soup, url)
        
        print(f"✅ Found {len(jobs)} total jobs")
        return jobs
        
    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")
        return []

def extract_job_data(container, base_url):
    """Extract job data from a container using multiple strategies"""
    job_data = {
        "title": "Not specified",
        "company": "Not specified", 
        "location": "Not specified",
        "experience": "Not specified",
        "skills": [],
        "salary": "Not specified",
        "url": base_url,
        "source": "TimesJobs",
        "scraped_at": datetime.now().isoformat()
    }
    
    # Strategy 1: Look for specific elements with common class patterns
    title = extract_by_patterns(container, ['h2', 'h3', 'h4', '.title', '.job-title', '.designation'])
    company = extract_by_patterns(container, ['.company', '.comp-name', '.org', '.firm', '.employer'])
    location = extract_by_patterns(container, ['.location', '.loc', '.place', '.city'])
    experience = extract_by_patterns(container, ['.experience', '.exp', '.years', '.work-exp'])
    
    # Strategy 2: Extract from text content using regex patterns
    text_content = container.get_text(strip=True)
    
    if title == "Not specified":
        # Look for title-like patterns in text
        title_patterns = [
            r'(Senior|Junior)?\s*(Python|Software|Developer|Engineer|Programmer)[\w\s]*',
            r'[A-Z][a-z]+\s+(Developer|Engineer|Programmer|Specialist)',
        ]
        for pattern in title_patterns:
            match = re.search(pattern, text_content)
            if match:
                title = match.group().strip()
                break
    
    if company == "Not specified":
        # Look for company names (usually proper nouns)
        company_pattern = r'[A-Z][a-zA-Z&]+\s*(?:Pvt|Ltd|Inc|Corp|LLC)?'
        companies = re.findall(company_pattern, text_content)
        if companies:
            # Filter out common false positives
            false_positives = ['TimesJobs', 'Python', 'Software', 'Developer', 'Engineer']
            for company_name in companies:
                if company_name not in false_positives and len(company_name) > 3:
                    company = company_name
                    break
    
    # Strategy 3: Extract skills from text
    common_skills = ['python', 'java', 'javascript', 'react', 'angular', 'node', 'sql', 'mongodb', 'aws', 'docker']
    skills_found = []
    for skill in common_skills:
        if skill in text_content.lower():
            skills_found.append(skill)
    
    # Update job data
    job_data.update({
        "title": title if title != "Not specified" else extract_fallback_title(text_content),
        "company": company,
        "location": location,
        "experience": experience,
        "skills": skills_found,
        "description": f"Position for {title} at {company}",
        "url": extract_job_url(container, base_url)
    })
    
    return job_data

def extract_by_patterns(container, patterns):
    """Extract text using multiple CSS patterns"""
    for pattern in patterns:
        element = container.select_one(pattern)
        if element:
            text = element.get_text(strip=True)
            if text and text not in ['', 'Not specified', 'N/A']:
                return text
    return "Not specified"

def extract_fallback_title(text_content):
    """Extract title from text content when no specific element found"""
    # Split by common separators and take the first meaningful part
    lines = text_content.split('\n')
    for line in lines:
        line = line.strip()
        if len(line) > 10 and len(line) < 100:
            if any(keyword in line.lower() for keyword in ['developer', 'engineer', 'programmer', 'analyst', 'manager']):
                return line
    return "Not specified"

def extract_job_url(container, base_url):
    """Extract job URL from container"""
    link = container.find('a', href=True)
    if link:
        url = link['href']
        if url and not url.startswith('http'):
            if url.startswith('/'):
                return f"https://m.timesjobs.com{url}"
            else:
                return f"https://m.timesjobs.com/mobile/{url}"
    return base_url

def is_valid_job(job_data):
    """Validate if the extracted data looks like a real job"""
    title = job_data.get('title', '').lower()
    company = job_data.get('company', '').lower()
    
    # Skip if title/company are clearly not jobs
    invalid_titles = ['search your dream jobs', 'trending jobs', 'top companies', 'not specified']
    invalid_companies = ['view more', 'n/a', 'not specified']
    
    if any(invalid in title for invalid in invalid_titles):
        return False
    if any(invalid in company for invalid in invalid_companies):
        return False
    
    # Should have at least title and company
    return bool(job_data.get('title') and job_data.get('company'))

def parse_full_page_structure(soup, url):
    """Parse the entire page structure to find jobs"""
    jobs = []
    
    # Look for any structured data or lists that might contain jobs
    lists = soup.find_all(['ul', 'ol', 'div'])
    
    for list_elem in lists:
        items = list_elem.find_all(['li', 'div'])
        for item in items:
            text = item.get_text(strip=True)
            if len(text) > 50 and len(text) < 500:
                # Check if this looks like job content
                if any(keyword in text.lower() for keyword in ['developer', 'engineer', 'years experience', 'location']):
                    job_data = extract_job_data(item, url)
                    if is_valid_job(job_data):
                        jobs.append(job_data)
    
    return jobs

def scrape_with_timesjobs(urls: List[str]) -> List[dict]:
    """Use TimesJobs-specific scraper to scrape multiple URLs"""
    print(f"🚀 Starting TimesJobs batch scrape for {len(urls)} URLs...")
    
    all_scraped_data = []
    
    for base_url in urls:
        print(f"--- Scraping: {base_url} ---")
        
        # Try the base URL first
        jobs = scrape_timesjobs_live(base_url)
        
        if jobs:
            for job in jobs:
                clean_content = f"""
Title: {job['title']}
Company: {job['company']}
Location: {job['location']}
Experience: {job['experience']}
Skills: {', '.join(job['skills'])}
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
            
            print(f"✅ Found {len(jobs)} jobs")
        else:
            print("❌ No jobs found")
        
        time.sleep(1)  # Be polite
    
    print(f"✅ TimesJobs scraping completed: {len(all_scraped_data)} total jobs found")
    return all_scraped_data

# Rest of your existing code for the graph structure...
scraping_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a web scraping expert. Generate TimesJobs search URLs for job queries.
     Return 3-5 URLs, one per line. Only return URLs, no explanations.
     Format: https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=QUERY"""),
    MessagesPlaceholder(variable_name="messages")
])

# Scrape node that handles web scraping using TimesJobs scraper
def scrape_node(state: ScrapingState):
    """Node that handles web scraping using TimesJobs scraper"""
    print("🔍 Starting scrape node...")
    
    # If we don't have URLs yet, generate them
    if not state.get("urls") or len(state["urls"]) == 0:
        print("📝 Generating URLs from user query...")
        user_query = state["messages"][-1].content
        
        # Use simpler, more direct URLs
        state["urls"] = [
            "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=python+developer",
            "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=software+engineer", 
            "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=java+developer",
            "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=web+developer",
            "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=full+stack+developer"
        ]
        print(f"🎯 Using {len(state['urls'])} TimesJobs URLs to scrape")
    
    # Scrape all URLs using TimesJobs scraper
    if state["urls"] and (not state.get("raw_data") or len(state.get("raw_data", [])) == 0):
        print("🌐 Starting web scraping...")
        scraped_results = scrape_with_timesjobs(state["urls"])
        state["raw_data"] = scraped_results
        
        success_count = len([r for r in scraped_results if r["status"] == "success"])
        
        return {
            "messages": state["messages"] + [
                HumanMessage(content=f"TimesJobs scraping completed: {success_count} jobs scraped successfully from {len(state['urls'])} URLs")
            ],
            "urls": state["urls"],
            "raw_data": state["raw_data"]
        }
    
    return state

# Extract node that extracts structured data from scraped content
def extract_node(state: ScrapingState):
    """Node that extracts structured data from scraped content"""
    print("📊 Starting extract node...")
    
    if state.get("raw_data") and len(state["raw_data"]) > 0:
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
                    "description": job_data.get("description", f"Job at {job_data['company']} in {job_data['location']}"),
                    "salary": job_data.get("salary", "Not specified"),
                    "posted_date": "Not specified",
                    "job_url": job_data["url"],
                    "source_portal": "TimesJobs",
                    "scraping_status": "success"
                }
                new_structured_data.append(structured_info)
                print(f"✅ Extracted: {job_data['title'][:50]}...")
        
        state["structured_data"] = new_structured_data
        
        return {
            "messages": state["messages"] + [
                HumanMessage(content=f"Extracted structured data from {len(new_structured_data)} job postings")
            ],
            "structured_data": state["structured_data"]
        }
    else:
        print("❌ No raw data available for extraction")
    
    return state

# Build the graph
graph_builder = StateGraph(ScrapingState)
graph_builder.add_node("scrape", scrape_node)
graph_builder.add_node("extract", extract_node)
graph_builder.set_entry_point("scrape")
graph_builder.add_edge("scrape", "extract")
graph_builder.add_edge("extract", END)

app = graph_builder.compile()
print(app.get_graph().draw_mermaid())
app.get_graph().print_ascii()

if __name__ == "__main__":
    print("TimesJobs Scraping Agent")
    print("=" * 60)
    
    initial_state = {
        "messages": [
            HumanMessage(content="Find Python developer jobs on TimesJobs")
        ],
        "urls": [],
        "raw_data": [],
        "structured_data": []
    }
    
    # Start the scraping workflow 
    print("Starting TimesJobs scraping workflow...")
    for event in app.stream(initial_state):
        for node, value in event.items():
            if value.get('messages'):
                last_msg = value['messages'][-1]
                print(f"🟢 {node.upper()}: {last_msg.content}")
    
    print("\n✅ Workflow completed!")