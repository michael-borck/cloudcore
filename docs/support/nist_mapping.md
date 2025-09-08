---
categories:
- Compliance
- Security Management
- IT Management
description: Below is a list of NIST SP 800-53 Controls Families and the mappings to CloudCore policies and controls in place.
title: NIST MAppings
---

|              |                                     |
|--------------|-------------------------------------|
| **Title**    | NIST MAppings             |
| **Doc#**     | DOC-ITMA-005 |
| **Version**  | 1.0                                 |
| **Date**     | 25-03-2023                              |

Below is a list of NIST SP 800-53 Controls Families and the mappings to
CloudCore policies and controls in place.

ID | NIST SP 800-53 Control Family          | CloudCore Policies and Controls
-- | ---                                    | ---
AC | Access Control                         | [Access][1]
AT | Awareness and Training                 | [Roles and Responsibilities][2]
AU | Audit and Accountability               | [Roles and Responsibilities][2]; [Compliance Audits][3]
CA | Security Assessment and Authorisation  | [Risk Management][4]; [Access][1]
CM | Configuration Management               | [Configuration and Change Management][5]
CP | Contingency Planning                   | [Business Continuity and Disaster Recovery][6]
IA | Identification and Authentication      | [Access][1]
IR | Incident Response                      | [Incident Response][7]; [Breach Notification][8]
MA | Maintenance                            | [Configuration and Change Management][5]
PE | Physical and Environmental Protection  | [Facility and Physical Security][9]
PL | Planning                               | [Security Program Overview][10]; [Security Architecture & Operating Model][11]
PS | Personnel Security                     | [HR & Personnel Security][12]
RA | Risk Assessment                        | [Risk Management][4]
SA | System and Services Acquisition        | [Third Party Security, Vendor Risk Management and Systems/Services Acquisition][13]
SC | System and Communications Protection   | [Data Management][14]; [Data Protection][15]; and [Threat Detection & Prevention][16]
SI | System and Information Integrity       | [Data Management][14]; [Data Protection][15]; [Product Security & Secure Software Development][17]; [Vulnerability Management][18];and [System Audits, Monitoring & Assessments][19]
PM | Program Management                     | [Security Program Overview][10]; [Roles and Responsibilities][2]; and [Policy Management][20]

[1]: ../policies/access.md
[2]: ../policies/rar.md
[3]: ../policies/compliance_audit.md
[4]: ../policies/risk_mgmt.md
[5]: ../policies/ccm.md
[6]: ../policies/bcdr.md
[7]: ../policies/ir.md
[8]: ../policies/breach.md
[9]: ../policies/facility.md
[10]: ../support/program.md
[11]: ../policies/model.md
[12]: ../policies/hr.md
[13]: ../policies/vendor.md
[14]: ../policies/data_mgmt.md
[15]: ../policies/data_protection.md
[16]: ../policies/threat.md
[17]: ../policies/sdlc.md
[18]: ../policies/vuln_mgmt.md
[19]: ../policies/system_audit.md
[20]: ../policies/policy_mgmt.md