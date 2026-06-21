export const config = {
  "title": "HIRA",
  "tagline": "Hazard Identification & Risk Assessment — score risk on a 5×5 matrix and apply the hierarchy of controls.",
  "org": "Northwind Industrial",
  "port": 5173,
  "walkthrough": [
    {
      "route": "/app/dashboard",
      "title": "Your risk dashboard",
      "sub": "Live KPIs: assessments, risk bands and control status."
    },
    {
      "route": "/app/create",
      "title": "Create a risk assessment",
      "sub": "Define activities, identify hazards (GEMS taxonomy), then score probability × severity."
    },
    {
      "route": "/app/repository",
      "title": "Assessment repository",
      "sub": "Every completed assessment, filterable by site, name and location."
    },
    {
      "route": "/app/action-tracker",
      "title": "Action Tracker",
      "sub": "Track control measures through to closure with due dates and owners."
    },
    {
      "route": "/app/bulk-import",
      "title": "Bulk import",
      "sub": "Import many hazards at once from a CSV template."
    }
  ],
  "closing": {
    "route": "/app/dashboard",
    "title": "HIRA — assess, control, track.",
    "sub": "Start by registering your organization."
  }
}
