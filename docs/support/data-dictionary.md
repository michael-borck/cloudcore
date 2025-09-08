---
categories:
- Financial
- data
description: This document provides comprehensive information about the three CloudCore datasets. Each dataset represents different aspects of CloudCore's business operations and has been designed to reveal meaningful patterns when analysed.
title: CloudCore Datasets Overview
---


## Dataset 1: CloudCore Sales Performance Data
**File:** `cloudcore-sales-data.csv`  
**Records:** 138 rows  
**Time Period:** 2023-2024 (8 quarters)  
**Purpose:** Trend analysis and regional performance comparison using Datawrapper

### Business Context
CloudCore has been experiencing mixed performance across its product portfolio and regions. Management needs to understand which products and regions are driving growth versus decline to make informed strategic decisions about resource allocation and market focus.

### Field Definitions

| Field Name | Data Type | Description | Business Significance | Example Values |
|------------|-----------|-------------|----------------------|----------------|
| Region | Text | Sales territory (North, South, East, West, Central, Metro) | Geographic performance analysis | North, Metro |
| Product | Text | CloudCore service offering | Product portfolio analysis | CloudSync, DataVault |
| Quarter | Text | Business quarter (Q1-Q4) | Seasonal trend identification | Q1, Q2, Q3, Q4 |
| Year | Integer | Calendar year | Year-over-year comparison | 2023, 2024 |
| Revenue_AUD | Currency | Quarterly revenue in Australian dollars | Financial performance metric | 89500, 156000 |
| Units_Sold | Integer | Number of service subscriptions sold | Volume performance metric | 450, 780 |
| Sales_Rep | Text | Regional sales representative | Performance by salesperson | Sarah Chen, Marcus Wong |
| Customer_Segment | Text | Target market category | Market segment analysis | Enterprise, SME |

### Product Portfolio
- **DataVault:** Premium data storage and analytics service (highest revenue)
- **CloudSync:** Core cloud synchronisation platform (mid-tier)
- **SecureLink:** Security-focused connectivity solution (SME-focused)
- **Analytics Pro:** Advanced analytics tools (struggling product)

### Key Patterns for Analysis
- **Regional Trends:** North/East showing decline, South/West showing growth
- **Product Performance:** DataVault strong across all regions, Analytics Pro underperforming
- **Seasonal Patterns:** Q4 typically strongest, Q1 typically weakest
- **Market Segments:** Enterprise customers generate higher revenue per unit

---

## Dataset 2: CloudCore Customer Satisfaction Data
**File:** `cloudcore-customer-data.csv`  
**Records:** 200 rows  
**Purpose:** Customer segmentation and satisfaction analysis using ML Playground clustering

### Business Context
CloudCore's customer satisfaction scores vary significantly across different customer segments. The company needs to understand which customer characteristics correlate with satisfaction levels to improve service delivery and reduce churn risk.

### Field Definitions

| Field Name | Data Type | Description | Business Significance | Example Values |
|------------|-----------|-------------|----------------------|----------------|
| Customer_ID | Text | Unique customer identifier | Individual customer tracking | CC001, CC002 |
| Age | Integer | Customer age in years | Demographic segmentation | 34, 42, 29 |
| Gender | Text | Customer gender identity | Demographic analysis | Female, Male |
| Industry | Text | Customer's business sector | Industry-based patterns | Healthcare, Finance |
| Company_Size | Text | Customer organisation size | Business size segmentation | Large, Medium, Small |
| Tenure_Months | Integer | Months as CloudCore customer | Loyalty/experience correlation | 18, 36, 8 |
| Primary_Product | Text | Main CloudCore service used | Product adoption patterns | DataVault, CloudSync |
| Monthly_Usage_Hours | Integer | Average monthly service usage | Engagement level indicator | 145, 89, 67 |
| Support_Tickets_6M | Integer | Support tickets in last 6 months | Service quality indicator | 2, 1, 4 |
| Satisfaction_Score | Decimal | Customer satisfaction (1-10 scale) | Key outcome measure | 8.2, 7.8, 6.1 |
| Renewal_Likelihood | Text | Probability of contract renewal | Business risk assessment | High, Medium, Low |
| Region | Text | Customer geographic location | Regional service patterns | Metro, North, South |
| Contract_Value_AUD | Currency | Annual contract value | Customer economic value | 2400, 1800, 850 |

### Industry Segments
- **Finance:** Typically high satisfaction, stable usage patterns
- **Healthcare:** Medium satisfaction, moderate support needs
- **Manufacturing:** High satisfaction, consistent usage
- **Technology:** Variable satisfaction, high usage
- **Education:** Lower satisfaction, budget constraints
- **Retail:** Medium satisfaction, seasonal usage patterns

### Key Patterns for Analysis
- **Satisfaction Clusters:** Finance/Manufacturing (high 8-9), Healthcare/Technology (medium 6-7), Education (low 3-5)
- **Usage Correlation:** Heavy DataVault users generally more satisfied
- **Support Impact:** Higher ticket volumes correlate with lower satisfaction
- **Tenure Effects:** Longer tenure generally correlates with higher satisfaction
- **Size Patterns:** Large organisations generally more satisfied than small

---

## Dataset 3: CloudCore Support Ticket Data
**File:** `cloudcore-support-data.csv`  
**Records:** 100 rows  
**Time Period:** July-October 2024  
**Purpose:** Pattern identification and service quality analysis

### Business Context
CloudCore's support team handles various types of customer issues with varying resolution times and outcomes. Understanding patterns in support requests helps identify systemic problems and improve service delivery efficiency.

### Field Definitions

| Field Name | Data Type | Description | Business Significance | Example Values |
|------------|-----------|-------------|----------------------|----------------|
| Ticket_ID | Text | Unique support ticket identifier | Individual case tracking | TK001, TK002 |
| Customer_ID | Text | Customer raising the ticket | Links to customer data | CC009, CC034 |
| Date_Created | Date | Ticket creation date | Timeline analysis | 2024-07-15 |
| Category | Text | Primary issue category | Issue type patterns | Technical, Billing |
| Subcategory | Text | Specific issue type | Detailed problem analysis | Login Issues, Invoice Discrepancy |
| Priority | Text | Urgency level assigned | Resource allocation patterns | High, Medium, Low |
| Resolution_Hours | Decimal | Time to resolve in hours | Efficiency metric | 2.5, 24.0, 8.5 |
| Customer_Segment | Text | Customer business size | Segment-based service patterns | Small, Medium, Large |
| Product | Text | CloudCore service affected | Product-specific issues | Analytics Pro, CloudSync |
| Industry | Text | Customer industry sector | Industry-specific patterns | Education, Manufacturing |
| Outcome | Text | Final ticket resolution | Success rate tracking | Resolved, Escalated |
| Satisfaction_Rating | Integer | Customer rating of support (1-5) | Service quality measure | 3, 4, 5 |
| Follow_Up_Required | Text | Whether additional action needed | Service completion indicator | Yes, No |

### Issue Categories
- **Technical (60%):** System functionality, performance, integration issues
- **Billing (20%):** Invoice, payment, contract-related queries
- **Training (15%):** User education, feature explanation requests
- **Account (5%):** Access, permissions, administrative changes

### Key Patterns for Analysis
- **Resolution Time Patterns:** Simple account issues resolve fastest, complex technical issues take longest
- **Product-Specific Issues:** Analytics Pro generates most escalations
- **Industry Patterns:** Education sector experiences most issues, Finance sector least
- **Priority Correlation:** High priority tickets don't always resolve fastest
- **Satisfaction Drivers:** Resolution time and outcome strongly correlate with satisfaction ratings

---

## Learning Activities Connection

### Activity 1: Sales Trend Analysis (Datawrapper)
Students will explore the sales dataset to identify:
- Regional performance trends over time
- Product portfolio strengths and weaknesses
- Seasonal patterns in revenue and units sold
- Sales representative effectiveness

**Key Questions:** Which regions need attention? Which products should CloudCore prioritise?

### Activity 2: Customer Segmentation (ML Playground)
Students will use clustering to discover:
- Natural customer segments based on satisfaction and usage
- Characteristics of high-value, satisfied customers
- Risk factors for customer churn
- Industry-specific service patterns

**Key Questions:** What makes customers satisfied? How can CloudCore reduce churn risk?

### Activity 3: Support Pattern Analysis (Pattern Recognition)
Students will identify patterns in:
- Issue types by customer segment and product
- Resolution time factors
- Escalation triggers
- Service quality indicators

**Key Questions:** Where are CloudCore's service gaps? How can support efficiency improve?

---

## Data Quality & Limitations

### Strengths
- Realistic business relationships and patterns
- Sufficient volume for meaningful analysis
- Clear correlations for learning objectives
- Diverse variables for multiple analysis approaches

### Intentional Limitations
- Simplified compared to real-world complexity
- Limited time range (designed for 2-hour workshop)
- Clean data (minimal missing values or errors)
- Clear patterns (designed for learning, not research)

### Ethical Considerations
- All data is fictional and anonymised
- No real customer information included
- Patterns reflect educational objectives, not actual bias
- Safe for classroom discussion and analysis

---

## File Formats & Compatibility

### CSV Structure
- UTF-8 encoding for international character support
- Comma-separated values with header row
- No special characters that might cause import issues
- Consistent date format (YYYY-MM-DD)

### Tool Compatibility
- **Datawrapper:** Optimised for easy import and visualisation
- **ML Playground:** Structured for classification and clustering algorithms
- **Spreadsheet Software:** Opens cleanly in Excel, Google Sheets
- **Database Import:** Can be imported into most database systems

---

*Last Updated: 21 August 2025*  
*Created for: ISYS6014 Week 6 - Data Analysis Fundamentals*  
*Contact: Course teaching team for questions or clarifications*