import csv
import requests
from bs4 import BeautifulSoup

with open('./foundit_jobs.csv', 'r', newline='') as csvfile:
    reader = csv.reader(csvfile)
    headers = next(reader)

    for row in reader:
        url = row[1]
        response = requests.get(url)
        html_content = response.text

        soup = BeautifulSoup(html_content, 'html.parser')

        div = soup.find('div', class_="break-words")

        # div = div.replace("<br/>", " ")
        if div:
            # print(type(div))
            content = div.get_text(separator=' ', strip=True)
            # print(content)

        with open('output.txt', 'a', encoding='utf-8') as file:
            file.write(content+"\n")
        # break
    print("Success")