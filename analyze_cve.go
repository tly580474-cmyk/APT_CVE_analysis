package main

import (
	"bufio"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

type CVEInfo struct {
	ID          string
	Product     string
	Versions    []string
	VulnType    string
	Description string
	POCLinks    []string
}

type Report struct {
	TotalCount       int
	WithPOC          int
	WithoutPOC       int
	YearDistribution map[string]int
	ProductStats     map[string]int
	VulnTypeStats    map[string]int
	TopProducts      []struct {
		Product string
		Count   int
	}
	TopVulnTypes []struct {
		VulnType string
		Count    int
	}
	RecentCVEs []CVEInfo
}

func main() {
	startTime := time.Now()
	
	cveDir := "cve_repo"
	outputFile := "cve_analysis_report.txt"
	
	fmt.Println("Starting CVE document analysis...")
	fmt.Printf("Scanning directory: %s\n", cveDir)
	
	report := Report{
		YearDistribution: make(map[string]int),
		ProductStats:     make(map[string]int),
		VulnTypeStats:    make(map[string]int),
		WithPOC:          0,
		WithoutPOC:       0,
	}
	
	err := filepath.Walk(cveDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, ".md") {
			return nil
		}
		
		cveInfo, err := parseCVEFile(path)
		if err != nil {
			return nil
		}
		
		if cveInfo.ID != "" {
			report.TotalCount++
			
			if len(cveInfo.POCLinks) > 0 {
				report.WithPOC++
			} else {
				report.WithoutPOC++
			}
			
			year := extractYear(cveInfo.ID)
			report.YearDistribution[year]++
			
			if cveInfo.Product != "" {
				report.ProductStats[cveInfo.Product]++
			}
			
			if cveInfo.VulnType != "" {
				report.VulnTypeStats[cveInfo.VulnType]++
			}
			
			if len(report.RecentCVEs) < 50 {
				report.RecentCVEs = append(report.RecentCVEs, cveInfo)
			}
		}
		
		return nil
	})
	
	if err != nil {
		fmt.Printf("Error walking directory: %v\n", err)
		os.Exit(1)
	}
	
	for product, count := range report.ProductStats {
		if product == "n/a" || product == "null" || product == "" {
			continue
		}
		report.TopProducts = append(report.TopProducts, struct {
			Product string
			Count   int
		}{Product: product, Count: count})
	}
	sort.Slice(report.TopProducts, func(i, j int) bool {
		return report.TopProducts[i].Count > report.TopProducts[j].Count
	})
	if len(report.TopProducts) > 20 {
		report.TopProducts = report.TopProducts[:20]
	}
	
	for vulnType, count := range report.VulnTypeStats {
		if vulnType == "n/a" || vulnType == "null" || vulnType == "" {
			continue
		}
		report.TopVulnTypes = append(report.TopVulnTypes, struct {
			VulnType string
			Count    int
		}{VulnType: vulnType, Count: count})
	}
	sort.Slice(report.TopVulnTypes, func(i, j int) bool {
		return report.TopVulnTypes[i].Count > report.TopVulnTypes[j].Count
	})
	if len(report.TopVulnTypes) > 20 {
		report.TopVulnTypes = report.TopVulnTypes[:20]
	}
	
	err = writeReport(outputFile, report, startTime)
	if err != nil {
		fmt.Printf("Error writing report: %v\n", err)
		os.Exit(1)
	}
	
	fmt.Printf("Analysis complete! Report written to: %s\n", outputFile)
	fmt.Printf("Total CVE documents analyzed: %d\n", report.TotalCount)
}

func parseCVEFile(path string) (CVEInfo, error) {
	file, err := os.Open(path)
	if err != nil {
		return CVEInfo{}, err
	}
	defer file.Close()
	
	cveInfo := CVEInfo{}
	scanner := bufio.NewScanner(file)
	
	productRegex := regexp.MustCompile(`label=Product&message=([^&]+)`)
	versionRegex := regexp.MustCompile(`label=Version&message=([^&]+)`)
	vulnTypeRegex := regexp.MustCompile(`label=Vulnerability&message=([^&]+)`)
	descRegex := regexp.MustCompile(`### Description`)
	githubRegex := regexp.MustCompile(`https://github\.com/[\w-]+/[\w-]+`)
	
	inDescription := false
	descriptionLines := []string{}
	
	for scanner.Scan() {
		line := scanner.Text()
		
		if strings.HasPrefix(line, "### [CVE-") {
			parts := strings.Split(line, "[")
			if len(parts) > 1 {
				idPart := strings.Split(parts[1], "]")
				if len(idPart) > 0 {
					cveInfo.ID = idPart[0]
				}
			}
		}
		
		if productRegex.MatchString(line) {
			match := productRegex.FindStringSubmatch(line)
			if len(match) > 1 {
				product, _ := url.QueryUnescape(match[1])
				product = strings.TrimSpace(product)
				if cveInfo.Product == "" {
					cveInfo.Product = product
				}
			}
		}
		
		if versionRegex.MatchString(line) {
			match := versionRegex.FindStringSubmatch(line)
			if len(match) > 1 {
				version, _ := url.QueryUnescape(match[1])
				version = strings.TrimSpace(version)
				cveInfo.Versions = append(cveInfo.Versions, version)
			}
		}
		
		if vulnTypeRegex.MatchString(line) {
			match := vulnTypeRegex.FindStringSubmatch(line)
			if len(match) > 1 {
				vulnType, _ := url.QueryUnescape(match[1])
				vulnType = strings.TrimSpace(vulnType)
				if cveInfo.VulnType == "" {
					cveInfo.VulnType = vulnType
				}
			}
		}
		
		if descRegex.MatchString(line) {
			inDescription = true
			continue
		}
		
		if inDescription {
			if strings.HasPrefix(line, "###") || strings.HasPrefix(line, "####") {
				inDescription = false
			} else if strings.TrimSpace(line) != "" {
				descriptionLines = append(descriptionLines, strings.TrimSpace(line))
			}
		}
		
		if githubRegex.MatchString(line) {
			links := githubRegex.FindAllString(line, -1)
			cveInfo.POCLinks = append(cveInfo.POCLinks, links...)
		}
	}
	
	cveInfo.Description = strings.Join(descriptionLines, " ")
	if len(cveInfo.Description) > 200 {
		cveInfo.Description = cveInfo.Description[:200] + "..."
	}
	
	return cveInfo, nil
}

func extractYear(cveID string) string {
	parts := strings.Split(cveID, "-")
	if len(parts) >= 2 {
		return parts[1]
	}
	return "Unknown"
}

func writeReport(filename string, report Report, startTime time.Time) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	
	w := bufio.NewWriter(file)
	
	fmt.Fprintln(w, "================================================================================")
	fmt.Fprintln(w, "                        CVE DOCUMENTS ANALYSIS REPORT")
	fmt.Fprintln(w, "================================================================================")
	fmt.Fprintln(w)
	
	fmt.Fprintf(w, "Report Generated: %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Fprintf(w, "Analysis Duration: %v\n", time.Since(startTime))
	fmt.Fprintln(w)
	
	fmt.Fprintln(w, "================================================================================")
	fmt.Fprintln(w, "                              OVERVIEW")
	fmt.Fprintln(w, "================================================================================")
	fmt.Fprintf(w, "Total CVE Documents Analyzed: %d\n", report.TotalCount)
	fmt.Fprintf(w, "With POC: %d\n", report.WithPOC)
	fmt.Fprintf(w, "Without POC: %d\n", report.WithoutPOC)
	fmt.Fprintln(w)
	
	fmt.Fprintln(w, "--------------------------------------------------------------------------------")
	fmt.Fprintln(w, "YEAR DISTRIBUTION")
	fmt.Fprintln(w, "--------------------------------------------------------------------------------")
	
	years := make([]string, 0, len(report.YearDistribution))
	for year := range report.YearDistribution {
		years = append(years, year)
	}
	sort.Strings(years)
	
	for _, year := range years {
		count := report.YearDistribution[year]
		fmt.Fprintf(w, "%s: %d\n", year, count)
	}
	fmt.Fprintln(w)
	
	fmt.Fprintln(w, "--------------------------------------------------------------------------------")
	fmt.Fprintln(w, "TOP AFFECTED PRODUCTS")
	fmt.Fprintln(w, "--------------------------------------------------------------------------------")
	
	for i, item := range report.TopProducts {
		fmt.Fprintf(w, "%2d. %-30s %d\n", i+1, item.Product, item.Count)
	}
	fmt.Fprintln(w)
	
	fmt.Fprintln(w, "--------------------------------------------------------------------------------")
	fmt.Fprintln(w, "VULNERABILITY TYPES")
	fmt.Fprintln(w, "--------------------------------------------------------------------------------")
	
	for i, item := range report.TopVulnTypes {
		fmt.Fprintf(w, "%2d. %-35s %d\n", i+1, item.VulnType, item.Count)
	}
	fmt.Fprintln(w)
	
	fmt.Fprintln(w, "================================================================================")
	fmt.Fprintln(w, "                              END OF REPORT")
	fmt.Fprintln(w, "================================================================================")
	
	return w.Flush()
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
