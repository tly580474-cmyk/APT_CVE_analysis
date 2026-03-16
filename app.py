from flask import Flask, render_template, jsonify
import os
import re

app = Flask(__name__)

def parse_report():
    report_path = 'cve_analysis_report.txt'
    if not os.path.exists(report_path):
        return None
    
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    data = {
        'total_cves': 0,
        'years': [],
        'year_data': {},
        'top_vulnerabilities': [],
        'top_products': [],
        'poc_data': {'with_poc': 0, 'without_poc': 0}
    }
    
    # Parse Total CVEs
    total_match = re.search(r'Total CVEs: (\d+)', content)
    if total_match:
        data['total_cves'] = int(total_match.group(1))
    
    # Parse Years covered
    years_match = re.search(r'Years covered: (.*)', content)
    if years_match:
        data['years'] = [y.strip() for y in years_match.group(1).split(',')]
    
    # Parse CVE count by year
    year_section = re.search(r'CVE count by year:\n(.*?)\n\n', content, re.DOTALL)
    if year_section:
        year_lines = year_section.group(1).strip().split('\n')
        for line in year_lines:
            parts = line.split(': ')
            if len(parts) == 2:
                data['year_data'][parts[0]] = int(parts[1])
    
    # Parse Top 10 vulnerability types
    vuln_section = re.search(r'Top 10 vulnerability types:\n(.*?)\n\n', content, re.DOTALL)
    if vuln_section:
        vuln_lines = vuln_section.group(1).strip().split('\n')
        for line in vuln_lines:
            parts = line.rsplit(': ', 1)
            if len(parts) == 2:
                data['top_vulnerabilities'].append({'type': parts[0], 'count': int(parts[1])})
    
    # Parse Top 10 products
    product_section = re.search(r'Top 10 products:\n(.*?)\n\n', content, re.DOTALL)
    if product_section:
        product_lines = product_section.group(1).strip().split('\n')
        for line in product_lines:
            parts = line.rsplit(': ', 1)
            if len(parts) == 2:
                data['top_products'].append({'name': parts[0], 'count': int(parts[1])})
    
    # Parse POC availability
    poc_with_match = re.search(r'With GitHub POC: (\d+)', content)
    poc_without_match = re.search(r'Without GitHub POC: (\d+)', content)
    if poc_with_match:
        data['poc_data']['with_poc'] = int(poc_with_match.group(1))
    if poc_without_match:
        data['poc_data']['without_poc'] = int(poc_without_match.group(1))
        
    return data

@app.route('/')
def index():
    report_data = parse_report()
    return render_template('report.html', data=report_data)

@app.route('/api/data')
def api_data():
    report_data = parse_report()
    return jsonify(report_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
