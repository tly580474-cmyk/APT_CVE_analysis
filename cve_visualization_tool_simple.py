import os
import re
import json
from collections import Counter

class CVEDataAnalyzer:
    def __init__(self, repo_path):
        self.repo_path = repo_path
        self.cve_data = []
    
    def parse_cve_file(self, file_path, year):
        """解析单个CVE文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取CVE ID
            cve_id_match = re.search(r'CVE-\d{4}-\d+', content)
            cve_id = cve_id_match.group(0) if cve_id_match else None
            
            # 提取产品信息
            product_match = re.search(r'Product&message=(.*?)&color', content)
            product = product_match.group(1) if product_match else 'Unknown'
            
            # 提取版本信息
            versions = re.findall(r'Version&message=(.*?)&color', content)
            versions = [v.replace('%20', ' ').strip() for v in versions]
            
            # 提取漏洞类型
            vuln_match = re.search(r'Vulnerability&message=(.*?)&color', content)
            vulnerability = vuln_match.group(1).replace('%20', ' ') if vuln_match else 'Unknown'
            
            # 提取描述
            desc_match = re.search(r'### Description\n\n(.*?)\n\n### POC', content, re.DOTALL)
            description = desc_match.group(1).strip() if desc_match else ''
            
            # 提取POC信息
            poc_ref_match = re.search(r'#### Reference\n(.*?)\n\n#### Github', content, re.DOTALL)
            poc_references = poc_ref_match.group(1).strip() if poc_ref_match else 'No PoCs from references.'
            
            github_match = re.search(r'#### Github\n(.*?)(?:$|###)', content, re.DOTALL)
            github_pocs = []
            if github_match:
                github_lines = github_match.group(1).strip().split('\n')
                github_pocs = [line.strip('- ').strip() for line in github_lines if line.strip()]
            
            # 构建CVE数据字典
            cve_dict = {
                'cve_id': cve_id,
                'year': year,
                'product': product,
                'versions': versions,
                'vulnerability': vulnerability,
                'description': description,
                'poc_references': poc_references,
                'github_pocs': github_pocs,
                'has_github_poc': len(github_pocs) > 0
            }
            
            return cve_dict
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return None
    
    def collect_data(self):
        """收集所有CVE数据"""
        for year_dir in os.listdir(self.repo_path):
            year_path = os.path.join(self.repo_path, year_dir)
            if os.path.isdir(year_path):
                year = year_dir
                for cve_file in os.listdir(year_path):
                    if cve_file.endswith('.md'):
                        file_path = os.path.join(year_path, cve_file)
                        cve_dict = self.parse_cve_file(file_path, year)
                        if cve_dict:
                            self.cve_data.append(cve_dict)
        
        return self.cve_data
    
    def analyze_data(self):
        """分析数据"""
        if not self.cve_data:
            self.collect_data()
        
        print(f"Total CVEs: {len(self.cve_data)}")
        
        # 提取年份
        years = [cve['year'] for cve in self.cve_data]
        unique_years = sorted(set(years))
        print(f"Years covered: {unique_years}")
        
        # 漏洞类型分布
        print("\nTop 10 vulnerability types:")
        vuln_counts = Counter([cve['vulnerability'] for cve in self.cve_data])
        for vuln, count in vuln_counts.most_common(10):
            print(f"{vuln}: {count}")
        
        # 产品分布
        print("\nTop 10 products:")
        product_counts = Counter([cve['product'] for cve in self.cve_data])
        for product, count in product_counts.most_common(10):
            print(f"{product}: {count}")
        
        # POC availability
        poc_availability = Counter([cve['has_github_poc'] for cve in self.cve_data])
        print("\nPOC availability:")
        print(f"With GitHub POC: {poc_availability.get(True, 0)}")
        print(f"Without GitHub POC: {poc_availability.get(False, 0)}")
        
        # 每年CVE数量
        print("\nCVE count by year:")
        year_counts = Counter(years)
        for year in unique_years:
            print(f"{year}: {year_counts.get(year, 0)}")
    
    def generate_text_report(self, output_file='cve_analysis_report.txt'):
        """生成文本报告"""
        if not self.cve_data:
            self.collect_data()
        
        report = []
        report.append("CVE数据分析报告")
        report.append("=" * 50)
        
        # 基本统计
        report.append(f"Total CVEs: {len(self.cve_data)}")
        years = [cve['year'] for cve in self.cve_data]
        unique_years = sorted(set(years))
        report.append(f"Years covered: {', '.join(unique_years)}")
        
        # 每年CVE数量
        report.append("\nCVE count by year:")
        year_counts = Counter(years)
        for year in unique_years:
            report.append(f"{year}: {year_counts.get(year, 0)}")
        
        # 漏洞类型分布
        report.append("\nTop 10 vulnerability types:")
        vuln_counts = Counter([cve['vulnerability'] for cve in self.cve_data])
        for vuln, count in vuln_counts.most_common(10):
            report.append(f"{vuln}: {count}")
        
        # 产品分布
        report.append("\nTop 10 products:")
        product_counts = Counter([cve['product'] for cve in self.cve_data])
        for product, count in product_counts.most_common(10):
            report.append(f"{product}: {count}")
        
        # POC可用性
        report.append("\nPOC availability:")
        poc_availability = Counter([cve['has_github_poc'] for cve in self.cve_data])
        report.append(f"With GitHub POC: {poc_availability.get(True, 0)}")
        report.append(f"Without GitHub POC: {poc_availability.get(False, 0)}")
        
        # 保存报告
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        
        print(f"\nGenerated report: {output_file}")
    
    def export_data(self, output_file='cve_data.json'):
        """导出数据为JSON文件"""
        if not self.cve_data:
            self.collect_data()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.cve_data, f, ensure_ascii=False, indent=2)
        
        print(f"\nExported data to: {output_file}")
    
    def run(self):
        """运行完整分析流程"""
        print("收集CVE数据...")
        self.collect_data()
        print("分析数据...")
        self.analyze_data()
        print("生成文本报告...")
        self.generate_text_report()
        print("导出数据...")
        self.export_data()
        print("\n分析完成！")

if __name__ == "__main__":
    repo_path = "cve_repo"
    analyzer = CVEDataAnalyzer(repo_path)
    analyzer.run()
