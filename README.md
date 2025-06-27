# FAST frontend

## Analyze Page

- [To-Do] Remove Horizon Chart from Analyze page.
- [To-Do] Ensure only user-made analyses appear, and are editable (live documents).
- [To-Do] Allow users to build analyses from scratch with block-based editor (Notion-style).
- [To-Do] Standardize layout for tool results based on analysis type.
- [To-Do] Display user-made analyses sorted by tool used.
- [To-Do] Render tool outputs as reusable component blocks stored in the knowledgebase.
- [To-Do] Ensure tools use lab-wide exclude terms.
- [To-Do] Vertically stack graphs on the same timescale using Plotly.

## Forecast Page

- [To-Do] Inputs: Timeseries required, Subjects optional.
- [To-Do] Layout: Timeseries list on left, tools on right (or unified tool with configurations).
- [To-Do] Forecast results should feed into the Invention Generator.
- [To-Do] Vertically align all forecast graphs to same time axis.

## Gather Page

- [To-Do] Add taxonomy tree view (3 levels max) below the subject Kanban.
- [To-Do] Maintain Kanban for Subjects, but rename tags to 'Categories/Subcategories' and update icon.
- [To-Do] Consider redesigning Kanban to show uncategorized subjects in a horizontal bar.
- [To-Do] Remove Include/Exclude Terms section from Kanban.
- [To-Do] Add Horizon Chart to the Gather page.
- [To-Do] Implement Universal + Structured + Semi-/Unstructured Search.
- [Informational] Explore whether to separate or mix different types of search results.
- [To-Do] Use knowledgebase to pull in pre-made analyses and external documents.
- [To-Do] Display snippet previews from knowledgebase queries.

## General System Tasks

- [To-Do] Create User Profile page.
- [To-Do] Coordinate with Auny for photo upload system (Labs & Users).
- [To-Do] Complete Homepage with usage stats and pipeline visualization.
- [To-Do] Display 'Imagination > Science > Engineering > Business' flow across app.
- [To-Do] Complete Team Management page.
- [To-Do] Audit MongoDB collections (taxonomy, subject metadata, etc.).
- [To-Do] Design lab creation flow: ingest CSV or allow table-building.
- [To-Do] Improve data flow representation using arrows, icons, buckets.
- [To-Do] Reduce use of boxed layouts — emphasize flow and progression.

## Invent Page

- [To-Do] Add Invention Generator at top, using entire knowledgebase as input.
- [To-Do] Below generator, add IdeaSeed viewer (adaptive based on content/stage).
- [To-Do] Structure IdeaSeeds as graph or tree.
- [To-Do] Explore UI: accordion flowchart or GitHub-style minimap navigation.
- [To-Do] Mark Brainstorming board as one-time setup (but allow subject additions).
- [Informational] IdeaSeeds are less data-driven, more opinion/imagination focused.

## Labs & Plan Tab

- [To-Do] Add a 'Plan' tab before 'Gather' with editable overview card.
- [To-Do] Overview card includes: Goals, Users, Include/Exclude Terms (accordion-style).
- [To-Do] Move lab goals to Plan tab or lab header.
- [Informational] Lab goals follow a JSON-schema-based object structure.
- [To-Do] Add lab header image (requires photo upload capability).
- [Informational] Overview card may only be editable by users with certain access level.

## Naming & Signposts

- [To-Do] Rename 'Draft' to a more meaningful term (e.g., Proto-lab, Sandbox, Seed Lab).
- [To-Do] Ensure 'Cluster Coefficient' replaces 'Coherence' everywhere.
- [To-Do] Add a blue hexagon badge or icon to identify Subject cards throughout the app.
- [To-Do] Change 'Available Subjects' to 'Subjects of Interest' on Whiteboard.
- [To-Do] Brainstorm additional whiteboard metrics (besides cluster coefficient).

## Navbar Structure & Identity

- [To-Do] Reorder navbar items from least personal to most personal: Labs → Team → My Whiteboard → Profile.
- [To-Do] Add visual separator between main navbar and search bar.
- [To-Do] Rename 'Whiteboard' to 'My Whiteboard' and ensure it's always visible.
- [To-Do] Ensure search bar supports Subjects, Organizations, and Public Analyses.
- [Informational] Search bar may support toggling between categories in future.
