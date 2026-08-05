CREATE TYPE organization_type AS ENUM ('HOLDING', 'JVC', 'ASSET');
CREATE TYPE materiality_score AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
CREATE TYPE action_status AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'OVERDUE');
CREATE TYPE risk_category AS ENUM ('A', 'B', 'C', 'FI');

CREATE TABLE organizations (
  id serial PRIMARY KEY,
  name text NOT NULL,
  type organization_type NOT NULL DEFAULT 'JVC',
  parent_id integer,
  description text,
  location text,
  sector text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE frameworks (
  id serial PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  description text,
  is_global boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

CREATE TABLE disclosure_requirements (
  id serial PRIMARY KEY,
  framework_id integer NOT NULL REFERENCES frameworks(id),
  code text NOT NULL,
  title text NOT NULL,
  description text,
  taxonomy_data jsonb,
  requirement_type text,
  unit text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE mappings (
  id serial PRIMARY KEY,
  source_requirement_id integer NOT NULL REFERENCES disclosure_requirements(id),
  target_requirement_id integer NOT NULL REFERENCES disclosure_requirements(id),
  rationale text,
  mapping_type text DEFAULT 'EQUIVALENT',
  version text DEFAULT '1.0',
  created_at timestamp DEFAULT now()
);

CREATE TABLE data_points (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES organizations(id),
  requirement_id integer REFERENCES disclosure_requirements(id),
  period_start timestamp NOT NULL,
  period_end timestamp NOT NULL,
  value text,
  numeric_value double precision,
  unit text,
  source text,
  methodology text,
  owner text,
  status text DEFAULT 'DRAFT',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT data_points_period_order CHECK (period_end >= period_start)
);

CREATE TABLE materiality_assessments (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES organizations(id),
  topic text NOT NULL,
  impact_materiality materiality_score NOT NULL,
  financial_materiality materiality_score NOT NULL,
  rationale text,
  period text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE ghg_inventory (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES organizations(id),
  scope integer NOT NULL,
  category text,
  gas_type text DEFAULT 'CO2e',
  emissions double precision NOT NULL,
  unit text DEFAULT 'tCO2e',
  period_start timestamp NOT NULL,
  period_end timestamp NOT NULL,
  methodology text,
  location_based boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  CONSTRAINT ghg_inventory_scope CHECK (scope IN (1, 2, 3)),
  CONSTRAINT ghg_inventory_emissions_non_negative CHECK (emissions >= 0),
  CONSTRAINT ghg_inventory_period_order CHECK (period_end >= period_start)
);

CREATE TABLE actions (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES organizations(id),
  title text NOT NULL,
  description text,
  owner text,
  due_date timestamp,
  status action_status DEFAULT 'OPEN',
  priority text DEFAULT 'MEDIUM',
  source_type text,
  source_id integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE evidence (
  id serial PRIMARY KEY,
  data_point_id integer REFERENCES data_points(id),
  action_id integer REFERENCES actions(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE audit_logs (
  id serial PRIMARY KEY,
  table_name text NOT NULL,
  record_id integer NOT NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by text,
  timestamp timestamp DEFAULT now()
);

CREATE TABLE stakeholders (
  id serial PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  influence text,
  interest text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE engagements (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES organizations(id),
  stakeholder_id integer REFERENCES stakeholders(id),
  date timestamp NOT NULL,
  type text,
  summary text,
  key_outcomes text,
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX frameworks_name_version_idx ON frameworks(name, version);
CREATE UNIQUE INDEX disclosure_requirements_framework_code_idx ON disclosure_requirements(framework_id, code);
CREATE INDEX data_points_org_period_idx ON data_points(org_id, period_start, period_end);
CREATE INDEX ghg_inventory_org_scope_period_idx ON ghg_inventory(org_id, scope, period_start, period_end);
