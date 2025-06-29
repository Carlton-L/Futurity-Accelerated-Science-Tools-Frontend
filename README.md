# FAST frontend

# Futurity App - Updated Task List & Prioritization

## Overview

**Total Tasks: 52** across 8 categories

**Updated Development Priority:**

1. **Phase 1: New Pages (Immediate)** - Create missing pages and core navigation structure
2. **Phase 2: Layout Changes** - Structural UI changes within existing pages
3. **Phase 3: Tool Integration (Functions)** - Backend integration and core functionality
4. **Phase 4: Detail Modifications (Polish)** - UI/UX refinements and advanced features

---

## Phase 1: New Pages (Immediate Priority)

_Create missing pages and core navigation structure_

### 🆕 Critical New Pages (4 tasks)

**Core User Interface Pages**

- 📝 **Task 44**: Create User Profile page
- 📝 **Task 46**: Complete Homepage with usage stats and pipeline visualization
- 📝 **Task 48**: Complete Team Management page
- 📝 **Task 50**: Design lab creation flow: ingest CSV or allow table-building

---

## Phase 2: Layout Changes (High Priority)

_Structural UI changes within existing pages that don't require backend integration_

### ✅ **COMPLETED: Navbar & Plan Structure (6 tasks)**

**Navbar Structure & Identity**

- ✅ **Task 1**: Reorder navbar items from least personal to most personal: Labs → Team → My Whiteboard → Profile
- ✅ **Task 2**: Add visual separator between main navbar and search bar
- ✅ **Task 3**: Rename 'Whiteboard' to 'My Whiteboard' and ensure it's always visible

**Labs & Plan Tab**

- ✅ **Task 11**: Add a 'Plan' tab before 'Gather' with editable overview card
- ✅ **Task 12**: Overview card includes: Goals, Users, Include/Exclude Terms (accordion-style)
- ✅ **Task 13**: Move lab goals to Plan tab or lab header

### ✅ **COMPLETED: Naming & Signposts (4 tasks)**

- ✅ **Task 6**: Rename 'Draft' to "Lab Seed"
- ✅ **Task 7**: Ensure 'Cluster Coefficient' replaces 'Coherence' everywhere
- ✅ **Task 8**: Add a blue hexagon badge or icon to identify Subject cards throughout the app
- ✅ **Task 9**: Change 'Available Subjects' to 'Subjects of Interest' on Whiteboard

### 🔄 **IN PROGRESS: Gather Page (3 tasks)**

- 🔄 **Task 18**: Maintain Kanban for Subjects, but rename tags to 'Categories/Subcategories' and update icon
- 🔄 **Task 19**: Consider redesigning Kanban to show uncategorized subjects in a horizontal bar
- 🔄 **Task 20**: Remove Include/Exclude Terms section from Kanban

### 🎯 **NEXT: Lab Page Layout - Analyze (4 tasks)**

**Analyze Page**

- 📝 **Task 26**: Remove Horizon Chart from Analyze page
- 📝 **Task 27**: Ensure only user-made analyses appear, and are editable (live documents)
- 📝 **Task 29**: Standardize layout for tool results based on analysis type
- 📝 **Task 30**: Display user-made analyses sorted by tool used

### 🎯 **NEXT: Lab Page Layout - Forecast (2 tasks)**

**Forecast Page**

- 📝 **Task 35**: Layout: Timeseries list on left, tools on right (or unified tool with configurations)
- 📝 **Task 37**: Vertically align all forecast graphs to same time axis

### 🎯 **NEXT: Lab Page Layout - Invent (3 tasks)**

**Invent Page**

- 📝 **Task 39**: Below generator, add IdeaSeed viewer (adaptive based on content/stage)
- 📝 **Task 40**: Structure IdeaSeeds as graph or tree
- 📝 **Task 42**: Mark Brainstorming board as one-time setup (but allow subject additions)

### 🎯 **NEXT: Additional Layout Components (3 tasks)**

**New Components Within Existing Pages**

- 📝 **Task 17**: Add taxonomy tree view (3 levels max) below the subject Kanban
- 📝 **Task 21**: Add Horizon Chart to the Gather page
- 📝 **Task 51**: Improve data flow representation using arrows, icons, buckets

### 🎯 **NEXT: Visual Identity & System (2 tasks)**

**Overall System Improvements**

- 📝 **Task 47**: Display 'Imagination > Science > Engineering > Business' flow across app
- 📝 **Task 52**: Reduce use of boxed layouts — emphasize flow and progression

---

## Phase 3: Tool Integration (Functions)

_Backend coordination and core functionality implementation_

### 🔧 **Search & Data Integration (4 tasks)**

- 📝 **Task 4**: Ensure search bar supports Subjects, Organizations, and Public Analyses
- 📝 **Task 22**: Implement Universal + Structured + Semi-/Unstructured Search
- 📝 **Task 24**: Use knowledgebase to pull in pre-made analyses and external documents
- 📝 **Task 25**: Display snippet previews from knowledgebase queries

### 🔧 **Analysis Tools (6 tasks)**

- 📝 **Task 28**: Allow users to build analyses from scratch with block-based editor (Notion-style)
- 📝 **Task 31**: Render tool outputs as reusable component blocks stored in the knowledgebase
- 📝 **Task 32**: Ensure tools use lab-wide exclude terms
- 📝 **Task 33**: Vertically stack graphs on the same timescale using Plotly

### 🔧 **Forecast Tools (2 tasks)**

- 📝 **Task 34**: Inputs: Timeseries required, Subjects optional
- 📝 **Task 36**: Forecast results should feed into the Invention Generator

### 🔧 **Invent Tools (2 tasks)**

- 📝 **Task 38**: Add Invention Generator at top, using entire knowledgebase as input
- 📝 **Task 41**: Explore UI: accordion flowchart or GitHub-style minimap navigation

### 🔧 **Backend & Data Management (4 tasks)**

**Photo Upload System**

- 📝 **Task 15**: Add lab header image (requires photo upload capability)
- 📝 **Task 45**: Coordinate with Auny for photo upload system (Labs & Users)

**Data Structure & Management**

- 📝 **Task 49**: Audit MongoDB collections (taxonomy, subject metadata, etc.)

**Team & Access Management**

- 📝 **Task 16**: Overview card may only be editable by users with certain access level

---

## Phase 4: Detail Modifications & Future Considerations

_UI/UX refinements, advanced features, and future considerations_

### ✨ **Advanced Features & Future Considerations (5 tasks)**

**System Architecture**

- 📝 **Task 5**: Search bar may support toggling between categories in future
- 📝 **Task 14**: Lab goals follow a JSON-schema-based object structure
- 📝 **Task 23**: Explore whether to separate or mix different types of search results
- 📝 **Task 43**: IdeaSeeds are less data-driven, more opinion/imagination focused

**Additional Metrics**

- ✅ **Task 10**: Brainstorm additional whiteboard metrics (besides cluster coefficient)

---

## Implementation Strategy

### ✅ **Completed (14 tasks)**

- All Navbar Structure & Identity tasks
- All Labs & Plan Tab tasks
- All Naming & Signposts tasks
- Whiteboard metrics brainstorming

### 🔄 **Current Focus (3 tasks)**

- Gather Page improvements (Tasks 18-20)

### 🆕 **Immediate Next (4 tasks)**

- **User Profile Page** (Task 44)
- **Homepage** (Task 46)
- **Team Management Page** (Task 48)
- **Lab Creation Flow** (Task 50)

### 🎯 **Short-term Goals (13 tasks)**

- Complete all Lab Page Layout changes (Analyze, Forecast, Invent)
- Add remaining layout components (taxonomy tree, horizon chart, data flow)
- Visual identity improvements

### 🔧 **Medium-term Goals (18 tasks)**

- Search system integration
- Analysis tools (block editor, reusable components)
- Forecast and Invent tool implementations
- Backend coordination (photo upload, data management)

---

## Task Status Summary

- **✅ Completed**: 14 tasks
- **🔄 In Progress**: 3 tasks (Gather page)
- **📝 To Do**: 35 tasks
- **Total**: 52 tasks

### By Phase:

- **Phase 1 (New Pages)**: 4 tasks
- **Phase 2 (Layout)**: 21 tasks (14 completed, 3 in progress, 4 remaining)
- **Phase 3 (Functions)**: 18 tasks
- **Phase 4 (Polish)**: 5 tasks

---

## Notes

- **Lab Seed** chosen as replacement for "Draft" (Task 6 completed)
- Search functionality differentiated: Navbar search (internal) vs. Gather search (external web data)
- Photo upload system requires backend coordination with Auny
- Goals structure and impact scale already well-defined
- IdeaSeed concept: Generated inventions that evolve through additional tools and maintain version history

### Goals Structure (from Task 14):

```json
{
  "name": "string",
  "description": "string",
  "user_groups": [{ "description": "string", "size": "int" }],
  "problem_statements": [{ "description": "string" }],
  "impact_level": "int (0-100)"
}
```

### Impact Scale:

11 levels from "Personal Spark (0-9%)" to "Existential Game-Changer (100%)"

# Tutorials/Info:

## Impact Score:

🌀 Impact Scale (0–100%)
Measures how deeply and widely a product or invention affects people, systems, or the world.

Level 1: Personal Spark (0–9%)
Impacts a few individuals on a personal level. Sparks joy, ease, or expression. Small but meaningful.

Level 2: Niche Value (10–19%)
Helps a specific group with particular needs or interests. Deep, focused usefulness over mass appeal.

Level 3: Everyday Convenience (20–29%)
Improves daily life in small ways for a limited audience. Adds ease, saves time, or removes friction.

Level 4: Community Enhancer (30–39%)
Supports a team, neighborhood, or local group. Encourages connection, access, or collaboration.

Level 5: Wider Reach (40–49%)
Addresses common needs across regions or demographics. Broadly useful in everyday contexts.

Level 6: Cultural Shaper (50–59%)
Influences how people think, create, or interact. Shifts norms, aesthetics, education, or behavior.

Level 7: Systemic Improver (60–69%)
Enhances large-scale systems like health, mobility, or governance. Improves fairness, access, or efficiency.

Level 8: Societal Catalyst (70–79%)
Drives national or international change. Impacts laws, economies, or ecosystems at scale.

Level 9: Global Transformer (80–89%)
Tackles global challenges. Affects millions across multiple sectors (e.g. clean energy, global education).

Level 10: Civilizational Shifter (90–99%)
Alters humanity’s trajectory. Transforms how we live, govern, or relate to the planet.

Bonus Level: Existential Game-Changer (100%)
Prevents extinction, enables interstellar life, or redefines human potential. Think: AI alignment, climate reversal, or post-scarcity breakthroughs.
