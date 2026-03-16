import os
import re
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
from bs4 import BeautifulSoup

class CVEDataAnalyzer:
    def __init__(self, repo_path):
        self.repo_path = repo_path
        self.cve_data = []
        self.df = None
    
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
        
        # 转换为DataFrame
        self.df = pd.DataFrame(self.cve_data)
        return self.df
    
    def analyze_data(self):
        """分析数据"""
        if self.df is None:
            self.collect_data()
        
        print(f"Total CVEs: {len(self.df)}")
        print(f"Years covered: {sorted(self.df['year'].unique())}")
        
        # 漏洞类型分布
        print("\nTop 10 vulnerability types:")
        vuln_counts = Counter(self.df['vulnerability'])
        for vuln, count in vuln_counts.most_common(10):
            print(f"{vuln}: {count}")
        
        # 产品分布
        print("\nTop 10 products:")
        product_counts = Counter(self.df['product'])
        for product, count in product_counts.most_common(10):
            print(f"{product}: {count}")
        
        # POC availability
        poc_availability = self.df['has_github_poc'].value_counts()
        print("\nPOC availability:")
        print(f"With GitHub POC: {poc_availability.get(True, 0)}")
        print(f"Without GitHub POC: {poc_availability.get(False, 0)}")
    
    def visualize_data(self):
        """生成可视化图表"""
        if self.df is None:
            self.collect_data()
        
        # 设置中文字体
        plt.rcParams['font.sans-serif'] = ['SimHei']  # 用来正常显示中文标签
        plt.rcParams['axes.unicode_minus'] = False  # 用来正常显示负号
        
        # 1. 每年CVE数量趋势
        plt.figure(figsize=(12, 6))
        year_counts = self.df['year'].value_counts().sort_index()
        sns.barplot(x=year_counts.index, y=year_counts.values)
        plt.title('每年CVE数量趋势')
        plt.xlabel('年份')
        plt.ylabel('CVE数量')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig('cve_by_year.png')
        print("\nSaved: cve_by_year.png")
        
        # 2. 漏洞类型分布
        plt.figure(figsize=(12, 6))
        vuln_counts = Counter(self.df['vulnerability']).most_common(15)
        vuln_types = [v[0] for v in vuln_counts]
        vuln_values = [v[1] for v in vuln_counts]
        sns.barplot(x=vuln_values, y=vuln_types)
        plt.title('漏洞类型分布')
        plt.xlabel('数量')
        plt.ylabel('漏洞类型')
        plt.tight_layout()
        plt.savefig('vulnerability_types.png')
        print("Saved: vulnerability_types.png")
        
        # 3. 产品分布
        plt.figure(figsize=(12, 6))
        product_counts = Counter(self.df['product']).most_common(15)
        products = [p[0] for p in product_counts]
        product_values = [p[1] for p in product_counts]
        sns.barplot(x=product_values, y=products)
        plt.title('产品分布')
        plt.xlabel('数量')
        plt.ylabel('产品')
        plt.tight_layout()
        plt.savefig('product_distribution.png')
        print("Saved: product_distribution.png")
        
        # 4. POC可用性饼图
        plt.figure(figsize=(8, 8))
        poc_availability = self.df['has_github_poc'].value_counts()
        labels = ['有GitHub POC', '无GitHub POC']
        sizes = [poc_availability.get(True, 0), poc_availability.get(False, 0)]
        colors = ['#4CAF50', '#F44336']
        plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        plt.axis('equal')
        plt.title('POC可用性分布')
        plt.tight_layout()
        plt.savefig('poc_availability.png')
        print("Saved: poc_availability.png")
    
    def export_data(self, output_file='cve_data.json'):
        """导出数据为JSON文件"""
        if self.df is None:
            self.collect_data()
        
        # 将DataFrame转换为字典列表
        data_to_export = self.df.to_dict('records')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data_to_export, f, ensure_ascii=False, indent=2)
        
        print(f"\nExported data to: {output_file}")
    
    def run(self):
        """运行完整分析流程"""
        print("收集CVE数据...")
        self.collect_data()
        print("分析数据...")
        self.analyze_data()
        print("生成可视化图表...")
        self.visualize_data()
        print("导出数据...")
        self.export_data()
        print("\n分析完成！")

if __name__ == "__main__":
    repo_path = "cve_repo"
    analyzer = CVEDataAnalyzer(repo_path)
    analyzer.run()
