-- Idempotent starter vocabulary for a brand-new Supabase project.
-- Existing SQLite-to-Supabase migrations can run this safely; existing rows are preserved.

INSERT INTO courses (id, name, is_active) VALUES
  ('software-dev', 'Software Development', 1),
  ('business-dev', 'Business Development', 1)
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, name, is_active) VALUES
  ('technical', 'Technical', 1),
  ('business', 'Business', 1)
ON CONFLICT DO NOTHING;

INSERT INTO skills (id, name, is_active) VALUES
  ('react', 'React', 1),
  ('javascript', 'JavaScript', 1),
  ('ui-design', 'UI design', 1),
  ('accessibility', 'Accessibility', 1),
  ('nodejs', 'Node.js', 1),
  ('python', 'Python', 1),
  ('market-research', 'Market research', 1),
  ('marketing', 'Marketing', 1),
  ('product-strategy', 'Product strategy', 1),
  ('accounting-bookkeeping', 'Accounting and bookkeeping', 1),
  ('budgeting-forecasting', 'Budgeting and forecasting', 1),
  ('business-analysis', 'Business analysis', 1),
  ('business-development', 'Business development', 1),
  ('business-planning', 'Business planning', 1),
  ('content-marketing', 'Content marketing', 1),
  ('customer-relationship-management', 'Customer relationship management', 1),
  ('customer-service', 'Customer service', 1),
  ('data-analysis', 'Data analysis', 1),
  ('digital-marketing', 'Digital marketing', 1),
  ('entrepreneurship', 'Entrepreneurship', 1),
  ('financial-analysis', 'Financial analysis', 1),
  ('human-resources', 'Human resources', 1),
  ('leadership', 'Leadership', 1),
  ('negotiation', 'Negotiation', 1),
  ('operations-management', 'Operations management', 1),
  ('presentation-skills', 'Presentation skills', 1),
  ('project-management', 'Project management', 1),
  ('sales', 'Sales', 1),
  ('strategic-planning', 'Strategic planning', 1),
  ('supply-chain-management', 'Supply chain management', 1),
  ('team-management', 'Team management', 1)
ON CONFLICT DO NOTHING;

INSERT INTO interests (id, name, is_active) VALUES
  ('education', 'Education', 1),
  ('design', 'Design', 1),
  ('sustainability', 'Sustainability', 1),
  ('technology', 'Technology', 1),
  ('entrepreneurship', 'Entrepreneurship', 1)
ON CONFLICT DO NOTHING;

INSERT INTO connection_goals (id, name, is_active) VALUES
  ('project-collaboration', 'Project collaboration', 1),
  ('cofounder-partnership', 'Co-founder partnership', 1),
  ('peer-support', 'Peer support', 1),
  ('friendship', 'Friendship', 1)
ON CONFLICT DO NOTHING;
