-- Default Kanban stages. Admins can rename/recolor/reorder/deactivate these later
-- from Settings > Pipeline Configuration; this seed just gives a new workspace a
-- working board on day one.

insert into pipeline_stages (key, label, color, sort_order) values
  ('new', 'New', '#64748b', 1),
  ('contacted', 'Contacted', '#3b82f6', 2),
  ('follow_up', 'Follow-up', '#eab308', 3),
  ('awaiting_decision', 'Awaiting Decision', '#f97316', 4),
  ('approved', 'Approved', '#22c55e', 5),
  ('onboarded', 'Onboarded', '#0ea5e9', 6),
  ('rejected', 'Rejected', '#ef4444', 7),
  ('lost', 'Lost', '#78716c', 8)
on conflict (key) do nothing;
