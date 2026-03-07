---
categories:
- Risk Management
- Security
- Compliance
description: Simplified overview of risk assessment frameworks based on ISO 27005 and NIST SP 800-30, with templates for identifying, analyzing, and prioritizing risks.
title: Risk Assessment Frameworks
---

|              |                                     |
|--------------|-------------------------------------|
| **Title**    | Risk Assessment Frameworks          |
| **Doc#**     | DOC-RISK-002                        |
| **Version**  | 1.0                                 |
| **Date**     | 14-09-2024                          |

This document provides simplified risk assessment frameworks based on ISO 27005 and NIST SP 800-30, along with templates that guide the process of identifying, analysing, and prioritising risks.

## ISO 27005-Based Risk Assessment Framework

ISO 27005 is an international standard specifically focused on information security risk management. It provides guidelines for identifying, assessing, and managing risks in an information security context.

### Framework Overview

1. **Context Establishment:**
   - Define the scope of the risk assessment (e.g., specific systems, data types)
   - Identify the assets, threats, vulnerabilities, and controls related to the scope
   - Determine the risk criteria, including risk appetite and tolerance levels

2. **Risk Identification:**
   - Identify potential threats to the assets (e.g., cyber-attacks, insider threats)
   - Identify vulnerabilities that could be exploited by these threats
   - Determine the existing controls that mitigate these vulnerabilities

3. **Risk Analysis:**
   - Assess the likelihood of each threat exploiting a vulnerability
   - Determine the potential impact on the organisation if the threat is realised
   - Combine likelihood and impact to calculate the risk level (e.g., low, medium, high)

4. **Risk Evaluation:**
   - Compare the calculated risk levels against the risk criteria to determine which risks are acceptable and which require treatment
   - Prioritise risks based on their levels to focus on the most critical ones

5. **Risk Treatment:**
   - Identify options for mitigating, transferring, accepting, or avoiding risks
   - Select and implement appropriate risk treatment measures (e.g., additional controls, policy changes)

6. **Risk Monitoring and Review:**
   - Continuously monitor the risk environment and the effectiveness of the risk treatment measures
   - Review and update the risk assessment regularly or when significant changes occur

### ISO 27005 Risk Assessment Template

| **Risk ID** | **Asset** | **Threat** | **Vulnerability** | **Existing Controls** | **Likelihood** | **Impact** | **Risk Level** | **Treatment Option** | **Responsible** | **Status** |
|-------------|-----------|------------|-------------------|----------------------|----------------|------------|----------------|---------------------|-----------------|------------|
| R-001 | Customer Data | Phishing Attack | Weak MFA enforcement | Basic MFA, Phishing training | High | High | High | Strengthen MFA, Enhance Training | CISO | In Progress |
| R-002 | Network Access | Misconfiguration | Inadequate firewall rules | Manual reviews | Medium | High | Medium | Automate configuration reviews | IT Manager | Planned |
| R-003 | Financial Records | Data Exfiltration | Lack of DLP controls | Basic monitoring | High | Very High | Critical | Implement advanced DLP | Security Team | Not Started |

## NIST SP 800-30-Based Risk Assessment Framework

NIST SP 800-30 provides a comprehensive guide for conducting risk assessments, emphasising a risk management approach that identifies, assesses, and prioritises risks to organisational operations, assets, and individuals.

### Framework Overview

1. **Prepare for Assessment:**
   - Establish the context, including the scope, objectives, and stakeholders involved in the risk assessment
   - Gather information on the systems, processes, and environment to be assessed

2. **Conduct Risk Assessment:**
   - **Risk Identification:** Identify sources of risk, including threat actors, threat events, vulnerabilities, and impacted assets
   - **Risk Analysis:** Determine the likelihood and impact of threat events exploiting vulnerabilities
   - **Risk Determination:** Calculate the risk by considering the combined likelihood and impact, often using qualitative or quantitative scales

3. **Communicate and Share Assessment Results:**
   - Document the findings, including identified risks, their levels, and recommended actions
   - Communicate results to stakeholders in a clear and actionable manner

4. **Maintain Assessment:**
   - Regularly review and update the risk assessment to reflect changes in the threat landscape, vulnerabilities, or organisational priorities

### NIST SP 800-30 Risk Assessment Template

| **Risk ID** | **System/Process** | **Threat Source** | **Threat Event** | **Vulnerability** | **Impact** | **Likelihood** | **Risk Score** | **Risk Response** | **Action Plan** | **Owner** |
|-------------|--------------------|-------------------|------------------|-------------------|------------|----------------|----------------|-------------------|-----------------|-----------|
| NIST-001 | Customer Database | External Actors | Phishing for Credentials | Weak Phishing Awareness | High | Likely | High | Mitigate | Improve training, Enhance MFA | Security Team |
| NIST-002 | Internal Network | Internal Threats | Misuse of Privileged Access | Excessive Privilege | Medium | Possible | Medium | Mitigate | Conduct access reviews | IT Manager |
| NIST-003 | Financial Systems | External Hackers | Ransomware Attack | Inadequate Endpoint Protection | Very High | Unlikely | High | Transfer (Insurance) | Improve endpoint security | CISO |

## Using These Frameworks

### Step 1: Identify Assets, Threats, and Vulnerabilities
Start by listing all critical assets (e.g., customer data, network systems) and identifying potential threats (e.g., phishing, insider misuse). Then identify vulnerabilities that could be exploited by these threats.

### Step 2: Analyse Risks
Assess the likelihood of each threat exploiting a vulnerability and the potential impact on the organisation if the threat is realised. Use a simple scale (e.g., Low, Medium, High).

### Step 3: Evaluate and Prioritise Risks
Compare the assessed risks against the organisation's risk criteria to determine which risks are acceptable and which need treatment. Prioritisation should be based on risk levels, focusing on high and critical risks.

### Step 4: Determine Risk Treatments
For each identified risk, decide on a treatment option:
- **Mitigate:** Reduce the risk through controls
- **Transfer:** Shift the risk (e.g., insurance)
- **Accept:** Acknowledge the risk
- **Avoid:** Eliminate the risk source

### Step 5: Develop Action Plans
Outline specific action plans for the chosen risk treatments, including what actions will be taken, who is responsible, and the status of these actions.
