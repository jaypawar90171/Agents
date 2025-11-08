from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def scrape_glassdoor_selenium():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        url = "https://www.glassdoor.co.in/Job/python-developer-jobs-SRCH_KO0,14.htm?locKey=IN115"
        driver.get(url)
        
        # Wait for job listings to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "li[data-test='jobListing']"))
        )
        
        jobs = []
        job_elements = driver.find_elements(By.CSS_SELECTOR, "li[data-test='jobListing']")
        
        for job_element in job_elements:
            try:
                company = job_element.find_element(By.CSS_SELECTOR, "span.EmployerProfile_compactEmployerName__9MGcV").text
                title = job_element.find_element(By.CSS_SELECTOR, "a.JobCard_jobTitle__GLyJ1").text
                location = job_element.find_element(By.CSS_SELECTOR, "div.JobCard_location__Ds1fM").text
                
                # Salary might not always be present
                try:
                    salary = job_element.find_element(By.CSS_SELECTOR, "div.JobCard_salaryEstimate__QpbTW").text
                except:
                    salary = "N/A"
                
                jobs.append({
                    'company': company,
                    'title': title,
                    'location': location,
                    'salary': salary,
                    'source': 'Glassdoor'
                })
                
            except Exception as e:
                print(f"Error extracting job: {e}")
                continue
        
        return jobs
        
    finally:
        driver.quit()

# Test Selenium approach
jobs = scrape_glassdoor_selenium()
print(f"Scraped {len(jobs)} jobs using Selenium")

CREATE TABLE course (
    course_id INT NOT NULL,
    course_name VARCHAR(20) NOT NULL,
    dept_name VARCHAR(20) NOT NULL,
    credits INT NOT NULL,
    PRIMARY KEY (course_id)
);