# test_foundit_access.py
import requests
from bs4 import BeautifulSoup

def test_foundit_access():
    """Test if we can access Foundit and see what we get"""
    url = "https://www.foundit.in/search/python-jobs-in-pune?query=python&locations=%22Pune%22&queryDerived=true"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    print("🧪 Testing Foundit Access...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        print(f"Status Code: {response.status_code}")
        print(f"Content Length: {len(response.text)}")
        
        # Check what we got
        if "Access Denied" in response.text:
            print("❌ BLOCKED: Got Access Denied page")
        elif "errors.edgesuite.net" in response.text:
            print("❌ BLOCKED: Got Akamai error page") 
        else:
            soup = BeautifulSoup(response.content, 'html.parser')
            title = soup.find('title')
            if title:
                print(f"Page Title: {title.get_text()}")
            
            # Look for job count
            job_count_elements = soup.find_all(text=re.compile(r'\d+.*Job.*Found', re.IGNORECASE))
            if job_count_elements:
                print(f"Job Count Found: {job_count_elements[0]}")
            
            # Look for job containers
            job_containers = soup.find_all(['div', 'section'], class_=True)
            job_like_containers = [elem for elem in job_containers if any(keyword in ' '.join(elem.get('class', [])).lower() for keyword in ['job', 'card', 'tuple'])]
            print(f"Potential Job Containers: {len(job_like_containers)}")
            
            # Save the actual content for inspection
            with open("foundit_test_output.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            print("💾 Saved response to foundit_test_output.html")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_foundit_access()