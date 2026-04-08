# Mobile-First & Tailwind CSS Migration Guide

## ✅ Completed Phase 1: Foundation Setup

### Infrastructure
- [x] Updated package.json with latest Tailwind CSS 3.4.19
- [x] Created tailwind.config.js with mobile-first configuration
- [x] Created postcss.config.js with build pipeline
- [x] Updated main.css with @tailwind directives
- [x] Installed all NPM dependencies successfully

### Component Library Created
- [x] FormField.vue - Form field wrapper with label and error display
- [x] Input.vue - Text input with Tailwind styling
- [x] Select.vue - Select dropdown
- [x] Textarea.vue - Multi-line textarea
- [x] Button.vue - Button component with variants (primary, secondary, danger, ghost)
- [x] Card.vue - Card container
- [x] Checkbox.vue - Checkbox with label
- [x] Badge.vue - Badge with color variants (green, red, blue, purple, orange, teal)
- [x] Modal.vue - Modal dialog with header, body, footer slots
- [x] MultiSelect.vue - Button-based multi-select for chips
- [x] Table.vue - Table component with responsive overflow
- [x] TableCell.vue - Table cell with consistent padding

### Views Refactored
- [x] RequestForm.vue - Migrated to use all new UI components
  - Grid-based responsive layout (1 col mobile, 2 col tablet+)
  - FormField wrappers for organized spacing
  - MultiSelect for state requirements
  - All custom CSS replaced with Tailwind

- [x] ActionModal.vue - Migrated to use Modal component
  - Refactored to use new Modal wrapper
  - All form fields use new components
  - Maintained complex logic (file upload, conditional fields)

## 🟡 Phase 2: Component Migration (In Progress)

### Available Views Needing Migration
1. **DataMasterView.vue** - Settings management
   - Complex two-column layout (categories + CRUD table)
   - Requires Table component adaptation
   - Modal behavior for add/edit

2. **LoginView.vue** - Authentication
   - Form-based login
   - Simple refactor opportunity

3. **AppShell.vue** - Main layout wrapper
   - Sidebar navigation
   - Top navigation bar
   - Content area

4. **ToastContainer.vue** - Toast notifications
   - Uses custom CSS classes
   - Simple style refactor

### Other Views (Reference)
- DashboardView.vue - Dashboard with KPIs
- RequestsView.vue - Request listings
- RequestDetailView.vue - Request details
- ComponentsView.vue - Components list
- MenuSettingsView.vue - Menu configuration
- UsersView.vue - User management
- AuditView.vue - Audit logs
- MyTasksView.vue - Task list

## 🎨 Tailwind CSS Features Implemented

### Color System (CSS Variables in root)
```
Primary: --g (hsl(135adj, 90%, 40%))
Secondary: --gold
Neutral: --s100 through --s800
Status: green, red, blue, purple, orange, teal
```

### Responsive Breakpoints
- Mobile: default (< 640px)
- sm: 640px+ (small devices)
- md: 768px+ (tablets)
- lg: 1024px+ (desktops)
- xl: 1280px+ (large screens)
- 2xl: 1536px+ (ultra-wide)

### Mobile-First Approach
```html
<!-- Starts at mobile (single col) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- At md+ breakpoint, becomes 2 columns -->
</div>
```

## 📋 Migration Checklist Template

For each view migration:

1. **Identify styling patterns**
   - Custom classes (`.fr`, `.fg`, `.fi`, etc.)
   - Inline styles
   - Scoped CSS rules

2. **Replace with components**
   - Use FormField for form inputs
   - Use Button variants for actions
   - Use Card for containers
   - Use Table for data display

3. **Apply Tailwind utilities**
   - Spacing: `p-4`, `m-2`, `gap-3`
   - Colors: `bg-green-50`, `text-slate-700`
   - Layout: `grid`, `flex`, `w-full`
   - Responsive: `md:grid-cols-2`, `lg:p-8`

4. **Remove old CSS**
   - Delete scoped `<style>` blocks
   - Update parent components referencing classes

5. **Test responsive**
   - Mobile: 375px (DevTools)
   - Tablet: 768px
   - Desktop: 1440px

## 🚀 Next Steps

### Immediate (High Priority)
1. Migrate DataMasterView.vue using Table component
2. Migrate LoginView.vue using FormField components
3. Update AppShell.vue sidebar/navbar with Tailwind

### Medium Priority
4. Migrate ToastContainer.vue
5. Refactor other views (Dashboard, Requests, etc.)
6. Test all responsive breakpoints

### Final Phase
7. Dark mode testing (class-based toggle in AppShell)
8. Accessibility audit (color contrast, keyboard nav)
9. Performance testing and optimization

## 💡 Tips for Migration

1. **Use grid for multi-column layouts:**
   ```html
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
   ```

2. **Use flex for inline elements:**
   ```html
   <div class="flex items-center gap-2">
   ```

3. **Responsive text sizes:**
   ```html
   <h2 class="text-xl md:text-2xl font-bold">
   ```

4. **Conditional rendering based on breakpoints (CSS):**
   ```html
   <div class="hidden md:block">Desktop only</div>
   <div class="md:hidden">Mobile only</div>
   ```

5. **Keep component logic separate from styling:**
   - Business logic stays in `<script>`
   - Styling uses Tailwind classes
   - Complex layouts use new components

## 📊 Build & Deploy

### Development
```bash
cd frontend
npm install  # Already done
npx vite     # Starts on http://localhost:5173
```

### Production Build
```bash
npm run build  # Vite build (optimized CSS)
# Output: frontend/dist/
```

### Environment Variables
```
VITE_API_URL = http://localhost:3001  # or production API
```

## 📝 File Structure After Migration
```
frontend/src/
├── assets/
│   └── main.css (with @tailwind directives)
├── components/
│   ├── ui/
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   ├── Select.vue
│   │   ├── Textarea.vue
│   │   ├── FormField.vue
│   │   ├── Card.vue
│   │   ├── Checkbox.vue
│   │   ├── Badge.vue
│   │   ├── Modal.vue
│   │   ├── MultiSelect.vue
│   │   ├── Table.vue
│   │   └── index.js
│   ├── requests/
│   │   ├── RequestForm.vue (✅ migrated)
│   │   └── ActionModal.vue (✅ migrated)
│   └── shared/
│       └── ToastContainer.vue (🔄 pending)
├── views/
│   ├── AppShell.vue (🔄 pending)
│   ├── LoginView.vue (🔄 pending)
│   ├── DataMasterView.vue (🔄 pending)
│   ├── DashboardView.vue (🔄 pending)
│   └── ... (other views)
└── ... (stores, router, composables)
```

---

**Status:** Phase 1 complete. Phase 2 (component migration) ready to begin.
**Last Updated:** After RequestForm & ActionModal refactoring
**Dev Server:** Running on http://localhost:5173 ✅
