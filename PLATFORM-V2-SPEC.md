# Platform V2 Detailed Specifications

## 🎯 **User Stories**

### **Student (Primary User)**
- **As a student**, I want to investigate a realistic business scenario so I can practice professional skills
- **As a student**, I want to schedule meetings with company staff so I can gather information systematically
- **As a student**, I want to receive email confirmations so the experience feels authentic
- **As a student**, I want to access multimedia content (audio, video, documents) so I can analyze diverse evidence
- **As a student**, I want to track my investigation progress so I know what I've completed
- **As a student**, I want to collaborate with teammates so we can share findings and insights

### **Unit Coordinator (Content Creator)**
- **As a UC**, I want to create custom company scenarios so my students get relevant practice
- **As a UC**, I want to upload any file type (Word, Excel, PDF, audio, video) so I can provide rich content
- **As a UC**, I want to schedule events (meetings, incidents, revelations) so the story unfolds realistically
- **As a UC**, I want to customize company branding and content so each unit has its own experience
- **As a UC**, I want to see student engagement analytics so I can improve my scenarios
- **As a UC**, I want simple content editing so I don't need technical skills

### **Site Administrator (Platform Manager)**
- **As an admin**, I want to manage multiple institutions so the platform can scale
- **As an admin**, I want to monitor system performance so the platform stays reliable
- **As an admin**, I want to create new UC accounts so institutions can self-manage
- **As an admin**, I want to backup and restore data so content is never lost

## 🏗️ **Technical Architecture**

### **Database Schema**

```sql
-- Core Tables

CREATE TABLE institutions (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE units (
  id UUID PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id),
  code VARCHAR(50) NOT NULL, -- ISYS6018
  name VARCHAR(255) NOT NULL,
  coordinator_id UUID REFERENCES users(id),
  company_template VARCHAR(100),
  settings JSONB,
  active BOOLEAN DEFAULT true
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin, coordinator, student
  unit_ids UUID[], -- Array of accessible units
  profile JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content Management

CREATE TABLE companies (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  name VARCHAR(255) NOT NULL,
  template VARCHAR(100),
  branding JSONB, -- colors, logo, styling
  backstory TEXT,
  current_state JSONB, -- dynamic company state
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE characters (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  department VARCHAR(255),
  personality JSONB,
  schedule JSONB,
  status VARCHAR(50), -- available, in_meeting, out_of_office
  ai_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- document, policy, email, memo, audio, video
  file_path VARCHAR(500),
  markdown_content TEXT,
  metadata JSONB,
  access_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Simulation Engine

CREATE TABLE scenarios (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  timeline JSONB, -- array of events with triggers
  status VARCHAR(50), -- draft, active, completed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- meeting, incident, revelation, deadline
  scheduled_for TIMESTAMP,
  triggered_by JSONB, -- conditions that trigger this event
  content JSONB, -- event details, emails to send, etc.
  completed BOOLEAN DEFAULT false
);

CREATE TABLE student_sessions (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  start_time TIMESTAMP DEFAULT NOW(),
  progress JSONB, -- completed events, accessed content
  status VARCHAR(50) -- active, paused, completed
);

-- Chatbot System

CREATE TABLE meetings (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  character_id UUID REFERENCES characters(id),
  scheduled_for TIMESTAMP,
  duration_minutes INTEGER,
  status VARCHAR(50), -- scheduled, confirmed, cancelled, completed
  meeting_link VARCHAR(500),
  transcript TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE character_availability (
  id UUID PRIMARY KEY,
  character_id UUID REFERENCES characters(id),
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
  start_time TIME,
  end_time TIME,
  available BOOLEAN DEFAULT true
);

CREATE TABLE character_exceptions (
  id UUID PRIMARY KEY,
  character_id UUID REFERENCES characters(id),
  date DATE,
  reason VARCHAR(255), -- "Board meeting", "Vacation", "Sick"
  available BOOLEAN DEFAULT false
);
```

### **API Design**

```typescript
// Core API Endpoints

// Authentication
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// Companies & Scenarios
GET    /api/companies/:unitId
POST   /api/companies
PUT    /api/companies/:id
DELETE /api/companies/:id

GET    /api/companies/:id/characters
POST   /api/companies/:id/characters
PUT    /api/characters/:id
DELETE /api/characters/:id

// Content Management
GET    /api/companies/:id/content
POST   /api/companies/:id/content
PUT    /api/content/:id
DELETE /api/content/:id
POST   /api/content/:id/upload

// Simulation Engine
GET    /api/companies/:id/scenarios
POST   /api/companies/:id/scenarios
PUT    /api/scenarios/:id
POST   /api/scenarios/:id/start
POST   /api/scenarios/:id/events

// Chatbot & Scheduling
GET    /api/characters/:id/availability
POST   /api/characters/:id/schedule
GET    /api/meetings/mine
PUT    /api/meetings/:id
DELETE /api/meetings/:id

// Analytics
GET    /api/units/:id/analytics
GET    /api/students/:id/progress
GET    /api/companies/:id/engagement
```

### **Frontend Components**

```typescript
// UC Dashboard Components
const CompanyBuilder = () => {
  // Drag-and-drop scenario creator
  // Character relationship mapper
  // Event timeline editor
};

const ContentManager = () => {
  // File upload with type detection
  // Markdown editor with preview
  // Access rule configuration
};

const AnalyticsDashboard = () => {
  // Student engagement metrics
  // Content access patterns
  // Chatbot interaction analysis
};

// Student Interface Components
const CompanyPortal = () => {
  // Responsive company website
  // Navigation based on access rules
  // Progress tracking sidebar
};

const CharacterDirectory = () => {
  // Staff listing with availability
  // Meeting scheduling interface
  // Character profiles and roles
};

const MeetingScheduler = () => {
  // Calendar integration
  // Time slot selection
  // Email confirmation system
};

// Chatbot Components
const CharacterChat = () => {
  // Real-time messaging
  // Context-aware responses
  // Meeting booking integration
};

const AvailabilityWidget = () => {
  // Real-time status display
  // Next available time
  // Out-of-office messages
};
```

## 🎮 **Feature Specifications**

### **1. Company Template System**

```typescript
interface CompanyTemplate {
  id: string;
  name: string; // "Tech Startup", "Financial Services"
  description: string;
  industry: string;
  defaultStructure: {
    departments: Department[];
    roles: Role[];
    relationships: Relationship[];
  };
  scenarios: ScenarioTemplate[];
  branding: {
    colorScheme: string[];
    logoPlaceholder: string;
    typography: TypographySettings;
  };
}

interface ScenarioTemplate {
  name: string;
  duration: string; // "2 weeks", "1 month"
  events: EventTemplate[];
  learningObjectives: string[];
  assessmentCriteria: string[];
}

interface EventTemplate {
  day: number;
  time: string;
  type: 'incident' | 'meeting' | 'revelation' | 'deadline';
  trigger: 'automatic' | 'student_action' | 'manual';
  content: {
    title: string;
    description: string;
    documents?: string[];
    emails?: EmailTemplate[];
  };
}
```

### **2. Dynamic Event System**

```typescript
interface Event {
  id: string;
  scenarioId: string;
  name: string;
  type: EventType;
  scheduledFor: Date;
  conditions: EventCondition[];
  actions: EventAction[];
  status: 'pending' | 'triggered' | 'completed';
}

interface EventCondition {
  type: 'time_passed' | 'student_action' | 'content_accessed';
  parameters: any;
}

interface EventAction {
  type: 'send_email' | 'unlock_content' | 'schedule_meeting' | 'character_status_change';
  parameters: any;
}

// Example Event Configuration
const dataBreachEvent: Event = {
  name: "Data Breach Discovery",
  type: "incident",
  scheduledFor: new Date("2024-03-15T09:00:00"),
  conditions: [
    {
      type: "time_passed",
      parameters: { afterEvent: "semester_start", days: 7 }
    }
  ],
  actions: [
    {
      type: "send_email",
      parameters: {
        from: "sophia_martines",
        to: "all_staff",
        template: "emergency_all_hands",
        subject: "URGENT: Security Incident Response"
      }
    },
    {
      type: "character_status_change",
      parameters: {
        characterId: "sophia_martines",
        status: "emergency_mode",
        duration: "24_hours"
      }
    },
    {
      type: "unlock_content",
      parameters: {
        contentIds: ["incident_report_1", "forensic_logs"],
        accessLevel: "consultant"
      }
    }
  ]
};
```

### **3. Chatbot Scheduling System**

```typescript
interface CharacterSchedule {
  characterId: string;
  workingHours: TimeSlot[];
  timeZone: string;
  exceptions: ScheduleException[];
  meetingDuration: number; // minutes
  bufferTime: number; // minutes between meetings
}

interface TimeSlot {
  dayOfWeek: number; // 0-6
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

interface ScheduleException {
  date: string; // "2024-03-15"
  reason: string; // "Board meeting", "Conference travel"
  type: 'unavailable' | 'limited_availability' | 'emergency_only';
  alternativeContact?: string; // "Contact my assistant"
}

interface MeetingRequest {
  studentId: string;
  characterId: string;
  preferredTimes: Date[];
  duration: number;
  topic: string;
  urgency: 'low' | 'medium' | 'high';
}

// Meeting Scheduler Logic
class MeetingScheduler {
  async scheduleMeeting(request: MeetingRequest): Promise<Meeting> {
    const character = await this.getCharacter(request.characterId);
    const availableSlots = await this.getAvailableSlots(character, request.preferredTimes);
    
    if (availableSlots.length === 0) {
      throw new Error("No available time slots");
    }
    
    const meeting = await this.createMeeting({
      ...request,
      scheduledFor: availableSlots[0],
      status: 'scheduled'
    });
    
    // Send confirmation email
    await this.sendConfirmationEmail(meeting);
    
    // Randomly schedule cancellations (for realism)
    if (Math.random() < 0.1) { // 10% chance
      await this.scheduleRandomCancellation(meeting);
    }
    
    return meeting;
  }
  
  async scheduleRandomCancellation(meeting: Meeting): Promise<void> {
    const cancellationTime = new Date(meeting.scheduledFor.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before
    
    setTimeout(async () => {
      await this.cancelMeeting(meeting.id, "urgent_board_meeting");
      await this.sendCancellationEmail(meeting);
    }, cancellationTime.getTime() - Date.now());
  }
}
```

### **4. Email Integration (Brevo)**

```typescript
interface EmailService {
  sendMeetingConfirmation(meeting: Meeting): Promise<void>;
  sendMeetingCancellation(meeting: Meeting, reason: string): Promise<void>;
  sendEventNotification(event: Event, recipients: string[]): Promise<void>;
  sendWeeklyDigest(studentId: string, progress: StudentProgress): Promise<void>;
}

class BrevoEmailService implements EmailService {
  async sendMeetingConfirmation(meeting: Meeting): Promise<void> {
    const character = await this.getCharacter(meeting.characterId);
    const student = await this.getStudent(meeting.studentId);
    
    const emailTemplate = {
      to: student.email,
      from: `${character.name} <${character.email}>`,
      subject: `Meeting Confirmed: ${meeting.topic}`,
      template: 'meeting_confirmation',
      variables: {
        studentName: student.name,
        characterName: character.name,
        meetingTime: meeting.scheduledFor.toLocaleString(),
        meetingDuration: meeting.duration,
        meetingTopic: meeting.topic,
        meetingLink: meeting.link,
        characterTitle: character.role
      }
    };
    
    await this.brevoClient.sendEmail(emailTemplate);
  }
  
  async sendEventNotification(event: Event, recipients: string[]): Promise<void> {
    // Send dynamic emails based on event type
    // Examples: "Security breach detected", "Audit findings available"
  }
}
```

### **5. Analytics and Progress Tracking**

```typescript
interface StudentProgress {
  studentId: string;
  companyId: string;
  startDate: Date;
  completionPercentage: number;
  contentAccessed: ContentAccess[];
  meetingsScheduled: Meeting[];
  eventsTriggered: Event[];
  timeSpent: number; // minutes
  skillsAssessed: SkillAssessment[];
}

interface EngagementMetrics {
  totalStudents: number;
  averageTimeSpent: number;
  contentPopularity: ContentPopularity[];
  chatbotInteractions: ChatbotMetrics[];
  learningOutcomes: LearningOutcome[];
}

interface LearningOutcome {
  skillArea: string; // "Communication", "Analysis", "Technical"
  preAssessment: number;
  postAssessment: number;
  improvement: number;
  confidence: number;
}

class AnalyticsService {
  async generateUCDashboard(unitId: string): Promise<UnitAnalytics> {
    return {
      overview: await this.getUnitOverview(unitId),
      studentProgress: await this.getStudentProgress(unitId),
      contentEngagement: await this.getContentEngagement(unitId),
      chatbotMetrics: await this.getChatbotMetrics(unitId),
      learningOutcomes: await this.getLearningOutcomes(unitId)
    };
  }
  
  async trackStudentAction(action: StudentAction): Promise<void> {
    // Track every click, content access, meeting booking
    // Build rich analytics for improving educational outcomes
  }
}
```

## 🎨 **UI/UX Specifications**

### **Design System**

```typescript
// Color Schemes for Different Company Templates
const colorSchemes = {
  tech_startup: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#f093fb',
    neutral: '#718096'
  },
  financial_services: {
    primary: '#2d3748',
    secondary: '#4a5568',
    accent: '#48bb78',
    neutral: '#a0aec0'
  },
  healthcare: {
    primary: '#3182ce',
    secondary: '#2c5282',
    accent: '#38b2ac',
    neutral: '#718096'
  }
};

// Responsive Breakpoints
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
};

// Typography Scale
const typography = {
  headings: {
    h1: { size: '2.5rem', weight: '700', lineHeight: '1.2' },
    h2: { size: '2rem', weight: '600', lineHeight: '1.3' },
    h3: { size: '1.5rem', weight: '600', lineHeight: '1.4' }
  },
  body: {
    large: { size: '1.125rem', weight: '400', lineHeight: '1.6' },
    medium: { size: '1rem', weight: '400', lineHeight: '1.5' },
    small: { size: '0.875rem', weight: '400', lineHeight: '1.4' }
  }
};
```

### **Key Interface Mockups**

```typescript
// UC Dashboard Layout
const UCDashboardLayout = () => (
  <Grid areas={`
    "header header header"
    "sidebar main analytics"
    "sidebar main analytics"
  `} columns="250px 1fr 300px">
    
    <Header area="header">
      <UnitSelector />
      <NotificationBell />
      <UserMenu />
    </Header>
    
    <Sidebar area="sidebar">
      <NavItem icon="🏢" label="Company Overview" />
      <NavItem icon="👥" label="Characters" />
      <NavItem icon="📄" label="Content" />
      <NavItem icon="📅" label="Events" />
      <NavItem icon="📊" label="Analytics" />
      <NavItem icon="⚙️" label="Settings" />
    </Sidebar>
    
    <MainContent area="main">
      <TabContainer>
        <Tab label="Company Builder" />
        <Tab label="Content Manager" />
        <Tab label="Event Timeline" />
      </TabContainer>
    </MainContent>
    
    <AnalyticsPanel area="analytics">
      <QuickStats />
      <RecentActivity />
      <StudentProgress />
    </AnalyticsPanel>
  </Grid>
);

// Student Portal Layout
const StudentPortalLayout = () => (
  <Layout>
    <CompanyHeader>
      <CompanyLogo />
      <Navigation />
      <ProgressIndicator />
    </CompanyHeader>
    
    <MainArea>
      <ContentGrid>
        <ContentCard type="document" />
        <ContentCard type="character" />
        <ContentCard type="meeting" />
      </ContentGrid>
    </MainArea>
    
    <Sidebar>
      <UpcomingMeetings />
      <RecentDocuments />
      <ContactDirectory />
    </Sidebar>
  </Layout>
);
```

## 📱 **Mobile Specifications**

### **Progressive Web App Features**
- **Offline Access:** Cache essential content for reading without internet
- **Push Notifications:** Meeting reminders, new content alerts
- **Home Screen Install:** Full app-like experience
- **Touch Gestures:** Swipe navigation, pull-to-refresh
- **Camera Integration:** Upload photos of physical documents

### **Mobile-First Design**
```css
/* Mobile-first responsive design */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* Touch-friendly interactive elements */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

.meeting-slot {
  padding: 16px;
  margin: 8px 0;
  border-radius: 8px;
  font-size: 16px; /* Prevent zoom on iOS */
}
```

## 🔒 **Security & Privacy Specifications**

### **Data Protection**
- **GDPR Compliance:** Right to export, delete, and modify personal data
- **Student Privacy:** No tracking beyond educational purposes
- **Institutional Isolation:** Complete data separation between institutions
- **Encryption:** All data encrypted at rest and in transit
- **Access Logging:** Audit trail for all data access

### **Authentication & Authorization**
```typescript
interface Permission {
  resource: string; // 'companies', 'students', 'content'
  action: string;   // 'read', 'write', 'delete', 'admin'
  scope: string;    // 'own_unit', 'own_institution', 'global'
}

interface Role {
  name: string;
  permissions: Permission[];
}

const roles: Role[] = [
  {
    name: 'student',
    permissions: [
      { resource: 'content', action: 'read', scope: 'assigned_company' },
      { resource: 'meetings', action: 'create', scope: 'own' },
      { resource: 'progress', action: 'read', scope: 'own' }
    ]
  },
  {
    name: 'unit_coordinator',
    permissions: [
      { resource: 'companies', action: 'write', scope: 'own_unit' },
      { resource: 'students', action: 'read', scope: 'own_unit' },
      { resource: 'analytics', action: 'read', scope: 'own_unit' }
    ]
  },
  {
    name: 'institution_admin',
    permissions: [
      { resource: 'units', action: 'admin', scope: 'own_institution' },
      { resource: 'users', action: 'admin', scope: 'own_institution' }
    ]
  }
];
```

## 🚀 **Performance Requirements**

### **Technical Targets**
- **Page Load Time:** < 2 seconds on 3G connection
- **Server Response:** < 200ms for API calls
- **Uptime:** 99.9% availability
- **Concurrent Users:** Support 1000+ simultaneous users
- **Data Backup:** Automated daily backups with point-in-time recovery

### **Scalability Planning**
```typescript
// Database partitioning strategy
const partitioningStrategy = {
  horizontal: {
    table: 'student_sessions',
    partitionKey: 'institution_id',
    reasoning: 'Isolate institutional data for compliance'
  },
  vertical: {
    table: 'content',
    splitColumns: ['file_data'],
    reasoning: 'Separate metadata from large file content'
  }
};

// Caching strategy
const cachingLayers = {
  cdn: 'Static assets (images, videos, documents)',
  redis: 'Session data, character availability, API responses',
  browser: 'Company branding, navigation, user preferences'
};
```

---

**This specification provides the technical foundation for building Platform V2 while maintaining the educational focus that makes the current system successful.**